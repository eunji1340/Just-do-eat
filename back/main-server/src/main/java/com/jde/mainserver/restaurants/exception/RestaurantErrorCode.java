/**
 * restaurants/exception/RestaurantErrorCode
 * Restaurant 도메인 관련 에러 코드
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.exception;

import org.springframework.http.HttpStatus;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.BaseErrorCode;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum RestaurantErrorCode implements BaseErrorCode {
	INVALID_REQUEST(HttpStatus.BAD_REQUEST, "REST400", "잘못된 요청입니다."),
	NOT_FOUND_RESTAURANT(HttpStatus.NOT_FOUND, "REST404", "존재하지 않는 식당입니다."),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "REST500", "서버 내부 오류가 발생했습니다.");

	private final HttpStatus status;
	private final String code;
	private final String message;

	@Override
	public <T> ApiResponse<T> getResponse() {
		return ApiResponse.onFailure(this.status, this.code, this.message, null);
	}
}

