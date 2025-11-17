package com.jde.mainserver.plan.service.command;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.plan.web.dto.response.DeletePlanResponse;

public interface DeletePlanCommandService {

    DeletePlanResponse deletePlan(Member user, Long planId);
}
