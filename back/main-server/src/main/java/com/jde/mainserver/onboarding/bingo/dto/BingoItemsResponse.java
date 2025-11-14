package com.jde.mainserver.onboarding.bingo.dto;

import java.util.List;

public record BingoItemsResponse(
		List<BingoItem> items
) {}


