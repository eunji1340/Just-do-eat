package com.jde.mainserver.member.controller;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.member.dto.request.RegionUpdateRequest;
import com.jde.mainserver.member.dto.response.MemberRegionResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.region.entity.Region;
import com.jde.mainserver.region.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users/me/region") // context-path=/api → 최종 /api/users/me/region
public class MemberRegionController {

    private final MemberRepository memberRepository;
    private final RegionRepository regionRepository;

    /** 내 상권 조회 */
    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<MemberRegionResponse> getMyRegion(Authentication auth) {
        Long userId = currentUserId(auth);
        Member m = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("member not found"));
        return ApiResponse.onSuccess(MemberRegionResponse.of(m.getRegion()));
    }

    /** 내 상권 수정 (null이면 해제) */
    @PatchMapping
    @Transactional
    public ApiResponse<MemberRegionResponse> updateMyRegion(
            Authentication auth,
            @RequestBody RegionUpdateRequest req
    ) {
        Long userId = currentUserId(auth);
        Member m = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("member not found"));

        if (req.region_id() == null) {
            m.clearRegion();
            return ApiResponse.onSuccess(MemberRegionResponse.of(null));
        }

        Region r = regionRepository.findById(req.region_id())
                .orElseThrow(() -> new IllegalArgumentException("region not found"));
        m.changeRegion(r);
        return ApiResponse.onSuccess(MemberRegionResponse.of(r));
    }

    /** JWT subject를 userId(Long)으로만 사용 */
    private Long currentUserId(Authentication authentication) {
        String sub = (authentication == null) ? null : authentication.getName();
        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("인증 필요");
        }
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("잘못된 토큰(subject)입니다.");
        }
    }
}
