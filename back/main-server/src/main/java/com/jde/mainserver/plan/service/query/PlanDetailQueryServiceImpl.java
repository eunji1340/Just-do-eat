package com.jde.mainserver.plan.service.query;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.plan.converter.PlanConverter;
import com.jde.mainserver.plan.converter.PlanParticipantConverter;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.PlanParticipant;
import com.jde.mainserver.plan.entity.enums.PlanRole;
import com.jde.mainserver.plan.exception.PlanErrorCode;
import com.jde.mainserver.plan.exception.PlanParticipantErrorCode;
import com.jde.mainserver.plan.repository.PlanParticipantRepository;
import com.jde.mainserver.plan.repository.PlanRepository;
import com.jde.mainserver.plan.web.dto.response.PlanDetailResponse;
import com.jde.mainserver.plan.web.dto.response.PlanParticipantInfo;
import com.jde.mainserver.room.entity.Room;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PlanDetailQueryServiceImpl implements PlanDetailQueryService{

    private final PlanConverter planConverter;
    private final PlanRepository planRepository;
    private final PlanParticipantConverter planParticipantConverter;
    private final PlanParticipantRepository planParticipantRepository;
    public PlanDetailResponse planDetail(Member user, Long planId) {

        // user가 plan 참여자인지를 확인한다.
        boolean isParticipant = planParticipantRepository.existsByPlan_PlanIdAndUser_UserId(planId, user.getUserId());

        if (!isParticipant) {
            throw new CustomException(PlanParticipantErrorCode.NOT_FOUND_USER);
        }

        // plan 정보를 가져온다.
        Plan plan = planRepository.findByPlanId(planId)
                .orElseThrow(() -> new CustomException(PlanErrorCode.NOT_FOUND_PLAN));

        // room 정보를 가져온다.
        Room room = plan.getRoom();

        // planManager의 name 정보를 가져온다.
        PlanParticipant planParticipant = planParticipantRepository.findByPlan_PlanIdAndPlanRole(planId, PlanRole.MANAGER)
                .orElse(null);

        if (planParticipant == null) {
            throw new CustomException(PlanParticipantErrorCode.NOT_FOUND_USER);
        }

        String planManager = planParticipant.getUser().getName();

        // planParticipantList를 가져온다.
        List<PlanParticipant> planParticipants = plan.getPlanParticipantList();

        List<PlanParticipantInfo> planParticipantList = planParticipants.stream()
                .map(planParticipantConverter::toPlanParticipantInfo)
                .toList();

        return planConverter.toPlanDetailResponse(room, plan, planManager, planParticipantList);
    }
}
