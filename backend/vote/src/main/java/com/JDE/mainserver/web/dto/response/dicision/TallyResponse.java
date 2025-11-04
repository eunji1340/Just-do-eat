package com.JDE.mainserver.web.dto.response.decision;

import java.util.List;

public record TallyResponse(
        Long planId,
        List<Item> results,
        long totalVotes
) {
    public record Item(Long restaurantId, Long votes) {}
}
