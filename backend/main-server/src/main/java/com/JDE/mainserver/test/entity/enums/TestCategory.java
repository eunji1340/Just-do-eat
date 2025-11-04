package com.JDE.mainserver.test.entity.enums;

import lombok.Getter;

/**
 * Test 카테고리 열거형
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
@Getter
public enum TestCategory {

    ONE("하나"),
    TWO("둘");

    private final String description;

    TestCategory(String description) {
        this.description = description;
    }
}
