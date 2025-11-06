package com.JDE.mainserver.plans.decision.dto.request;

import jakarta.validation.constraints.NotNull;

public record ConfirmDecisionRequest(
        @NotNull Long restaurantId
) {}
