package com.jde.mainserver.room.exception;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.BaseErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum RoomMemberErrorCode implements BaseErrorCode {

    NOT_FOUND_USER(HttpStatus.BAD_REQUEST, "REST400", "잘못된 요청입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    @Override
    public  <T> ApiResponse<T> getResponse() { return ApiResponse.onFailure(this.status, this.code, this.message, null);}
}
