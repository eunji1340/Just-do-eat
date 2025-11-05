/**
 * restaurants/repository/RestaurantHourRepository.java
 * 식당 영업 시간 레포지토리
 * Author: Jang
 * Date: 2025-11-03
 *
 */

package com.JDE.mainserver.restaurants.repository;

import com.JDE.mainserver.restaurants.entity.RestaurantHour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantHourRepository extends JpaRepository<RestaurantHour, Long> {

	/** 특정 식당의 모든 요일 영업시간 조회 */
	List<RestaurantHour> findByRestaurant_Id(Long restaurantId);

	/** 특정 식당의 특정 요일(1=월 ... 7=일) 영업시간 단건 조회 */
	Optional<RestaurantHour> findByRestaurant_IdAndDow(Long restaurantId, Integer dow);

	/** 여러 식당에 대한 영업시간 일괄 조회 (Feed/추천용 배치 조회 시 유용) */
	List<RestaurantHour> findByRestaurant_IdIn(List<Long> restaurantIds);

	/** 특정 식당의 영업시간 모두 삭제 (식당 삭제/재수집 시 정리) */
	long deleteByRestaurant_Id(Long restaurantId);
}
