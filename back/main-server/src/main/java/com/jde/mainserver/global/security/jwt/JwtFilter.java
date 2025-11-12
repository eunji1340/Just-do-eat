package com.jde.mainserver.global.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * JWT 인증 필터
 * - Authorization: Bearer <token> 헤더에서 토큰 추출
 * - jwtUtil.validate(...) 성공 시 SecurityContext에 Authentication 주입
 * - subject(=memberId 문자열)를 Authentication.getName() 으로 사용
 */
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(bearer) || !bearer.startsWith("Bearer ")) return null;
        return bearer.substring(7);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {

        // 디버깅용: 필터 타는지/요청 경로 확인
        if (log.isDebugEnabled()) {
            log.debug("JwtFilter :: {}", request.getRequestURI());
        }

        // 이미 인증이 설정되어 있으면 패스
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = resolveToken(request);

            if (token != null) {
                try {
                    if (jwtUtil.validate(token)) {
                        // 토큰 파싱
                        Jws<Claims> jws = jwtUtil.parse(token);
                        Claims claims = jws.getPayload();

                        // ✅ sub는 memberId 문자열이어야 함 (Auth 발급 시 setSubject(String.valueOf(id)))
                        String subject = claims.getSubject();

                        // (선택) role 클레임이 있으면 권한으로 복원
                        String role = claims.get("role", String.class);
                        Collection<? extends GrantedAuthority> authorities =
                                (role != null && !role.isBlank())
                                        ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                                        : Collections.emptyList();

                        // principal/name = subject 고정 → controller에서 authentication.getName() 사용 가능
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(subject, null, authorities);
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(auth);

                        if (log.isDebugEnabled()) {
                            log.debug("JwtFilter :: authenticated subject={} authorities={}", subject, authorities);
                        }
                    } else {
                        // 유효하지 않은 토큰: 컨텍스트 비우고 계속 진행(EntryPoint에서 401 처리)
                        if (log.isDebugEnabled()) {
                            log.debug("JwtFilter :: token validation failed");
                        }
                        SecurityContextHolder.clearContext();
                    }
                } catch (Exception e) {
                    // 파싱/만료/서명 오류 등: 인증 컨텍스트 정리
                    SecurityContextHolder.clearContext();
                    if (log.isDebugEnabled()) {
                        log.debug("JwtFilter :: token parse error: {}", e.getMessage());
                    }
                }
            } else {
                // 토큰 없음
                if (log.isTraceEnabled()) {
                    log.trace("JwtFilter :: no bearer token");
                }
            }
        }

        chain.doFilter(request, response);
    }
}
