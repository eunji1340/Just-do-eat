package com.jde.mainserver.global.config;

import org.springframework.context.annotation.Bean;         // ✅ 스프링 빈 등록 어노테이션
import org.springframework.context.annotation.Configuration; // ✅ 설정 클래스 표시
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {
    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://k13a701.p.ssafy.io",
                "https://k13a701.p.ssafy.io"
        ));
        config.setAllowedMethods(List.of("*"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Set-Cookie"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

//    @Bean
//    public CorsFilter corsFilter() {
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        CorsConfiguration config = new CorsConfiguration();
//
//        config.setAllowedOrigins(List.of(
//                "http://localhost:5173",      // Vite 개발 서버
//                "http://k13a701.p.ssafy.io",  // 운영 도메인 있으면 추가
//                "https://k13a701.p.ssafy.io"
//        ));
//
//        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
//        config.setAllowedHeaders(List.of(
//                "Authorization","Content-Type","X-Requested-With","Accept","Origin",
//                "Access-Control-Request-Method","Access-Control-Request-Headers"
//        ));
//
//        config.setAllowCredentials(true);   // ✅ 자격증명 허용(쿠키/세션/Authorization)
//        config.setExposedHeaders(List.of("Authorization","Set-Cookie"));
//        config.setMaxAge(3600L);            // ✅ 프리플라이트 캐시(선택)
//
//        source.registerCorsConfiguration("/**", config);
//        return new CorsFilter(source);
//    }
}
