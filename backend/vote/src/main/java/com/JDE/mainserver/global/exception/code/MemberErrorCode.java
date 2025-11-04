package com.JDE.mainserver.global.exception.code;

import com.JDE.mainserver.global.api.ApiResponse;
import org.springframework.http.HttpStatus;

public enum MemberErrorCode implements BaseErrorCode {

    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "404", "회원 정보를 찾을 수 없습니다."),
    USER_ID_DUPLICATED(HttpStatus.CONFLICT, "409", "이미 사용 중인 아이디입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "401", "아이디 또는 비밀번호가 올바르지 않습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    MemberErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    @Override public HttpStatus getStatus()   { return status; }
    @Override public String getCode()         { return code; }
    @Override public String getMessage()      { return message; }

    // BaseErrorCode가 요구하는 메서드 구현
    @Override
    public ApiResponse<Void> getResponse() {
        return ApiResponse.onFailure(this.status, this.code, this.message, null);
    }
}
