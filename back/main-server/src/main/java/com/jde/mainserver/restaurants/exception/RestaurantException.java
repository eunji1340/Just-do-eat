/**
 * restaurants/exception/RestaurantException
 * Restaurant 도메인 관련 예외
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.exception;

import com.jde.mainserver.global.exception.handler.CustomException;

public class RestaurantException extends CustomException {

	public RestaurantException(RestaurantErrorCode errorCode) {
		super(errorCode);
	}
}

