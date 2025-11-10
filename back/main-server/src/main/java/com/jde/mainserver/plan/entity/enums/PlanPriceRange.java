package com.jde.mainserver.plan.entity.enums;

public enum PlanPriceRange {

    LOW("1인당 1만원 이하"),
    MEDIUM("1인당 3만원 이하"),
    HIGH("1인당 5만원 이하"),
    PREMIUM("1인당 10만원 이하");

    private final String priceRange;

    PlanPriceRange(String priceRange) { this.priceRange = priceRange; }
}
