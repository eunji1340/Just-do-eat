package com.jde.mainserver.plan.dto.response;

import com.jde.mainserver.plan.entity.PlanDecision;
import com.jde.mainserver.plan.entity.enums.DecisionStatus;
import com.jde.mainserver.plan.entity.enums.DecisionToolType;

import java.time.Instant;

public record DecisionResponse(
        Long planId,
        DecisionToolType toolType,
        DecisionStatus status,
        Long finalRestaurantId,
        Instant startedAt,
        Instant closedAt,
        Long createdBy
) {
    public static DecisionResponse from(PlanDecision d) {
        return new DecisionResponse(
                d.getPlanId(), d.getToolType(), d.getStatus(),
                d.getFinalRestaurantId(), d.getStartedAt(), d.getClosedAt(),
                d.getCreatedBy()
        );
    }
}
