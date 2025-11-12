package com.jde.mainserver.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;

@Configuration
public class SecurityConfig {

	private static final String[] ALLOW_URLS = {
		"/", "/swagger-ui/**", "/swagger-resources/**",
		"/v3/api-docs/**", "/swagger-ui.html",
		"/api/test/**"
	};

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.authorizeHttpRequests(a -> a
				.requestMatchers("/","/swagger-ui/**","/v3/api-docs/**","/swagger-ui.html","/swagger-resources/**","/swagger-resources", "/main/**").permitAll()
				.anyRequest().permitAll()
			)
			.csrf(AbstractHttpConfigurer::disable)
			.httpBasic(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable);

		return http.build();
	}
}
