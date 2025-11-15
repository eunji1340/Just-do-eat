package com.jde.mainserver.onboarding.dto.request;

/**
 * 먹BTI 문항 단일 응답 DTO.
 * - qid: "q{숫자}" 형태의 질문 식별자 (예: "q1")
 * - choiceId: 선택지 코드 (예: "A", "B")
 */
public record MukbtiAnswer(
		String qid,
		String choiceId
) {}


