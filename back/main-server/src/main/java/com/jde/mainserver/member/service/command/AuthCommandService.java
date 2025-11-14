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
import com.jde.mainserver.region.entity.Region;
import com.jde.mainserver.region.repository.RegionRepository;
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

    // ⭐ 기본 지역 조회용
    private final RegionRepository regionRepository;

    /**
     * 회원가입
     * - userId: PK (AUTO_INCREMENT)
     * - name: 로그인용 문자열
     */
    @Transactional
    public void signUp(SignUpRequest req) {
        if (memberRepository.existsByName(req.getName())) {
            throw new CustomException(USER_ID_DUPLICATED); // 기존 코드 그대로 사용
        }

        String encoded = passwordEncoder.encode(req.getPassword());
        AgeGroup ageGroup = req.getAgeGroup();
        Gender gender = req.getGender();
        Role role = Role.USER;

        // ⭐ 기본 지역 로딩 (id = 1)
        Region defaultRegion = regionRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("기본 지역(1)이 존재하지 않습니다."));

        // ⭐ region 자리에 기본 지역 세팅
        Member member = new Member(
                req.getName(),
                encoded,
                req.getImageUrl(),
                role,
                ageGroup,
                gender,
                defaultRegion
        );

        memberRepository.save(member);

        String sid = req.getSessionId();
        if (sid != null && !sid.isBlank()) {
            onboardingSurveyStore.migrateSessionToUser(sid, member.getUserId());
        }
    }

    /**
     * 로그인
     * - name 기준으로 조회
     * - 토큰 subject에는 userId(Long)을 사용
     */
    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest req) {
        Member member = memberRepository.findByName(req.getName())
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));

        if (!passwordEncoder.matches(req.getPassword(), member.getPassword())) {
            throw new CustomException(INVALID_CREDENTIALS);
        }

        String access = jwtUtil.createAccessToken(String.valueOf(member.getUserId()));
        String refresh = jwtUtil.createRefreshToken(String.valueOf(member.getUserId()));

        return new TokenResponse(access, refresh);
    }

    /**
     * 프로필 이미지 수정
     */
    @Transactional
    public void updateProfileImage(Long userId, String imageUrl) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));
        member.setImageUrl(imageUrl);
    }

    /**
     * 회원 탈퇴
     */
    @Transactional
    public void deleteMe(Long userId) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));
        memberRepository.delete(member);
    }

    /**
     * 로그아웃 (옵션)
     */
    public void logout(Long userId) {
        // RefreshToken 블랙리스트 사용 시 구현
    }
}
