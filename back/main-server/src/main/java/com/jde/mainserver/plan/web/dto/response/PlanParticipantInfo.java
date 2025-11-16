package com.jde.mainserver.plan.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PlanParticipantInfo {

    private Long userId;
    private String userName;
    private String userUrl;
}
