/**
 * global/config/SecurityConfig.java
 * 보안 설정 (JWT 기반, Stateless)
 * Author: Kim
 * Date: 2025-11-12 (updated)
 */
package com.jde.mainserver.global.config;

import com.jde.mainserver.global.security.jwt.JwtFilter;
import com.jde.mainserver.global.security.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtUtil jwtUtil;
	private final CorsConfig corsConfig;

	// ✅ 인증 없이 접근 가능한 공개 URL 목록
	private static final String[] ALLOW_URLS = {
			"/",
			"/swagger-ui/**", "/swagger-resources/**", "/v3/api-docs/**", "/swagger-ui.html",
			"/actuator/**",
			"/auth/**",
			"/users/exists",
			"/regions/**",
			"/main/**",
			"/restaurants/**", // ✅ 식당 검색/상세는 JWT 없이 허용
			"/test/**"
	};

	/** ✅ JwtFilter Bean 등록 */
	@Bean
	public JwtFilter jwtFilter() {
		return new JwtFilter(jwtUtil);
	}

	/** ✅ 보안 필터 체인 구성 */
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				// 세션 비활성화 (Stateless)
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

				// 기본 인증 방식 비활성화
				.csrf(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)

				.addFilter(corsConfig.corsFilter())

				// 요청별 접근 권한 설정
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(ALLOW_URLS).permitAll()
						.anyRequest().authenticated()
				);

		// ✅ JwtFilter를 UsernamePasswordAuthenticationFilter "앞"에 등록
		http.addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
