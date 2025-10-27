/**
 * 일반적인 성공 코드
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
package com.JDE.mainserver.global.exception.code;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum GeneralSuccessCode implements BaseSuccessCode {

	OK(HttpStatus.OK, "200", "요청 성공"),
	CREATE(HttpStatus.CREATED, "201", "생성 성공");

	private final HttpStatus status;
	private final String code;
	private final String message;
}
