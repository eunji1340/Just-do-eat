package com.jde.mainserver.onboarding.mbti.dto;

import java.util.List;

public record MbtiQuestionItem(
		String id,
		String text,
		List<MbtiChoiceItem> choices
) {}


