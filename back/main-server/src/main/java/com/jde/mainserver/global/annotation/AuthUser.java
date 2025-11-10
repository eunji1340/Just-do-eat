package com.jde.mainserver.global.annotation;

import io.swagger.v3.oas.annotations.Parameter;

import java.lang.annotation.*;

@Target(ElementType.PARAMETER) // ← 메서드 파라미터에 붙이는 어노테이션임
@Retention(RetentionPolicy.RUNTIME) // ← 런타임까지 유지되어 리졸버가 읽을 수 있게 함
@Documented // ← Javadoc 등에 문서화 대상
@Parameter(hidden = true) // ← Swagger 문서에 노출하지 않음
public @interface AuthUser { }