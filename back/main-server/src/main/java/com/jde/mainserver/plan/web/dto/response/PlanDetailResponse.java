package com.jde.mainserver.plan.web.dto.response;

import com.jde.mainserver.plan.entity.enums.PlanDecisionTool;
import com.jde.mainserver.plan.entity.enums.PlanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PlanDetailResponse {

    private Long roomId;
    private String roomName;
    private Long planId;
    private String planPlace;
    private String startAt;
    private String planManager;
    private PlanStatus status;
    private PlanDecisionTool decisionTool;
    private Object priceRange;
    private Object dislikeCategoryList;
    private List<PlanParticipantInfo> planParticipantList;
}
