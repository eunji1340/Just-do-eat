package com.jde.mainserver.plan.service.query;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.plan.web.dto.response.PlanDetailResponse;

public interface PlanDetailQueryService {

    PlanDetailResponse planDetail(Member user, Long planId);
}
