package com.jde.mainserver.plan.converter;

import com.jde.mainserver.global.api.KakaoLocalService;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.web.dto.response.PlanDetailResponse;
import com.jde.mainserver.plan.web.dto.response.PlanParticipantInfo;
import com.jde.mainserver.room.entity.Room;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PlanConverter {

    private final KakaoLocalService kakaoLocalService;

    public PlanDetailResponse toPlanDetailResponse(Room room, Plan plan, String planManager, List<PlanParticipantInfo> planParticipantList) {

        Point point = plan.getPlanGeom();
        String planPlace = kakaoLocalService.getAddressName(point);

        LocalDateTime planDate = plan.getStartsAt();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String startAt = planDate.format(formatter);


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
