package com.jde.mainserver.global.exception.code;

import com.jde.mainserver.global.api.ApiResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 기존 주석 유지
@Getter
@RequiredArgsConstructor
public enum MemberErrorCode implements BaseErrorCode {

    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "404", "회원 정보를 찾을 수 없습니다."),
    USER_ID_DUPLICATED(HttpStatus.CONFLICT, "409", "이미 사용 중인 아이디입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "401", "아이디 또는 비밀번호가 올바르지 않습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    // BaseErrorCode가 요구하는 메서드 구현
    @Override
    public ApiResponse<Void> getResponse() {
        return ApiResponse.onFailure(this.status, this.code, this.message, null);
    }
}
