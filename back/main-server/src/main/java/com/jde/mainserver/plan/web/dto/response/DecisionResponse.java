package com.jde.mainserver.plan.web.dto.response;

import com.jde.mainserver.plan.entity.PlanDecision;
import com.jde.mainserver.plan.entity.enums.PlanStatus;
import com.jde.mainserver.plan.entity.enums.PlanDecisionTool;

import java.time.Instant;

public record DecisionResponse(
        Long planId,
        PlanDecisionTool toolType,
        PlanStatus status,
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
