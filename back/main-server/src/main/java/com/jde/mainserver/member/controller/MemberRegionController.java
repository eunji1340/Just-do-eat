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

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<MemberRegionResponse> getMyRegion(Authentication auth) {
        Long memberId = currentMemberId(auth);
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("member not found"));
        return ApiResponse.onSuccess(MemberRegionResponse.of(m.getRegion()));
    }

    @PatchMapping
    @Transactional
    public ApiResponse<MemberRegionResponse> updateMyRegion(Authentication auth,
                                                            @RequestBody RegionUpdateRequest req) {
        Long memberId = currentMemberId(auth);
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("member not found"));

        // MemberRegionController.java (수정 부분만)
        if (req.region_id() == null) {
            m.clearRegion();
            return ApiResponse.onSuccess(MemberRegionResponse.of(null));
        }

        Region r = regionRepository.findById(req.region_id())
                .orElseThrow(() -> new IllegalArgumentException("region not found"));
        m.changeRegion(r);
        return ApiResponse.onSuccess(MemberRegionResponse.of(r));

    }

    private Long currentMemberId(Authentication authentication) {
        String sub = (authentication == null) ? null : authentication.getName();
        if (sub == null || sub.isBlank()) throw new IllegalArgumentException("인증 필요");
        boolean numeric = sub.chars().allMatch(Character::isDigit);
        if (numeric) try { return Long.parseLong(sub); } catch (NumberFormatException ignored) {}
        return memberRepository.findByUserId(sub)
                .map(Member::getId)
                .orElseThrow(() -> new IllegalArgumentException("member not found: " + sub));
    }
}
