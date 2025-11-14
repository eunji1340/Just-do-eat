package com.jde.mainserver.onboarding.mbti.dto;

import java.util.List;

public record MbtiChoiceItem(
		String id,
		String text,
		List<String> axes
) {}


