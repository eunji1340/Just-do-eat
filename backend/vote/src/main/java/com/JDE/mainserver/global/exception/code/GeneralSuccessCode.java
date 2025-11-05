package com.JDE.mainserver.global.exception.code;

import org.springframework.http.HttpStatus;

public enum GeneralSuccessCode implements BaseSuccessCode {
	OK(HttpStatus.OK, "OK", "성공"),
	CREATED(HttpStatus.CREATED, "CREATED", "생성 성공"); // ✅ 추가

	private final HttpStatus status;
	private final String code;
	private final String message;

	GeneralSuccessCode(HttpStatus status, String code, String message) {
		this.status = status;
		this.code = code;
		this.message = message;
	}

	@Override public HttpStatus getStatus() { return status; }
	@Override public String getCode() { return code; }
	@Override public String getMessage() { return message; }
}
