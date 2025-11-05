/**
 * web/dto/response/TokenResponse.java
 * 액세스/리프레시 토큰 응답
 * Author: kimheejin
 * Date: 2025-10-28
 */
package com.JDE.mainserver.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
}
