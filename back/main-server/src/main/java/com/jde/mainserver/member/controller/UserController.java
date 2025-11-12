package com.jde.mainserver.member.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.GeneralSuccessCode;
import com.jde.mainserver.member.dto.request.UpdateImageRequest;
import com.jde.mainserver.member.dto.response.MemberInfoResponse;
import com.jde.mainserver.member.service.command.AuthCommandService;
import com.jde.mainserver.member.service.query.MemberQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Tag(name = "사용자", description = "사용자 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final MemberQueryService memberQueryService;
    private final AuthCommandService authCommandService;

    @Operation(summary = "아이디 중복 확인", description = "로그인용 아이디(name)의 중복 여부를 확인합니다.")
    @GetMapping("/exists")
    public ApiResponse<Boolean> exists(
            @Parameter(description = "확인할 아이디", example = "user123")
            @RequestParam String name
    ) {
        boolean exists = memberQueryService.existsName(name);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, exists);
    }

    @Operation(
        summary = "내 정보 조회",
        description = "현재 로그인한 사용자의 정보를 조회합니다. 타임스탬프 및 상권 정보를 포함합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ApiResponse<MemberInfoResponse> me(@AuthUser Long userId) {
        MemberInfoResponse info = memberQueryService.getMe(userId);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, info);
    }

    @Operation(
        summary = "프로필 이미지 수정",
        description = "현재 로그인한 사용자의 프로필 이미지 URL을 수정합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @PatchMapping("/me/image")
    public ApiResponse<Void> updateImage(
            @AuthUser Long userId,
            @RequestBody UpdateImageRequest req
    ) {
        authCommandService.updateProfileImage(userId, req.getImageUrl());
        return ApiResponse.onSuccess(GeneralSuccessCode.OK);
    }

    @Operation(
        summary = "회원 탈퇴",
        description = "현재 로그인한 사용자의 계정을 삭제합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @DeleteMapping
    public ApiResponse<Void> deleteMe(@AuthUser Long userId) {
        authCommandService.deleteMe(userId);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK);
    }
}
