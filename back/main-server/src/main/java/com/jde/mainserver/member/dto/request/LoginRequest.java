package com.jde.mainserver.member.dto.request;

/**
 * web/dto/request/LoginRequest.java
 * 로그인 요청 DTO
 * Author: kimheejin
 * Date: 2025-10-28
 */
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class LoginRequest {
    @NotBlank private String name;
    @NotBlank private String password;
}
