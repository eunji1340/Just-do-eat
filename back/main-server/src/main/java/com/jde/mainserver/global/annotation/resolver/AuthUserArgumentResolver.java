package com.jde.mainserver.global.annotation.resolver;

// com.jde.mainserver.global.resolver.AuthMemberArgumentResolver.java

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Component // ← 스프링 빈 등록
@RequiredArgsConstructor // ← 생성자 주입 자동 생성
public class AuthUserArgumentResolver implements HandlerMethodArgumentResolver {

    private final MemberRepository memberRepository;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // 파라미터에 @AuthUser가 붙어 있고 타입이 Long 또는 Member일 때 동작
        if (!parameter.hasParameterAnnotation(AuthUser.class)) {
            return false;
        }
        Class<?> type = parameter.getParameterType();
        return Long.class.isAssignableFrom(type) || Member.class.isAssignableFrom(type);
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory
    ) {
        // SecurityContext에서 인증 정보 꺼내기
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isLongParam = Long.class.isAssignableFrom(parameter.getParameterType());
        
        log.debug("AuthUserArgumentResolver: auth={}, authType={}, isAuthenticated={}, isLongParam={}", 
            auth, auth != null ? auth.getClass().getSimpleName() : "null", 
            auth != null ? auth.isAuthenticated() : false, isLongParam);
        
        // auth가 null이거나, UsernamePasswordAuthenticationToken이지만 principal이 없으면 null 반환
        if (auth == null) {
            if (isLongParam) {
                log.debug("AuthUserArgumentResolver: auth is null, returning null for Long param");
                return null;
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        
        // UsernamePasswordAuthenticationToken인 경우 principal만 확인 (authorities가 없어도 인증된 것으로 간주)
        if (auth instanceof UsernamePasswordAuthenticationToken) {
            // principal이 있으면 인증된 것으로 간주 (isAuthenticated()는 authorities가 있어야 true이므로 별도 체크)
            // 이 경우는 통과
        } else if (!auth.isAuthenticated()) {
            // 다른 Authentication 타입이고 인증되지 않은 경우
            if (isLongParam) {
                log.debug("AuthUserArgumentResolver: auth not authenticated, returning null for Long param");
                return null;
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }

        // ← 현재 프로젝트의 JwtFilter는 UsernamePasswordAuthenticationToken의 principal에
        //    'subject(=memberId 문자열)'을 넣으므로 그 전제에 맞춰 파싱
        if (auth instanceof UsernamePasswordAuthenticationToken upat) {
            Object principal = upat.getPrincipal();

            if (!(principal instanceof String subject)) {
                // Long 타입이면 비인증으로 간주
                if (isLongParam) return null;
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid principal");
            }

            // anonymousUser는 비인증 처리
            if ("anonymousUser".equals(subject)) {
                if (isLongParam) return null;
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
            }

            Long memberId;
            try {
                memberId = Long.valueOf(subject);
            } catch (NumberFormatException e) {
                if (isLongParam) return null;
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid subject");
            }

            if (isLongParam) {
                return memberId;
            } else {
                Member member = memberRepository.findById(memberId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Member not found"));
                return member;
            }
        }

        // 다른 Authentication 타입(예: AnonymousAuthenticationToken)인 경우
        // Long 요청이면 비회원으로 간주하여 null 반환, Member 요청이면 401
        if (isLongParam) {
            return null;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
    }
}
