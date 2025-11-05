/**
 * web/dto/request/LoginRequest.java
 * 로그인 요청 DTO
 * Author: kimheejin
 * Date: 2025-10-28
 */
package com.JDE.mainserver.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class LoginRequest {
    @NotBlank
    private String userId;

    @NotBlank
    private String password;
}
