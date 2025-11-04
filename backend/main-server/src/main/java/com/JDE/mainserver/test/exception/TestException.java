package com.JDE.mainserver.test.exception;

import com.ssafy.mvc.mainserver.global.exception.CustomException;

/**
 * Test 도메인 관련 예외
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
public class TestException extends CustomException {
    public TestException(TestErrorCode errorCode) {
        super(errorCode);
    }
}
