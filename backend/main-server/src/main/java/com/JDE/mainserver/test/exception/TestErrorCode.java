package com.JDE.mainserver.test.exception;

import org.springframework.http.HttpStatus;

import com.JDE.mainserver.global.api.ApiResponse;
import com.JDE.mainserver.global.exception.code.BaseErrorCode;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Test 도메인 관련 에러 코드
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
@Getter
@AllArgsConstructor
public enum TestErrorCode implements BaseErrorCode {

    TEST_NOT_FOUND(HttpStatus.NOT_FOUND, "TEST404", "존재하지 않는 테스트입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    @Override
    public <T> ApiResponse<T> getResponse() {
        return ApiResponse.onFailure(this.status, this.code, this.message, null);
    }
}
