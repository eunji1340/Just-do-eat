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
        // ← 파라미터에 @AuthMember가 붙어 있고 타입이 Member일 때만 동작
        return parameter.hasParameterAnnotation(AuthUser.class)
                && Member.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory
    ) {
        // ← SecurityContext에서 인증 정보 꺼내기
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }

        // ← 현재 프로젝트의 JwtFilter는 UsernamePasswordAuthenticationToken의 principal에
        //    'subject(=memberId 문자열)'을 넣으므로 그 전제에 맞춰 파싱
        if (auth instanceof UsernamePasswordAuthenticationToken upat) {
            Object principal = upat.getPrincipal();

            if (!(principal instanceof String subject)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid principal");
            }

            Long memberId;
            try {
                memberId = Long.valueOf(subject);
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid subject");
            }

            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Member not found"));

            return member;
        }

        // ← (방어적) 다른 타입이면 인증 설정이 달라진 것. 401로 처리
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unsupported authentication");
    }
}
