package com.JDE.mainserver.global.config;

import com.JDE.mainserver.global.security.jwt.JwtFilter;
import com.JDE.mainserver.global.security.jwt.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Value("${app.jwt.secret:Q2jj11sMpDIAG64jMjOsuyW38wdLmpTqJp+BrvgwkLg=}")
    private String jwtSecret;

    @Bean
    public JwtUtil jwtUtil(
            @Value("${app.jwt.access-ttl-ms:3600000}") long accessTtl,
            @Value("${app.jwt.refresh-ttl-ms:1209600000}") long refreshTtl
    ) {
        return new JwtUtil(jwtSecret, accessTtl, refreshTtl);
    }

    /** 401 */
    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType("application/json");
            response.getWriter().write("""
                {"success":false,"code":"AUTH_001","message":"인증이 필요합니다."}
            """);
        };
    }

    /** 403 */
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType("application/json");
            response.getWriter().write("""
                {"success":false,"code":"AUTH_002","message":"접근 권한이 없습니다."}
            """);
        };
    }

    /** CORS */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("*"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtUtil jwtUtil,
            AuthenticationEntryPoint entryPoint,
            AccessDeniedHandler deniedHandler
    ) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // 온보딩/가입/로그인/중복확인 (정확 경로 매칭)
                        .requestMatchers(
                                "/onboarding/session", "/onboarding/session/",
                                "/onboarding/submit",  "/onboarding/submit/",
                                "/auth/login", "/auth/login/",
                                "/auth/signup", "/auth/signup/",
                                "/users", "/users/",
                                "/users/exists", "/users/exists/"
                        ).permitAll()

                        // Swagger / Actuator
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/actuator/**"
                        ).permitAll()

                        // 레거시 main
                        .requestMatchers("/main/**").permitAll()

                        // 프리플라이트
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 그 외 보호
                        .anyRequest().authenticated()
                )

                .formLogin(f -> f.disable())
                .httpBasic(b -> b.disable())
                .logout(l -> l.disable())

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler(deniedHandler)
                )

                .addFilterBefore(new JwtFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
