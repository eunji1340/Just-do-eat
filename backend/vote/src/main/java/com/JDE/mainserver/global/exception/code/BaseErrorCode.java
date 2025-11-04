/**
 * 에러 코드 인터페이스
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
package com.JDE.mainserver.global.exception.code;

import org.springframework.http.HttpStatus;

import com.JDE.mainserver.global.api.ApiResponse;

public interface BaseErrorCode {
	<T> ApiResponse<T> getResponse();
	HttpStatus getStatus();
	String getCode();
	String getMessage();
}
