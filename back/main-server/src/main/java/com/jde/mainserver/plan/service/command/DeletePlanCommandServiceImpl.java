package com.jde.mainserver.plan.service.command;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.global.exception.code.MemberErrorCode;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.plan.converter.PlanConverter;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.PlanParticipant;
import com.jde.mainserver.plan.entity.enums.PlanRole;
import com.jde.mainserver.plan.exception.PlanErrorCode;
import com.jde.mainserver.plan.exception.PlanParticipantErrorCode;
import com.jde.mainserver.plan.repository.PlanParticipantRepository;
import com.jde.mainserver.plan.repository.PlanRepository;
import com.jde.mainserver.plan.web.dto.response.DeletePlanResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class DeletePlanCommandServiceImpl implements DeletePlanCommandService{

    private final PlanConverter planConverter;
    private final PlanRepository planRepository;
    private final PlanParticipantRepository planParticipantRepository;

    public DeletePlanResponse deletePlan(Member user, Long planId) {

        Plan plan = planRepository.findByPlanId(planId)
                .orElseThrow(() -> new CustomException(PlanErrorCode.NOT_FOUND_PLAN));

        PlanParticipant manager = planParticipantRepository.findByPlanAndPlanRole(plan, PlanRole.MANAGER)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        if(!user.getUserId().equals(manager.getUser().getUserId()))  {
            throw new CustomException(PlanParticipantErrorCode.NOT_MANAGER);
        }

        Long roomId = plan.getRoom().getRoomId();
        planRepository.delete(plan);

        return planConverter.toDeletePlanResponse(roomId);
    }
}
