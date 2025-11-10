package com.jde.mainserver.member.dto.request;

/**
 * web/dto/request/SignUpRequest.java
 * JSON 기반 회원가입 DTO
 * Author: kimheejin
 * Date: 2025-10-28
 */
import com.jde.mainserver.member.entity.enums.AgeGroup;
import com.jde.mainserver.member.entity.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequest {
    @NotBlank
    private String userId;

    @NotBlank
    private String password;

    /** 옵션: URL로 바로 지정하고 싶을 때 */
    private String imageUrl;

    @NotNull
    private AgeGroup ageGroup;

    @NotNull
    private Gender gender;

    private String sessionId;
}
