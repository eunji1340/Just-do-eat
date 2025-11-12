package com.jde.mainserver.member.controller;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.GeneralSuccessCode;
import com.jde.mainserver.member.dto.request.UpdateImageRequest;
import com.jde.mainserver.member.dto.response.MemberInfoResponse;
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

    /** UX용 중복체크 (로그인용 아이디: name) */
    @GetMapping("/exists")
    public ApiResponse<Boolean> exists(@RequestParam String name) {
        boolean exists = memberQueryService.existsName(name);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, exists);
    }

    /** 내 정보 조회 (타임스탬프/상권 포함) */
    @GetMapping("/me")
    @Transactional(readOnly = true)
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

    /** 토큰 subject = memberId(Long) 전제 */
    private Long currentMemberId(Authentication authentication) {
        String subject = (authentication == null) ? null : authentication.getName();
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("인증이 필요합니다.");
        }
        try {
            return Long.parseLong(subject);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("잘못된 토큰(subject)입니다.");
        }
    }
}
