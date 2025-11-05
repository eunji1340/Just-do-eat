package com.jde.mainserver.main.web.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record PersonalScoreResponse(
        List<ScoredItem> items,
        Map<String, Object> debug
) {
    public record ScoredItem(
            @JsonProperty("restaurant_id")
            Long restaurantId,
            double score,
            Map<String, Object> reasons
    ) {}
}