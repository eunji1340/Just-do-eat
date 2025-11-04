/**
 * 전역 예외 처리 핸들러
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
package com.JDE.mainserver.global.exception.handler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

import com.JDE.mainserver.global.api.ApiResponse;
import com.JDE.mainserver.global.exception.CustomException;
import com.JDE.mainserver.global.exception.code.BaseErrorCode;
import com.JDE.mainserver.global.exception.code.GeneralErrorCode;

@Slf4j
@RestControllerAdvice
public class ExceptionAdvice {

	// Custom Error Handling
	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ApiResponse<String>> handleCustomException(CustomException e) {
		BaseErrorCode code = e.getCode();
		log.warn("[CustomException] code: {}, message: {}", code.getCode(), code.getMessage());
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ApiResponse.onFailure(code.getStatus(), code.getCode(), code.getMessage(), null));
	}

	// RequestBody Binding Handling
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException e) {
		Map<String, String> errors = new HashMap<>();

		// 필드 레벨 유효성 검사 오류 처리
		e.getBindingResult().getFieldErrors().forEach(error ->
			errors.put(error.getField(), error.getDefaultMessage()));

		// 클래스 레벨 유효성 검사 오류 처리
		e.getBindingResult().getGlobalErrors().forEach(error ->
			errors.put("global", error.getDefaultMessage()));

		BaseErrorCode code = GeneralErrorCode.INVALID_INPUT_VALUE;
		log.error("[ValidationException] Invalid input: {}", errors);

		return ResponseEntity.badRequest()
			.body(ApiResponse.onFailure(code.getStatus(), code.getCode(), code.getMessage(), errors));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiResponse<String>> handleHttpMessageNotReadable(HttpMessageNotReadableException e) {
		log.error("[HttpMessageNotReadable] message: {}", e.getMessage());

		BaseErrorCode code = GeneralErrorCode.INVALID_INPUT_VALUE;
		return ResponseEntity.badRequest()
			.body(ApiResponse.onFailure(code.getStatus(), code.getCode(), "잘못된 요청 형식입니다.", null));
	}

	@ExceptionHandler(BindException.class)
	public ResponseEntity<ApiResponse<String>> handleBindException(BindException e) {
		BaseErrorCode code = GeneralErrorCode.INVALID_INPUT_VALUE;
		log.error("[BindException] message: {}", e.getMessage());
		return ResponseEntity.badRequest()
			.body(ApiResponse.onFailure(code.getStatus(), code.getCode(), "요청 바인딩 실패", null));
	}

	// RequestParam, PathVariable annotation error handling
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiResponse<String>> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException e) {
		String paramName = e.getName(); // 파라미터 이름
		String invalidValue = e.getValue() != null ? e.getValue().toString() : "null";
		String message = String.format("요청 파라미터 '%s'의 값 '%s'는 허용되지 않습니다.", paramName, invalidValue);

		BaseErrorCode code = GeneralErrorCode.INVALID_INPUT_VALUE;
		log.error("[MethodArgumentTypeMismatch] {}", message);

		return ResponseEntity.badRequest()
			.body(ApiResponse.onFailure(code.getStatus(), code.getCode(), message, null));
	}

	// Exception
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<String>> handleException(Exception e) {
		log.error("[UnhandledException] message: {}", e.getMessage());
		e.printStackTrace();
		BaseErrorCode code = GeneralErrorCode.INTERNAL_SERVER_ERROR;
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(ApiResponse.onFailure(code.getStatus(), code.getCode(), code.getMessage(), null));
	}
}