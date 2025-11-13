package com.jde.mainserver.global.config;

import com.jde.mainserver.global.security.jwt.JwtFilter;
import com.jde.mainserver.global.security.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    private final JwtUtil jwtUtil;
    private final CorsConfig corsConfig;

    /** 인증 없이 접근 가능한 공개 URL */
    private static final String[] ALLOW_URLS = {
            "/", "/error",
            "/swagger-ui/**", "/swagger-resources/**", "/v3/api-docs/**", "/swagger-ui.html",
            "/actuator/**",
            "/auth/**",
            "/onboarding/**",
            "/users/exists",
            "/regions/**",
            "/main/**",
            "/restaurants/**",
            "/test/**"
            // ⚠️ /plans/** 는 보호됨(토큰 필요)
    };

    @Bean
    public JwtFilter jwtFilter() {
        return new JwtFilter(jwtUtil);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("SecurityConfig :: building filter chain");

        http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)

                // CORS + Stateless
                .addFilter(corsConfig.corsFilter())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 권한
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
                        .requestMatchers(ALLOW_URLS).permitAll()
                        .requestMatchers("/files/profile/**").authenticated()
                        .anyRequest().authenticated()
                )

                // 예외
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> res.sendError(401))
                        .accessDeniedHandler((req, res, ex) -> res.sendError(403))
                )

                // JWT 필터
                .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}