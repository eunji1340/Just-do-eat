/**
 * restaurants/service/query/RestaurantQueryService.java
 * 식당 Query 서비스 인터페이스
 * Author: Kim
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.service.query;

import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RestaurantQueryService {
	/**
	 * 키워드로 식당 검색
	 *
	 * @param query 검색 키워드 (null이거나 빈 문자열이면 전체 조회)
	 * @param pageable 페이징 정보
	 * @return 식당 요약 정보 페이지
	 */
	Page<RestaurantSummaryResponse> searchByKeyword(String query, Pageable pageable);

	/**
	 * 식당 상세 정보 조회
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID (view_count 증가 및 선호 점수 업데이트용)
	 * @return 식당 상세 정보
	 * @throws com.jde.mainserver.restaurants.exception.RestaurantException 식당을 찾을 수 없는 경우
	 */
	RestaurantDetailResponse getDetail(Long restaurantId, Long userId);

	/**
	 * 식당 공유 링크 조회
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID (share_count 증가 및 선호 점수 업데이트용)
	 * @return 식당 공유 정보
	 * @throws com.jde.mainserver.restaurants.exception.RestaurantException 식당을 찾을 수 없는 경우
	 */
	RestaurantShareResponse getShare(Long restaurantId, Long userId);

	/**
	 * 사용자가 즐겨찾기한 식당들 조회
	 *
	 * @param userId 사용자 ID
	 * @param pageable 페이징 정보
	 * @return 즐겨찾기한 식당 목록 (식당 id, 식당명, 카테고리123, 메뉴, 저장된 수, 이미지)
	 */
	Page<RestaurantBookmarkResponse> getBookmarks(Long userId, Pageable pageable);
}

