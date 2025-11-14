package com.jde.mainserver.member.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 프로필 이미지 변경 응답 DTO
 * - data.imageUrl : 최종적으로 적용된 이미지 URL (또는 null/기본 이미지)
 */
@Getter
@AllArgsConstructor
public class UpdateImageResponse {

    private String imageUrl;

    public static UpdateImageResponse of(String imageUrl) {
        return new UpdateImageResponse(imageUrl);
    }
}
