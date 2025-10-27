package com.JDE.mainserver.web.dto.response;

import java.time.LocalDateTime;

import com.JDE.mainserver.test.entity.enums.TestCategory;

import lombok.Builder;
import lombok.Getter;

/**
 * Test 정보 응답 DTO
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
@Getter
@Builder
public class TestInfoResponse {
    private String text;
    private TestCategory category;
    private LocalDateTime createdAt;
}

