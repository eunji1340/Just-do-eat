package com.jde.mainserver.room.exception;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.BaseErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum RoomErrorCode implements BaseErrorCode {

    NOT_FOUND_ROOM(HttpStatus.NOT_FOUND, "REST400", "잘못된 요청입니다."),
    EXPIRED_TOKEN(HttpStatus.NOT_FOUND, "REST400", "유효하지 않은 토큰입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    @Override
    public <T> ApiResponse<T> getResponse() {return ApiResponse.onFailure(this.status, this.code, this.message, null);}
}
