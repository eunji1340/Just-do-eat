package com.jde.mainserver.member.dto.request;

import lombok.Getter;

/**
 * web/dto/request/UpdateImageRequest.java
 * 프로필 이미지 변경 요청 DTO
 *
 * - imageUrl != null : 해당 URL로 프로필 이미지 설정/변경
 * - imageUrl == null : 기존 이미지 제거 → 기본 이미지로 회귀
 */
@Getter
public class UpdateImageRequest {

    /**
     * 프로필 이미지 URL (https 절대 경로 권장)
     * null이면 이미지 제거로 해석
     */
    private String imageUrl;
}
