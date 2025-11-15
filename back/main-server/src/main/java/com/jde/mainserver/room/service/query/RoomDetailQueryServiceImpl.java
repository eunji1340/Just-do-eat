package com.jde.mainserver.room.service.query;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.PlanParticipant;
import com.jde.mainserver.plan.entity.enums.PlanRole;
import com.jde.mainserver.plan.repository.PlanParticipantRepository;
import com.jde.mainserver.plan.repository.PlanRepository;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.room.converter.RoomConverter;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import com.jde.mainserver.room.exception.RoomErrorCode;
import com.jde.mainserver.room.exception.RoomMemberErrorCode;
import com.jde.mainserver.room.repository.RoomMemberRepository;
import com.jde.mainserver.room.repository.RoomRepository;
import com.jde.mainserver.room.web.dto.response.MemberInfo;
import com.jde.mainserver.room.web.dto.response.PlanInfo;
import com.jde.mainserver.room.web.dto.response.RoomDetailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RoomDetailQueryServiceImpl implements RoomDetailQueryService {

    private final MemberRepository memberRepository;
    private final PlanParticipantRepository planParticipantRepository;
    private final PlanRepository planRepository;
    private final RoomConverter roomConverter;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RestaurantRepository restaurantRepository;

    @Override
    public RoomDetailResponse roomDetail(Member user, Long roomId) {

        boolean activeUserRoom = roomMemberRepository.activeUserRoom(user.getUserId(), roomId);

        if(!activeUserRoom) {
            throw new CustomException(RoomMemberErrorCode.NOT_FOUND_USER);
        }

        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new CustomException(RoomErrorCode.NOT_FOUND_ROOM));

        List<RoomMember> roomMembers = roomMemberRepository.activeUserInfo(roomId);
        List<MemberInfo> roomMemberList = roomMembers.stream()
                .map(roomConverter::toMemberInfo)
                .toList();

        List<Plan> plans =  planRepository.findByRoomRoomIdOrderByCreatedAtDesc(roomId);
        List<PlanInfo> planList = plans.stream()
                .map(plan -> {
                    Long planId = plan.getPlanId();
                    String managerName = null;
                    // 1) managerUserId 조회
                    PlanParticipant planParticipant = planParticipantRepository
                            .findByPlan_PlanIdAndPlanRole(planId, PlanRole.MANAGER)
                            .orElse(null);

                    if (planParticipant != null) {
                        managerName = planParticipant.getUser().getName();
                    }

                    // 3) count 조회
                    Long count = planParticipantRepository.countByPlan_PlanId(planId);

                    // 4) converter로 조립
                    return roomConverter.toPlanInfo(plan, managerName, count);
                })
                .toList();

        return roomConverter.toRoomDetailResponse(room, roomMemberList, planList);
    }
}
