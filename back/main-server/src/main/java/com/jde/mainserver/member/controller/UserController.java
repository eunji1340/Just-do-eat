package com.jde.mainserver.member.controller;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.GeneralSuccessCode;
import com.jde.mainserver.member.dto.request.UpdateImageRequest;
import com.jde.mainserver.member.dto.response.MemberInfoResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.member.service.command.AuthCommandService;
import com.jde.mainserver.member.service.query.MemberQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final MemberQueryService memberQueryService;
    private final AuthCommandService authCommandService;

    // ✅ 추가: userId 폴백 조회를 위해 주입
    private final MemberRepository memberRepository;

    /** UX용 중복체크 */
    @GetMapping("/exists")
    public ApiResponse<Boolean> exists(@RequestParam String userId) {
        boolean exists = memberQueryService.existsUserId(userId);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, exists);
    }

    /** 내 정보 조회 (타임스탬프/상권 포함) */
    @GetMapping("/me")
    @Transactional(readOnly = true) // ✅ LAZY 초기화/조회 일관성 보장
    public ApiResponse<MemberInfoResponse> me(Authentication authentication) {
        Long memberId = currentMemberId(authentication);
        MemberInfoResponse info = memberQueryService.getMe(memberId);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, info);
    }

    /** 프로필 이미지 URL 수정 */
    @PatchMapping("/me/image")
    public ApiResponse<Void> updateImage(Authentication authentication,
                                         @RequestBody UpdateImageRequest req) {
        Long memberId = currentMemberId(authentication);
        authCommandService.updateProfileImage(memberId, req.getImageUrl());
        return ApiResponse.onSuccess(GeneralSuccessCode.OK);
    }

    /** 회원 탈퇴 */
    @DeleteMapping
    public ApiResponse<Void> deleteMe(Authentication authentication) {
        Long memberId = currentMemberId(authentication);
        authCommandService.deleteMe(memberId);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK);
    }

    /**
     * ✅ Authentication.getName() 안정화
     * - 토큰 sub가 숫자(memberId)면 그대로 사용
     * - 숫자가 아니면 userId로 간주하고 DB에서 memberId 조회 (이전 토큰/필터 대응)
     */
    private Long currentMemberId(Authentication authentication) {
        String subject = (authentication == null) ? null : authentication.getName();
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("인증이 필요합니다.");
        }

        boolean numeric = subject.chars().allMatch(Character::isDigit);
        if (numeric) {
            try {
                return Long.parseLong(subject);
            } catch (NumberFormatException e) {
                // 이 경우는 드묾: 숫자판단 true인데 파싱실패 → 방어적으로 userId 폴백
            }
        }

        // subject가 userId인 경우 폴백 조회
        Member m = memberRepository.findByUserId(subject)
                .orElseThrow(() -> new IllegalArgumentException("잘못된 토큰(subject) 또는 사용자 없음: " + subject));
        return m.getId();
    }
}
