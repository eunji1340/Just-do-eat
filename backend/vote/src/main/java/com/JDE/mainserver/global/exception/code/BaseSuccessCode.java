/**
 * 성공 코드 인터페이스
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
package com.JDE.mainserver.global.exception.code;

import org.springframework.http.HttpStatus;

public interface BaseSuccessCode {
	HttpStatus getStatus();
	String getCode();
	String getMessage();
}