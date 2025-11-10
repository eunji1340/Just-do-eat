/**
 * restaurants/service/command/RestaurantCommandService.java
 * 식당 Command 서비스 인터페이스
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.service.command;

import com.jde.mainserver.restaurants.web.dto.response.BookmarkResponse;

public interface RestaurantCommandService {
	/**
	 * 즐겨찾기를 추가합니다.
	 *
	 * is_saved=true로 변경되며 개인 선호 점수와 태그 선호도가 업데이트됩니다.
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 * @return 처리 결과 및 최신 상태 스냅샷을 담은 응답 DTO
	 * @throws com.jde.mainserver.restaurants.exception.RestaurantException 식당을 찾을 수 없는 경우
	 */
	BookmarkResponse addBookmark(Long restaurantId, Long userId);

	/**
	 * 즐겨찾기를 해제합니다.
	 *
	 * is_saved=false로 변경되며 개인 선호 점수와 태그 선호도가 업데이트됩니다.
	 *
	 * @param restaurantId 식당 ID
	 * @param userId 사용자 ID
	 * @return 처리 결과 및 최신 상태 스냅샷을 담은 응답 DTO
	 * @throws com.jde.mainserver.restaurants.exception.RestaurantException 식당을 찾을 수 없는 경우
	 */
	BookmarkResponse removeBookmark(Long restaurantId, Long userId);
}

