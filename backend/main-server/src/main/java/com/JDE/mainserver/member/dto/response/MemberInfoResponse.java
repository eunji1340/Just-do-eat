package com.JDE.mainserver.member.dto.response;

import com.JDE.mainserver.member.entity.Member;
import com.JDE.mainserver.member.entity.enums.AgeGroup;
import com.JDE.mainserver.member.entity.enums.Gender;
import com.JDE.mainserver.member.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberInfoResponse {
    private Long id;
    private String userId;
    private String imageUrl;
    private Role role;
    private AgeGroup ageGroup;
    private Gender gender;

    public static MemberInfoResponse from(Member m) {
        return new MemberInfoResponse(
                m.getId(),
                m.getUserId(),
                m.getImageUrl(),
                m.getRole(),
                m.getAgeGroup(),
                m.getGender()
        );
    }
}
