package com.JDE.mainserver.plans.decision.dto.response;

import java.util.List;

public record TallyResponse(
        Long planId,
        List<Item> results,
        long totalVotes
) {
    public record Item(Long restaurantId, Long votes) {}
}
