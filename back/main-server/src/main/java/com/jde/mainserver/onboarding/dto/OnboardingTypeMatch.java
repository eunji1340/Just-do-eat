package com.jde.mainserver.onboarding.dto;

/**
 * 온보딩 타입 결과의 매칭 항목(궁합) DTO.
 * - type: 상대 타입 코드 (예: "NPSD")
 * - label: 상대 타입 레이블
 * - imagePath: 정적 리소스 하위 배치된 이미지 경로 (/mbtis/{code}.png)
 */
public record OnboardingTypeMatch(
		String type,
		String label,
		String imagePath
) {}


