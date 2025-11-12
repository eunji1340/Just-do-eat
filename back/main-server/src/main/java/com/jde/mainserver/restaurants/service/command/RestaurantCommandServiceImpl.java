/**
 * restaurants/service/command/RestaurantCommandServiceImpl.java
 * 식당 Command 서비스 구현체
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.service.command;

import com.jde.mainserver.main.service.command.MainCommandService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RestaurantCommandServiceImpl implements RestaurantCommandService {

	private final MainCommandService mainCommandService;

	@Override
	public void addBookmark(Long restaurantId, Long userId) {
		mainCommandService.addBookmark(restaurantId, userId);
	}

	@Override
	public void removeBookmark(Long restaurantId, Long userId) {
		mainCommandService.removeBookmark(restaurantId, userId);
	}
}

