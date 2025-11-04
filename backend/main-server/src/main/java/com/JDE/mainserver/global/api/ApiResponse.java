/**
 * API 응답을 위한 공통 응답 클래스
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
package com.JDE.mainserver.global.api;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.JDE.mainserver.global.exception.code.BaseSuccessCode;
import com.JDE.mainserver.global.exception.code.GeneralSuccessCode;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
//@JsonPropertyOrder({"status", "com/jjogae/mainserver/payment/exception/code", "message", "data"})
@JsonPropertyOrder({"status", "code", "message", "data"})
public class ApiResponse<T> {
	private HttpStatus status;
	private String code;
	private String message;
	private T data;

	// 일반 응답 코드
	public static <T> ApiResponse<T> onSuccess() {
		return new ApiResponse<T>(GeneralSuccessCode.OK.getStatus(), GeneralSuccessCode.OK.getCode(), GeneralSuccessCode.OK.getMessage(), null);
	}

	public static <T> ApiResponse<T> onSuccess(T result) {
		return new ApiResponse<T>(GeneralSuccessCode.OK.getStatus(), GeneralSuccessCode.OK.getCode(), GeneralSuccessCode.OK.getMessage(), result);
	}

	// 커스텀 응답 코드
	public static <T> ApiResponse<T> onSuccess(BaseSuccessCode code) {
		return new ApiResponse<T>(code.getStatus(), code.getCode(), code.getMessage(), null);
	}

	public static <T> ApiResponse<T> onSuccess(BaseSuccessCode code, T result) {
		return new ApiResponse<T>(code.getStatus(), code.getCode(), code.getMessage(), result);
	}

	// 실패 응답 코드
	public static <T> ApiResponse<T> onFailure(HttpStatus status, String code, String message, T result) {
		return new ApiResponse<T>(status, code, message, result);
	}
}
