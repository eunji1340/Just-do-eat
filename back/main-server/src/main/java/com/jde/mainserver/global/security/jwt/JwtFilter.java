package com.jde.mainserver.global.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

public class JwtFilter extends OncePerRequestFilter {

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

        // 이미 인증이 설정되어 있으면 패스
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = resolveToken(request);

            if (token != null && jwtUtil.validate(token)) {
                try {
                    // 토큰 파싱
                    Jws<Claims> jws = jwtUtil.parse(token);
                    Claims claims = jws.getPayload();

                    // ✅ sub는 memberId 문자열이어야 함 (AuthCommandService에서 setSubject(String.valueOf(id)))
                    String subject = claims.getSubject();

                    // (선택) role 클레임이 있으면 권한으로 복원
                    String role = claims.get("role", String.class);
                    Collection<? extends GrantedAuthority> authorities =
                            (role != null && !role.isBlank())
                                    ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                                    : Collections.emptyList();

                    // ✅ principal/name = subject 고정 → controller에서 authentication.getName() 사용 가능
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(subject, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(auth);

                } catch (Exception e) {
                    // 파싱/만료/서명 오류 등: 인증 컨텍스트 정리 (컨트롤러에서 401 처리되도록)
                    SecurityContextHolder.clearContext();
                }
            }
        }

        chain.doFilter(request, response);
    }
}
