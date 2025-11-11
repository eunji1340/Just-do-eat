package com.jde.mainserver.global.config;

import com.jde.mainserver.global.security.jwt.JwtFilter;
import com.jde.mainserver.global.security.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtUtil jwtUtil;

	// 허용 URL(필요 시 사용)
	private static final String[] ALLOW_URLS = {
			"/", "/swagger-ui/**", "/swagger-resources/**",
			"/v3/api-docs/**", "/swagger-ui.html",
			"/api/test/**" // context-path=/api 환경에서만 의미 있음
	};

	/** JwtFilter Bean 등록 */
	@Bean
	public JwtFilter jwtFilter() {
		return new JwtFilter(jwtUtil);
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						// ✅ permitAll (context-path는 매처에서 쓰지 않음)
						.requestMatchers(
								"/auth/**",
								"/users/exists",
								"/regions/**",
								"/actuator/**",
								// swagger
								"/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
						).permitAll()
						// ✅ 보호 구간
						.requestMatchers("/users/**").authenticated()
						.anyRequest().authenticated()
				);

		// ✅ JwtFilter를 UsernamePasswordAuthenticationFilter "앞"에 등록
		http.addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
