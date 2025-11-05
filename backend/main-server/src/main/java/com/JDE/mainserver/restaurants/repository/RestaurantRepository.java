/**
 * restaurants/repository/RestaurantRepository.java
 * 식당 레포지토리
 * Author: Jang
 * Date: 2025-11-03
 *
 */

package com.JDE.mainserver.restaurants.repository;

import com.JDE.mainserver.restaurants.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

	/** 여러 ID로 일괄 조회 (피드/추천용) - hours 포함 */
	@EntityGraph(attributePaths = {"hours"})
	List<Restaurant> findAllByIdIn(Collection<Long> ids);

	/** 전체 조회 (페이징) - hours 포함 (영업 상태 계산용) */
	@EntityGraph(attributePaths = {"hours"})
	@Query("SELECT r FROM Restaurant r")
	Page<Restaurant> findAllWithHours(Pageable pageable);

	/** 카테고리 페이징 조회 */
	Page<Restaurant> findByCategory(String category, Pageable pageable);

	/** 이름 부분검색(대소문자 무시) */
	Page<Restaurant> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

	/** 가격대 필터 (Restaurant.PriceBucket) */
	Page<Restaurant> findByPriceRange(Restaurant.PriceBucket priceRange, Pageable pageable);


	/* ===== PostGIS: 반경 내 검색 / 거리순 정렬 =====
	 * - meters: 반경(미터)
	 * - lng/lat: 경도/위도 (WGS84, EPSG:4326)
	 * - geography 캐스팅으로 미터 단위 정확도 확보
	 */

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

	/** 반경 내 + 거리순 정렬 (페이징)
	 *  - Page 지원을 위해 countQuery 제공
	 */
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

	/** 반경 내 + 카테고리/가격대 동시 필터 (예시) */
	@Query(
		value = """
			SELECT *
			FROM restaurant r
			WHERE r.category = :category
			  AND r.price_range = :priceRange
			  AND ST_DWithin(
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
			WHERE r.category = :category
			  AND r.price_range = :priceRange
			  AND ST_DWithin(
					r.geom::geography,
					ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
					:meters
			  )
		""",
		nativeQuery = true
	)
	Page<Restaurant> findNearestWithinMetersWithFilters(
		@Param("lng") double lng,
		@Param("lat") double lat,
		@Param("meters") double meters,
		@Param("category") String category,
		@Param("priceRange") String priceRange, // Enum 문자열(LOW/MEDIUM/HIGH/PREMIUM)
		Pageable pageable
	);
}
