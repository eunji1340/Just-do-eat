/**
 * restaurants/service/query/RestaurantQueryServiceImpl.java
 * 식당 Query 서비스 구현체
 * Author: Kim
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.service.query;

import com.jde.mainserver.main.service.command.MainCommandService;
import com.jde.mainserver.restaurants.converter.RestaurantConverter;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.exception.RestaurantErrorCode;
import com.jde.mainserver.restaurants.exception.RestaurantException;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantQueryServiceImpl implements RestaurantQueryService {

	private final RestaurantRepository restaurantRepository;
	private final MainCommandService mainCommandService;

	@Override
	public Page<RestaurantSummaryResponse> searchByKeyword(String query, Pageable pageable) {
		Page<Restaurant> page = (query == null || query.isBlank())
			? restaurantRepository.findAllWithHours(pageable)
			: restaurantRepository.findByNameContainingIgnoreCase(query, pageable);

		return page.map(RestaurantConverter::toSummary);
	}

	@Override
	@Transactional
	public RestaurantDetailResponse getDetail(Long restaurantId, Long userId) {
		// view_count 증가 및 선호 점수 업데이트
		mainCommandService.handleView(restaurantId, userId);

		// hours를 포함하여 조회
		Restaurant restaurant = restaurantRepository.findByIdWithHours(restaurantId)
			.orElseThrow(() -> new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT));

		return RestaurantConverter.toDetail(restaurant);
	}

	@Override
	@Transactional
	public RestaurantShareResponse getShare(Long restaurantId, Long userId) {
		// share_count 증가 및 선호 점수 업데이트
		mainCommandService.handleShare(restaurantId, userId);

		Restaurant restaurant = restaurantRepository.findById(restaurantId)
			.orElseThrow(() -> new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT));

		return RestaurantConverter.toShare(restaurant);
	}

	@Override
	public Page<RestaurantBookmarkResponse> getBookmarks(Long userId, Pageable pageable) {
		// 사용자가 즐겨찾기한 식당들 조회
		Page<Restaurant> bookmarkedRestaurants = restaurantRepository.findBookmarkedByUserId(userId, pageable);

		// 각 식당별로 저장된 수를 조회하여 변환
		return bookmarkedRestaurants.map(restaurant -> {
			Long savedCount = restaurantRepository.countSavedUsersByRestaurantId(restaurant.getId());
			return RestaurantConverter.toBookmark(restaurant, savedCount);
		});
	}
}

