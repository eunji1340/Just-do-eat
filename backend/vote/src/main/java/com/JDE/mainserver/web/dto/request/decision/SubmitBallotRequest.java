package com.JDE.mainserver.web.dto.request.decision;

import jakarta.validation.constraints.NotNull;

public record SubmitBallotRequest(
        @NotNull Long restaurantId
) {}
