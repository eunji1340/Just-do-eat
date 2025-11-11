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
    private Long id;
    private String userId;
    private String imageUrl;
    private Role role;
    private AgeGroup ageGroup;
    private Gender gender;

    // ✅ 추가: 감사 타임스탬프
    private Instant createdAt;
    private Instant updatedAt;

    // ✅ 선택: 기본 상권 정보(없을 수 있음)
    private Long regionId;
    private String regionName;

    public static MemberInfoResponse from(Member m) {
        return new MemberInfoResponse(
                m.getId(),
                m.getUserId(),
                m.getImageUrl(),
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
