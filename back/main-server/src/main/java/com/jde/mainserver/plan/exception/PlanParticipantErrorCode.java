package com.jde.mainserver.plan.exception;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.BaseErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum PlanParticipantErrorCode implements BaseErrorCode {

    NOT_FOUND_USER(HttpStatus.NOT_FOUND, "PLANPARTICIPANT400", "잘못된 요청입니다."),
    NOT_MANAGER(HttpStatus.NOT_FOUND, "PLANPARTICIPANT400", "잘못된 요청입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    @Override
    public <T> ApiResponse<T> getResponse() {return ApiResponse.onFailure(this.status, this.code, this.message, null);}
}
