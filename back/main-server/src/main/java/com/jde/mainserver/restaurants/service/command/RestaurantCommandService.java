/**
 * restaurants/service/command/RestaurantCommandService.java
 * 식당 Command 서비스 인터페이스
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.service.command;



public interface RestaurantCommandService {
	// 즐겨찾기 추가
	void addBookmark(Long restaurantId, Long userId);

	 // 즐겨찾기 해제
	void removeBookmark(Long restaurantId, Long userId);
}

