/**
 * plan/repository/PlanRepository.java
 * 약속 레포지토리
 * Author: Jang
 * Date: 2025-11-13
 */

package com.jde.mainserver.plan.repository;

import com.jde.mainserver.plan.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {
	/**
	 * 특정 방(room)에 속한 약속 리스트 조회 (최근 생선 순)
	 */
	List<Plan> findByRoomRoomIdOrderByCreatedAtDesc(Long roomId);

	Optional<Plan> findByPlanId(Long planId);
}
