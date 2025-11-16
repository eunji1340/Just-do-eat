package com.jde.mainserver.plan.converter;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.plan.entity.PlanParticipant;
import com.jde.mainserver.plan.web.dto.response.PlanParticipantInfo;
import org.springframework.stereotype.Component;

@Component
public class PlanParticipantConverter {
    public PlanParticipantInfo toPlanParticipantInfo(PlanParticipant planParticipant) {
        Member user = planParticipant.getUser();

        return PlanParticipantInfo.builder()
                .userId(user.getUserId())
                .userName(user.getName())
                .userUrl(user.getImageUrl())
                .build();
    }
}
