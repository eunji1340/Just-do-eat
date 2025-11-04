/**
 * 일반적인 에러 코드
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
package com.JDE.mainserver.global.exception.code;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import com.JDE.mainserver.global.api.ApiResponse;

@Getter
@AllArgsConstructor
public enum GeneralErrorCode implements BaseErrorCode {

	INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "400", "입력값이 올바르지 않습니다."),
	INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "500", "일시적인 서버 에러입니다. 잠시 후 다시 시도해주세요."),

	// S3
	INVALID_S3_URL(HttpStatus.BAD_REQUEST, "400", "유효하지 않은 S3 URL입니다."),
	EXPIRED_S3_URL(HttpStatus.BAD_REQUEST, "400", "만료된 S3 URL입니다."),

	// JWT
	INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "401", "토큰이 유효하지 않습니다."),
	EXPIRED_ACCESS_TOKEN(HttpStatus.UNAUTHORIZED, "401", "액세스 토큰이 만료되었습니다."),
	EXPIRED_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "401", "리프레시 토큰이 만료되었습니다."),
	MALFORMED_TOKEN(HttpStatus.UNAUTHORIZED, "401", "잘못된 형식의 토큰입니다."),
	INVALID_SIGNATURE(HttpStatus.UNAUTHORIZED, "401", "유효하지 않은 토큰 서명입니다."),
	UNSUPPORTED_TOKEN(HttpStatus.UNAUTHORIZED, "401", "지원하지 않는 토큰입니다."),
	BLACKLISTED_TOKEN(HttpStatus.UNAUTHORIZED, "401", "블랙리스트에 등록된 토큰입니다.");

	private final HttpStatus status;
	private final String code;
	private final String message;

	@Override
	public <T> ApiResponse<T> getResponse() {
		return ApiResponse.onFailure(this.status, this.code, this.message, null);
	}
}
