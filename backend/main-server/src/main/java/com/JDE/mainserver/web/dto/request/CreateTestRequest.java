package com.JDE.mainserver.web.dto.request;

import com.JDE.mainserver.test.entity.enums.TestCategory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Test 생성 요청 DTO
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
@Getter
@NoArgsConstructor
public class CreateTestRequest {

    @NotBlank(message = "텍스트는 필수입니다.")
    @Size(max = 100, message = "텍스트 길이는 100자 이하여야 합니다.")
    private String text;

    private TestCategory category;
}
