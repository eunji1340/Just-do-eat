package com.jde.mainserver.member.dto.request;

/**
 * web/dto/request/UpdateImageRequest.java
 * Author: kimheejin
 * Date: 2025-10-28
 * 이미지 업데이트 요청
 */
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UpdateImageRequest {
    @NotBlank
    private String imageUrl;
}
