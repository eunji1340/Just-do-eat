/**
 * restaurants/converter/RestaurantConverter.java
 * 식당 엔티티와 DTO 간 변환을 담당하는 Converter 클래스
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.converter;

import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.entity.RestaurantHour;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;

import java.util.List;

public class RestaurantConverter {

	/**
	 * Restaurant 엔티티를 RestaurantSummaryResponse로 변환
	 *
	 * @param restaurant 식당 엔티티
	 * @return RestaurantSummaryResponse
	 */
	public static RestaurantSummaryResponse toSummary(Restaurant restaurant) {
		if (restaurant == null) {
			return null;
		}

		return RestaurantSummaryResponse.builder()
			.restaurantId(restaurant.getId())
			.kakaoId(restaurant.getKakaoId())
			.name(restaurant.getName())
			.address(restaurant.getAddress())
			.category1(restaurant.getCategory1())
			.category2(restaurant.getCategory2())
			.category3(restaurant.getCategory3())
			.kakaoRating(restaurant.getKakaoRating() != null ? restaurant.getKakaoRating().floatValue() : null)
			.priceRange(restaurant.getPriceRange() != null ? restaurant.getPriceRange().name() : null)
			.image(restaurant.getImage()) // JSONB List<String>
			.build();
	}

	/**
	 * Restaurant 엔티티를 RestaurantDetailResponse로 변환
	 * FeedResponse.RestaurantItem과 동일한 구조 (카카오 트래픽 제외)
	 *
	 * @param restaurant 식당 엔티티
	 * @return RestaurantDetailResponse
	 */
	public static RestaurantDetailResponse toDetail(Restaurant restaurant) {
		if (restaurant == null) {
			return null;
		}

		// 영업시간 변환
		List<RestaurantDetailResponse.HourItem> hourItems = null;
		if (restaurant.getHours() != null && !restaurant.getHours().isEmpty()) {
			hourItems = restaurant.getHours().stream()
				.map(RestaurantConverter::toHourItem)
				.toList();
		}

		return RestaurantDetailResponse.builder()
			.restaurantId(restaurant.getId())
			.kakaoId(restaurant.getKakaoId())
			.name(restaurant.getName())
			.address(restaurant.getAddress())
			.addressLot(restaurant.getAddressLot())
			.phone(restaurant.getPhone())
			.kakaoSummary(restaurant.getKakaoSummary()) // 전체 JSONB 객체
			.category1(restaurant.getCategory1())
			.category2(restaurant.getCategory2())
			.category3(restaurant.getCategory3())
			.kakaoUrl(restaurant.getKakaoUrl())
			.kakaoRating(restaurant.getKakaoRating() != null ? restaurant.getKakaoRating().floatValue() : null)
			.kakaoReviewCnt(restaurant.getKakaoReviewCnt())
			.blogReviewCnt(restaurant.getBlogReviewCnt())
			.priceRange(restaurant.getPriceRange() != null ? restaurant.getPriceRange().name() : null)
			.image(restaurant.getImage()) // JSONB List<String>
			.menu(restaurant.getMenu()) // JSONB
			.isParking(restaurant.getIsParking())
			.isReservation(restaurant.getIsReservation())
			.hours(hourItems)
			.build();
	}

	/**
	 * RestaurantHour 엔티티를 RestaurantDetailResponse.HourItem으로 변환
	 *
	 * @param hour 영업시간 엔티티
	 * @return RestaurantDetailResponse.HourItem
	 */
	private static RestaurantDetailResponse.HourItem toHourItem(RestaurantHour hour) {
		return RestaurantDetailResponse.HourItem.builder()
			.dow(hour.getDow())
			.open(hour.getOpen() != null ? hour.getOpen().toString() : null)
			.close(hour.getClose() != null ? hour.getClose().toString() : null)
			.breakOpen(hour.getBreakOpen() != null ? hour.getBreakOpen().toString() : null)
			.breakClose(hour.getBreakClose() != null ? hour.getBreakClose().toString() : null)
			.isHoliday(hour.getIsHoliday())
			.build();
	}

	/**
	 * Restaurant 엔티티를 RestaurantShareResponse로 변환
	 *
	 * @param restaurant 식당 엔티티
	 * @return RestaurantShareResponse
	 */
	public static RestaurantShareResponse toShare(Restaurant restaurant) {
		if (restaurant == null) {
			return null;
		}

		return RestaurantShareResponse.builder()
			.restaurantId(restaurant.getId())
			.kakaoUrl(restaurant.getKakaoUrl())
			.name(restaurant.getName())
			.build();
	}

	/**
	 * Restaurant 엔티티와 저장된 수를 RestaurantBookmarkResponse로 변환
	 *
	 * @param restaurant 식당 엔티티
	 * @param savedCount 해당 식당이 저장된 사용자 수
	 * @return RestaurantBookmarkResponse
	 */
	public static RestaurantBookmarkResponse toBookmark(Restaurant restaurant, Long savedCount) {
		if (restaurant == null) {
			return null;
		}

		return RestaurantBookmarkResponse.builder()
			.restaurantId(restaurant.getId())
			.name(restaurant.getName())
			.category1(restaurant.getCategory1())
			.category2(restaurant.getCategory2())
			.category3(restaurant.getCategory3())
			.menu(restaurant.getMenu()) // JSONB
			.savedCount(savedCount != null ? savedCount : 0L)
			.image(restaurant.getImage()) // JSONB List<String>
			.build();
	}

}

