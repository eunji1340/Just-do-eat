package com.JDE.mainserver.plans.decision.dto.request;

import jakarta.validation.constraints.NotNull;

public record SubmitBallotRequest(
        @NotNull Long restaurantId
) {}
