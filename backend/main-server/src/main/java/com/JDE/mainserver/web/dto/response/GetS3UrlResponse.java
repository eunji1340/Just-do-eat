package com.JDE.mainserver.web.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * S3 업로드 URL 응답 DTO
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-10
 */
@Getter
@Builder
public class GetS3UrlResponse {
    private String preSignedUrl;
    private String key;
}