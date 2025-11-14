package com.jde.mainserver.member.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.member.dto.request.RegionUpdateRequest;
import com.jde.mainserver.member.dto.response.MemberRegionResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.region.entity.Region;
import com.jde.mainserver.region.repository.RegionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import static com.jde.mainserver.global.exception.code.MemberErrorCode.MEMBER_NOT_FOUND;

@Tag(name = "사용자 상권", description = "사용자 상권 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/users/me/region") // context-path=/api → 최종 /api/users/me/region
public class MemberRegionController {

    private final MemberRepository memberRepository;
    private final RegionRepository regionRepository;

    @Operation(
        summary = "내 상권 조회",
        description = "현재 로그인한 사용자의 상권 정보를 조회합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<MemberRegionResponse> getMyRegion(@AuthUser Long userId) {
        Member m = memberRepository.findById(userId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));
        return ApiResponse.onSuccess(MemberRegionResponse.of(m.getRegion()));
    }

    @Operation(
        summary = "내 상권 수정",
        description = "현재 로그인한 사용자의 상권을 수정합니다. region_id가 null이면 상권을 해제합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @PatchMapping
    @Transactional
    public ApiResponse<MemberRegionResponse> updateMyRegion(
            @AuthUser Long userId,
            @RequestBody RegionUpdateRequest req
    ) {
        Member m = memberRepository.findById(userId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));

        if (req.region_id() == null) {
            m.clearRegion();
            return ApiResponse.onSuccess(MemberRegionResponse.of(null));
        }

        Region r = regionRepository.findById(req.region_id())
                .orElseThrow(() -> new IllegalArgumentException("region not found"));
        m.changeRegion(r);
        return ApiResponse.onSuccess(MemberRegionResponse.of(r));
    }
}
