package com.jde.mainserver.global.exception.code;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

import com.jde.mainserver.global.api.ApiResponse;

// 기존 주석 유지
@Getter
@RequiredArgsConstructor
public enum GeneralErrorCode implements BaseErrorCode {

    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "400", "입력값이 올바르지 않습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "500", "일시적 서버 오류입니다. 잠시 후 다시 시도해 주세요."),
    INVALID_S3_URL(HttpStatus.BAD_REQUEST, "400", "유효하지 않은 S3 URL입니다."),
    EXPIRED_S3_URL(HttpStatus.BAD_REQUEST, "400", "만료된 S3 URL입니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "401", "유효하지 않은 토큰입니다."),
    EXPIRED_ACCESS_TOKEN(HttpStatus.UNAUTHORIZED, "401", "액세스 토큰이 만료되었습니다."),
    EXPIRED_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "401", "리프레시 토큰이 만료되었습니다."),
    MALFORMED_TOKEN(HttpStatus.UNAUTHORIZED, "401", "토큰 포맷이 올바르지 않습니다."),
    INVALID_SIGNATURE(HttpStatus.UNAUTHORIZED, "401", "토큰 서명이 유효하지 않습니다."),
    UNSUPPORTED_TOKEN(HttpStatus.UNAUTHORIZED, "401", "지원하지 않는 토큰입니다."),
    BLACKLISTED_TOKEN(HttpStatus.UNAUTHORIZED, "401", "블랙리스트에 등록된 토큰입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    // BaseErrorCode가 요구하는 메서드 구현
    @Override
    public ApiResponse<Void> getResponse() {
        return ApiResponse.onFailure(this.status, this.code, this.message, null);
    }
}
