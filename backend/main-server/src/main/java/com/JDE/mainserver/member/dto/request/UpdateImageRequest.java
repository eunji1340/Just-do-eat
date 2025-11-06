/**
 * web/dto/request/UpdateImageRequest.java
 * Author: kimheejin
 * Date: 2025-10-28
 * 이미지 업데이트 요청
 */
package com.JDE.mainserver.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UpdateImageRequest {
    @NotBlank
    private String imageUrl;
}
