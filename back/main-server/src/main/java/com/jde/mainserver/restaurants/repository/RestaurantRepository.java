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
}
