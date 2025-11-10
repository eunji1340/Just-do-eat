package com.jde.mainserver.global.config;

import com.jde.mainserver.global.security.jwt.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-ttl-ms}")
    private long accessTokenTtlMs;

    @Value("${jwt.refresh-token-ttl-ms}")
    private long refreshTokenTtlMs;

    @Bean
    public JwtUtil jwtUtil() {
        return new JwtUtil(jwtSecret, accessTokenTtlMs, refreshTokenTtlMs);
    }
}

