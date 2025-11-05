package com.jde.mainserver.global.exception.code;

import org.springframework.http.HttpStatus;

import com.jde.mainserver.global.api.ApiResponse;

public interface BaseErrorCode {
    <T> ApiResponse<T> getResponse();
    HttpStatus getStatus();
    String getCode();
    String getMessage();
}
