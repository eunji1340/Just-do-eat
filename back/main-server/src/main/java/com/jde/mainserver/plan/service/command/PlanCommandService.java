/**
 * plan/service/command/PlanCommandService.java
 * 약속 생성/수정 등의 커맨드 서비스
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.service.command;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.enums.PlanStatus;
import com.jde.mainserver.plan.repository.PlanRepository;
import com.jde.mainserver.plan.web.dto.request.PlanCreateRequest;
import com.jde.mainserver.plan.web.dto.response.PlanCreateResponse;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.repository.RoomRepository;

import lombok.RequiredArgsConstructor;

import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanCommandService {
	private final PlanRepository planRepository;
	private final RoomRepository roomRepository;
	private final MemberRepository memberRepository;

	private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

	public PlanCreateResponse createPlan(Long roomId, Long memberId, PlanCreateRequest request) {
		Room room = roomRepository.findById(roomId)
			.orElseThrow(() -> new IllegalArgumentException("Room Not Found"));
		Member member = memberRepository.findById(memberId)
			.orElseThrow(() -> new IllegalArgumentException("Member Not Found"));

		Point centerPoint = geometryFactory.createPoint(
			new org.locationtech.jts.geom.Coordinate(request.getCenterLon(), request.getCenterLat())
		);

		Plan plan = Plan.builder()
			.planName(request.getPlanName())
			.planGeom(centerPoint)
			.radiusM(request.getRadiusM())
			.startsAt(request.getStartsAt())
			.dislikeCategories(
				request.getDislikeCategories() != null ? request.getDislikeCategories() : Collections.emptyList()
			)
			.priceRanges(
				request.getPriceRanges() != null ? request.getPriceRanges() : Collections.emptyList()
			)
			.status(PlanStatus.OPEN)
			.decisionTool(null)
			.room(room)
			.build();

		planRepository.save(plan);

		return PlanCreateResponse.builder()
			.planId(plan.getPlanId())
			.roomId(room.getRoomId())
			.planName(plan.getPlanName())
			.radiusM(plan.getRadiusM())
			.startsAt(plan.getStartsAt())
			.dislikeCategories(plan.getDislikeCategories())
			.priceRanges(plan.getPriceRanges())
			.decisionTool(plan.getDecisionTool())
			.status(plan.getStatus())
			.build();
	}
}
