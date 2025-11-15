package com.jde.mainserver.onboarding.dto;

import java.util.List;

/**
 * 온보딩 타입 결과 DTO.
 * - code: 타입 코드 (예: "MPST")
 * - label/nickname: 타입 레이블/닉네임
 * - keywords: 대표 키워드 배열
 * - description: 타입 설명
 * - goodMatch/badMatch: 궁합이 좋은/나쁜 타입 리스트
 * - imagePath: 정적 리소스 하위 배치된 이미지 경로 (/mbtis/{code}.png)
 */
public record OnboardingTypeResult(
		String code,
		String label,
		String nickname,
		List<String> keywords,
		String description,
		List<OnboardingTypeMatch> goodMatch,
		List<OnboardingTypeMatch> badMatch,
		String imagePath
) {}


