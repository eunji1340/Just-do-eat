package com.jde.mainserver.member.dto.response;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.entity.enums.AgeGroup;
import com.jde.mainserver.member.entity.enums.Gender;
import com.jde.mainserver.member.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class MemberInfoResponse {
    private Long userId;
    private String name;
    private String imageUrl;
    private Role role;
    private AgeGroup ageGroup;
    private Gender gender;

    // 감사 타임스탬프
    private Instant createdAt;
    private Instant updatedAt;

    // 기본 상권 정보(없을 수 있음)
    private Long regionId;
    private String regionName;

    // 기본: DB에 저장된 imageUrl 그대로 사용
    public static MemberInfoResponse from(Member m) {
        return from(m, m.getImageUrl());
    }

    // presigned GET URL 같은 "대체 URL"을 넣고 싶을 때 사용
    public static MemberInfoResponse from(Member m, String overrideImageUrl) {
        String finalImageUrl = (overrideImageUrl != null && !overrideImageUrl.isBlank())
                ? overrideImageUrl
                : m.getImageUrl();

        return new MemberInfoResponse(
                m.getUserId(),
                m.getName(),
                finalImageUrl,
                m.getRole(),
                m.getAgeGroup(),
                m.getGender(),
                m.getCreatedAt(),
                m.getUpdatedAt(),
                (m.getRegion() == null ? null : m.getRegion().getId()),
                (m.getRegion() == null ? null : m.getRegion().getName())
        );
    }
}
