package com.jde.mainserver.room.web.dto.response;

import com.jde.mainserver.plan.entity.enums.PlanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class PlanInfo {

    private Long planId;
    private String planName;
    private LocalDateTime startAt;
    private String planManager;
    private Long count;
    private PlanStatus status;
    private Long restaurantId;
    private String restaurantName;
    private String restaurantImageUrl;
}
