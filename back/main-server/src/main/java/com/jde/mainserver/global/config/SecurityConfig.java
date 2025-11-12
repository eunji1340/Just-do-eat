package com.jde.mainserver.global.config;

import com.jde.mainserver.global.security.jwt.JwtFilter;
import com.jde.mainserver.global.security.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity // ✅ 확실히 활성화
@RequiredArgsConstructor
public class SecurityConfig {

	private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
	private final JwtUtil jwtUtil;

	private static final String[] ALLOW_URLS = {
			"/", "/error",
			"/swagger-ui/**", "/swagger-resources/**", "/v3/api-docs/**", "/swagger-ui.html",
			"/actuator/**",
			"/auth/**",
			"/users/exists",
			"/regions/**",
			"/main/**",
			"/restaurants/**",
			// ⛳️ 임시: 플랜 투표 기능 열어서 동작 먼저 확인
			"/plans/**"
	};

	@Bean
	public JwtFilter jwtFilter() { return new JwtFilter(jwtUtil); }

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		log.info("SecurityConfig :: building filter chain"); // ✅ 부팅 시 찍히는지 확인

		http
				.csrf(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						// 정적 리소스 허용 (optional)
						.requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
						// 공개 URL
						.requestMatchers(ALLOW_URLS).permitAll()
						// 나머지는 인증 필요
						.anyRequest().authenticated()
				)
				.exceptionHandling(e -> e
						.authenticationEntryPoint((req, res, ex) -> res.sendError(401))
						.accessDeniedHandler((req, res, ex) -> res.sendError(403))
				)
				// ✅ JWT 필터 연결 (반드시 UsernamePasswordAuthenticationFilter보다 앞)
				.addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
