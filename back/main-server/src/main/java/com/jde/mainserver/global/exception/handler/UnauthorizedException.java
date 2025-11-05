package com.jde.mainserver.global.exception.handler;
import lombok.Getter;
import org.springframework.http.HttpStatus;

// @ResponseStatus는 예외 발생시 자동으로 상태코드를 지정해주는 Annotation
// 단, 전역 핸들러에서 통일된 응답 포맷을 만들 거라면 생략하고 핸들러에서 상태코드를 지정해주는 것을 권장함
// @ResponseStatus(HttpStatus.UNAUTHORIZED)
@Getter
public class UnauthorizedException extends RuntimeException{
    // 해당 클래스가 호출 될 때는 Unauthorized 상태를 나타내기 위함이므로 상태코드를 나타내기 위한 상수 변수 설정
    private final HttpStatus status = HttpStatus.UNAUTHORIZED;
    public UnauthorizedException(String message) {

        // supser(message)를 통해서 최상위 부모에게 message를 보내주고
        // 부모로부터 다시 message를 받아서 사용하게됨
        super(message);
    }
}