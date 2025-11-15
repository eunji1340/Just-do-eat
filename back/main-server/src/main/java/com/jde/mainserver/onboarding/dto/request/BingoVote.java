package com.jde.mainserver.onboarding.dto.request;

/**
 * 빙고 항목에 대한 단일 응답 DTO.
 * - id: 빙고 항목 식별자 (예: "pineapple_pizza")
 * - vote: 1(좋아함), 0(건너뜀), -1(싫어함)
 */
public record BingoVote(
		String id,
		int vote
) {}


