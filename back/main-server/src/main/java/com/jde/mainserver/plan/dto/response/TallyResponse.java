package com.jde.mainserver.plan.dto.response;

import java.util.List;

public record TallyResponse(
        Long planId,
        List<Item> results,
        long totalVotes
) {
    public record Item(Long restaurantId, long votes) {}
}
