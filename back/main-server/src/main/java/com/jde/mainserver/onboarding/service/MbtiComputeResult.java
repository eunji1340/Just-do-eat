package com.jde.mainserver.onboarding.service;

import java.util.Map;

/**
 * 먹BTI 계산 결과 DTO.
 * - code: 최종 4글자 코드 (예: MPST)
 * - weights: 각 축 우세 측의 차이값(가중치) 맵 (예: {"M":1,"P":2,"S":0,"D":1})
 */
public record MbtiComputeResult(
		String code,
		Map<String, Integer> weights
) {}


