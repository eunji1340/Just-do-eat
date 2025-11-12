/**
 * restaurants/service/query/RestaurantQueryService.java
 * 식당 Query 서비스 인터페이스
 * Author: Kim
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.service.query;

import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RestaurantQueryService {
	// 식당 검색 (필터/반경 포함, 키워드만 있어도 검색 가능)
	Page<RestaurantSummaryResponse> search(com.jde.mainserver.restaurants.web.dto.request.RestaurantSearchRequest req, Pageable pageable);

	// 식당 상세 정보 조회
	RestaurantDetailResponse getDetail(Long restaurantId, Long userId);

	//식당 공유 링크 조회
	RestaurantShareResponse getShare(Long restaurantId, Long userId);

	// 사용자가 즐겨찾기한 식당들 조회
	Page<RestaurantBookmarkResponse> getBookmarks(Long userId, Pageable pageable);

	// 위치 기반 인기 식당 Top10 조회
	java.util.List<RestaurantSummaryResponse> getPopularRestaurantsTop10(double lng, double lat);

	// 카테고리별 위치 기반 인기 식당 조회
	FeedResponse getPopularRestaurantsByCategory(double lng, double lat, String category, String cursor);
}

