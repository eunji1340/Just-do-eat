package com.JDE.mainserver.web.controller;

import com.JDE.mainserver.global.api.ApiResponse;
import com.JDE.mainserver.global.exception.code.GeneralSuccessCode;
import com.JDE.mainserver.member.service.AuthCommandService;
import com.JDE.mainserver.member.service.MemberQueryService;
import com.JDE.mainserver.web.dto.request.UpdateImageRequest;
import com.JDE.mainserver.web.dto.response.MemberInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final MemberQueryService memberQueryService;
    private final AuthCommandService authCommandService;

    /** UX용 중복체크 */
    @GetMapping("/exists")
    public ApiResponse<Boolean> exists(@RequestParam String userId) {
        boolean exists = memberQueryService.existsUserId(userId);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, exists);
    }

    /** 내 정보 조회 */
    @GetMapping("/me")
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

    private Long currentMemberId(Authentication authentication) {
        String subject = authentication == null ? null : authentication.getName();
        if (subject == null) throw new IllegalArgumentException("인증이 필요합니다.");
        try { return Long.parseLong(subject); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("잘못된 토큰(subject)입니다."); }
    }
}
