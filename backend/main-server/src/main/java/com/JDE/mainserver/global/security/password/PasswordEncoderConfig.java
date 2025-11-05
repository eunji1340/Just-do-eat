/**
 * global/security/password/PasswordEncoderConfig.java
 * 비밀번호 인코더 빈 등록
 * Author: kimheejin
 * Date: 2025-10-28
 */
package com.JDE.mainserver.global.security.password;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordEncoderConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
