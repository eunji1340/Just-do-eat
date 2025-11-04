package com.JDE.mainserver.web.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * Test 목록 응답 DTO
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
@Getter
@Builder
public class TestInfoListResponse {
    private List<TestInfoResponse> tests;
}
