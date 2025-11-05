package com.jde.mainserver.global.exception.handler;
import com.jde.mainserver.global.exception.code.BaseErrorCode;

import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {

    private BaseErrorCode code;

    public CustomException(BaseErrorCode code) {
        this.code = code;
    }

}
