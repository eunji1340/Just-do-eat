package com.jde.mainserver.member.service.command;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.global.security.jwt.JwtUtil;
import com.jde.mainserver.member.dto.request.LoginRequest;
import com.jde.mainserver.member.dto.request.SignUpRequest;
import com.jde.mainserver.member.dto.response.TokenResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.entity.enums.AgeGroup;
import com.jde.mainserver.member.entity.enums.Gender;
import com.jde.mainserver.member.entity.enums.Role;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.jde.mainserver.global.exception.code.MemberErrorCode.*;

@Service
@RequiredArgsConstructor
public class AuthCommandService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // 온보딩 이관 저장소
    private final OnboardingSurveyStore onboardingSurveyStore;

    @Transactional
    public void signUp(SignUpRequest req) {
        if (memberRepository.existsByUserId(req.getUserId())) {
            throw new CustomException(USER_ID_DUPLICATED);
        }

        String encoded = passwordEncoder.encode(req.getPassword());
        AgeGroup ageGroup = req.getAgeGroup();
        Gender gender = req.getGender();
        Role role = Role.USER;

        // ✅ region은 초기 null: 6-파라미터 생성자 사용
        Member m = new Member(
                req.getUserId(),
                encoded,
                req.getImageUrl(),
                role,
                ageGroup,
                gender,
                null
        );
        memberRepository.save(m);

        // 온보딩 세션 데이터 → 유저로 이관
        String sid = req.getSessionId();
        if (sid != null && !sid.isBlank()) {
            onboardingSurveyStore.migrateSessionToUser(sid, m.getId());
        }
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest req) {
        Member m = memberRepository.findByUserId(req.getUserId())
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));

        if (!passwordEncoder.matches(req.getPassword(), m.getPassword())) {
            throw new CustomException(INVALID_CREDENTIALS);
        }

        String access = jwtUtil.createAccessToken(String.valueOf(m.getId()));
        String refresh = jwtUtil.createRefreshToken(String.valueOf(m.getId()));
        return new TokenResponse(access, refresh);
    }

    @Transactional
    public void updateProfileImage(Long memberId, String imageUrl) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));
        m.setImageUrl(imageUrl);
    }

    @Transactional
    public void deleteMe(Long memberId) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));
        memberRepository.delete(m);
    }

    public void logout(Long memberId) {
        // (옵션) RefreshToken 블랙리스트 등 사용 시 처리
    }
}
