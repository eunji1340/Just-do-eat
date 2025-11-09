/**
 * main/exception/MainException
 * Main 도메인 관련 예외
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.exception;

import com.jde.mainserver.global.exception.handler.CustomException;

public class MainException extends CustomException {

	public MainException(MainErrorCode errorCode) {
		super(errorCode);
	}
}


