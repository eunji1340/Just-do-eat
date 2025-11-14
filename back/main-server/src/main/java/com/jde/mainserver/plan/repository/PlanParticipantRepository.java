/**
 * plan/repository/PlanParticipantRepository.java
 * 약속 참여자 레포지토리
 * Author: Jang
 * Date: 2025-11-13
 */

package com.jde.mainserver.plan.repository;

import com.jde.mainserver.plan.entity.PlanParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanParticipantRepository extends JpaRepository<PlanParticipant, Long> {
	/**
	 * 특정 약속에 참여한 모든 멤버 조회
	 */
	List<PlanParticipant> findByPlanPlanId(Long planId);

	/**
	 * 특정 약속에 특정 멤버가 참여 중인지 조회
	 */
	Optional<PlanParticipant> findByPlanPlanIdAndUserUserId(Long planId, Long memberId);
}
