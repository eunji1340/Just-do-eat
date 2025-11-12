/**
 * restaurants/repository/RestaurantRepository.java
 * 식당 레포지토리
 * Author: Jang
 * Date: 2025-11-03
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

	/** 여러 ID로 일괄 조회 (피드/추천용) - hours 포함 */
	@EntityGraph(attributePaths = {"hours"})
	List<Restaurant> findAllByIdIn(Collection<Long> ids);

	/** 반경 내 모든 식당 (페이징 없음, 간단 버전) */
	@Query(value = """
            SELECT *
            FROM restaurant r
            WHERE ST_DWithin(
                r.geom::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :meters
            )
        """, nativeQuery = true)
	List<Restaurant> findWithinMeters(
			@Param("lng") double lng,
			@Param("lat") double lat,
			@Param("meters") double meters
	);

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

	/** 전체 조회 (페이징) - hours 포함 */
	@EntityGraph(attributePaths = {"hours"})
	@Query("SELECT r FROM Restaurant r")
	Page<Restaurant> findAllWithHours(Pageable pageable);

	/** 단일 식당 조회 - hours 포함 */
	@EntityGraph(attributePaths = {"hours"})
	@Query("SELECT r FROM Restaurant r WHERE r.id = :id")
	Optional<Restaurant> findByIdWithHours(@Param("id") Long id);

	/** 이름으로 검색 (대소문자 무시, 부분일치) */
	Page<Restaurant> findByNameContainingIgnoreCase(String name, Pageable pageable);

	/** 특정 사용자가 즐겨찾기한 식당들 (is_saved=true) */
	@Query("""
        SELECT r FROM Restaurant r
        INNER JOIN UserRestaurantState urs ON r.id = urs.id.restaurantId
        WHERE urs.id.userId = :userId AND urs.isSaved = true
        ORDER BY urs.updatedAt DESC
        """)
	Page<Restaurant> findBookmarkedByUserId(@Param("userId") Long userId, Pageable pageable);

	// 식당을 즐겨찾기한 사용자 수 카운트 (예시 메서드, UserRestaurantState 엔티티에 접근 필요)
	@Query("""
        SELECT COUNT(urs) FROM UserRestaurantState urs
        WHERE urs.id.restaurantId = :restaurantId AND urs.isSaved = true
        """)
	Long countSavedUsersByRestaurantId(@Param("restaurantId") Long restaurantId);
}