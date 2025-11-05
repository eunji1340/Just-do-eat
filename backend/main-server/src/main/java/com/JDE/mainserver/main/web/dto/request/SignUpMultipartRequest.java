/**
 * web/dto/request/SignUpMultipartRequest.java
 * multipart/form-data 회원가입 폼 DTO
 * Author: kimheejin
 * 설명: 파일 업로드(image) 또는 imageUrl 중 택1 가능
 */
package com.JDE.mainserver.web.dto.request;

import com.JDE.mainserver.member.entity.enums.AgeGroup;
import com.JDE.mainserver.member.entity.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.springframework.web.multipart.MultipartFile;

@Getter
public class SignUpMultipartRequest {

    @NotBlank
    private String userId;

    @NotBlank
    private String password;

    /** (선택) 파일 업로드 */
    private MultipartFile image;

    /** (선택) 파일 대신 URL로 지정 */
    private String imageUrl;

    @NotNull
    private AgeGroup ageGroup;

    @NotNull
    private Gender gender;
}
