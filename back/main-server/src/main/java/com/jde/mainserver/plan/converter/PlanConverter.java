package com.jde.mainserver.plan.converter;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.PlanParticipant;
import com.jde.mainserver.plan.web.dto.response.PlanDetailResponse;
import com.jde.mainserver.plan.web.dto.response.PlanParticipantInfo;
import com.jde.mainserver.room.entity.Room;
import org.geolatte.geom.Point;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PlanConverter {

    public PlanDetailResponse toPlanDetailResponse(Room room, Plan plan, String planManager, List<PlanParticipantInfo> planParticipantList) {

        Point point = plan.getPlanGeom();
        String planPlace = "갱남";
        String startAt = "2025-11-20 18:00";

        return PlanDetailResponse.builder()
                .roomId(room.getRoomId())
                .roomName(room.getRoomName())
                .planPlace(planPlace)
                .startAt(startAt)
                .planManager(planManager)
                .status(plan.getStatus())
                .decisionTool(plan.getDecisionTool())
                .priceRange(plan.getPriceRanges())
                .dislikeCategoryList(plan.getDislikeCategories())
                .planParticipantList(planParticipantList)
                .build();
    }
}
