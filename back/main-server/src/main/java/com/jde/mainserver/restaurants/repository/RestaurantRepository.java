/**
 * restaurants/repository/RestaurantRepository.java
 * 식당 레포지토리
 * Author: Jang
 * Date: 2025-11-03
 *
 */

package com.jde.mainserver.restaurants.repository;

import com.jde.mainserver.restaurants.entity.Restaurant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long>, JpaSpecificationExecutor<Restaurant> {

	Optional<Restaurant> findById(Long id);
	/** 여러 ID로 일괄 조회 (피드/추천용) - hours 포함 */
	@EntityGraph(attributePaths = {"hours"})
	List<Restaurant> findAllByIdIn(Collection<Long> ids);
	
	/** 여러 ID로 일괄 조회 (약속 생성용) - hours 제외 (성능 최적화) */
	@Query("SELECT r FROM Restaurant r WHERE r.id IN :ids")
	List<Restaurant> findAllByIdInWithoutHours(@Param("ids") Collection<Long> ids);

	/** 반경 내 + 거리순 정렬 (페이징) */
	@Query(
			value = """
			    SELECT *
			    FROM restaurant r
			    WHERE ST_DWithin(
			        r.geom::geography,
			        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
			        :meters
			    )
			    ORDER BY ST_Distance(
			        r.geom::geography,
			        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
			    )
			""",
			countQuery = """
			    SELECT COUNT(1)
			    FROM restaurant r
			    WHERE ST_DWithin(
			        r.geom::geography,
			        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
			        :meters
			    )
			""",
			nativeQuery = true
	)
	Page<Restaurant> findNearestWithinMeters(
			@Param("lng") double lng,
			@Param("lat") double lat,
			@Param("meters") double meters,
			Pageable pageable
	);

	/** 단일 식당 조회 - hours 포함 */
	@EntityGraph(attributePaths = {"hours"})
	@Query("SELECT r FROM Restaurant r WHERE r.id = :id")
	java.util.Optional<Restaurant> findByIdWithHours(@Param("id") Long id);

	/**
	 * 특정 사용자가 즐겨찾기한 식당들 조회
	 * user_restaurant_state에서 is_saved=true인 식당들을 조회합니다.
	 *
	 * @param userId 사용자 ID
	 * @param pageable 페이징 정보
	 * @return 즐겨찾기한 식당 목록
	 */
	@Query("""
		SELECT r FROM Restaurant r
		INNER JOIN UserRestaurantState urs ON r.id = urs.id.restaurantId
		WHERE urs.id.userId = :userId AND urs.isSaved = true
		ORDER BY urs.updatedAt DESC
		""")
	Page<Restaurant> findBookmarkedByUserId(@Param("userId") Long userId, Pageable pageable);

	/**
	 * 특정 식당이 저장된 사용자 수 조회 (is_saved=true인 사용자 수)
	 *
	 * @param restaurantId 식당 ID
	 * @return 저장된 사용자 수
	 */
	@Query("""
		SELECT COUNT(urs) FROM UserRestaurantState urs
		WHERE urs.id.restaurantId = :restaurantId AND urs.isSaved = true
		""")
	Long countSavedUsersByRestaurantId(@Param("restaurantId") Long restaurantId);

	/**
	 * 주어진 식당 ID 목록 중, 해당 사용자가 북마크한 식당 ID 목록 조회
	 */
	@Query("""
		SELECT urs.id.restaurantId
		FROM UserRestaurantState urs
		WHERE urs.id.userId = :userId
		  AND urs.isSaved = true
		  AND urs.id.restaurantId IN :restaurantIds
		""")
	List<Long> findSavedRestaurantIdsByUserIdAndRestaurantIds(
			@Param("userId") Long userId,
			@Param("restaurantIds") List<Long> restaurantIds
	);

	/**
	 * 위치 기반 인기 식당 조회 (즐겨찾기 수 기준 정렬) - 카테고리 필터 옵션
	 * - useCategory=false 인 경우 category2List는 무시됩니다.
	 * - 빈 리스트 IN () 회피를 위해 서비스에서 useCategory=false이면 category2List에 더미 값을 전달하세요.
	 */
	@Query(value = """
		WITH ranked_restaurants AS (
			SELECT
				r.restaurant_id,
				COALESCE(COUNT(CASE WHEN urs.is_saved = true THEN 1 END), 0) AS bookmark_count,
				r.kakao_rating,
				r.kakao_review_cnt
			FROM restaurant r
			LEFT JOIN user_restaurant_state urs ON r.restaurant_id = urs.restaurant_id
			WHERE r.geom IS NOT NULL
				AND ST_DWithin(
					r.geom::geography,
					ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
					:meters
				)
				AND (
					:useCategory = false
					OR r.category2 IN (:category2List)
				)
			GROUP BY r.restaurant_id, r.kakao_rating, r.kakao_review_cnt
			ORDER BY
				bookmark_count DESC,
				COALESCE(r.kakao_rating, 0) * COALESCE(r.kakao_review_cnt, 0) DESC,
				r.kakao_rating DESC NULLS LAST,
				r.kakao_review_cnt DESC NULLS LAST,
				r.restaurant_id
			LIMIT :limit
		)
		SELECT r.*
		FROM restaurant r
		INNER JOIN ranked_restaurants rr ON r.restaurant_id = rr.restaurant_id
		ORDER BY 
			rr.bookmark_count DESC,
			COALESCE(r.kakao_rating, 0) * COALESCE(r.kakao_review_cnt, 0) DESC,
			r.kakao_rating DESC NULLS LAST,
			r.kakao_review_cnt DESC NULLS LAST,
			r.restaurant_id
		""", nativeQuery = true)
	List<Restaurant> findPopularRestaurantsByLocationOptionalCategory(
			@Param("lng") double lng,
			@Param("lat") double lat,
			@Param("meters") double meters,
			@Param("limit") int limit,
			@Param("useCategory") boolean useCategory,
			@Param("category2List") List<String> category2List
	);

}
