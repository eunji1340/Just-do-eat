package com.jde.mainserver.onboarding.dto.request;

import java.util.List;

/**
 * 온보딩 종료 시 프론트에서 전달하는 임포트 요청 DTO.
 * - 인증 불필요(permitAll)
 * - 먹BTI 문항 응답, 빙고 응답, 세션ID를 포함
 */
public record OnboardingImportRequest(
		List<MukbtiAnswer> mukbtiAnswers,
		List<BingoVote> bingoResponses,
		String sessionId
) {}


