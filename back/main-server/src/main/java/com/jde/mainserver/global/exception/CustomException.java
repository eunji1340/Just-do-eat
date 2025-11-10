package com.jde.mainserver.global.exception;

/**
 * 커스텀 예외 클래스
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
import com.jde.mainserver.global.exception.code.BaseErrorCode;

import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {

    private BaseErrorCode code;

    public CustomException(BaseErrorCode code) {
        this.code = code;
    }
}
