/**
 * plan/repository/PlanCandidateRepository
 * 약속 후보 식당 레포지토리
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.repository;

import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.PlanCandidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanCandidateRepository extends JpaRepository<PlanCandidate, Long>{
	/**
	 * 약속의 후보 식당을 rank 순으로 조회 (전체)
	 */
	List<PlanCandidate> findByPlanOrderByRankAsc(Plan plan);

	/**
	 * 약속의 후보 식당을 rank 순으로 페이징 조회
	 * 결정 모드에서 GET /plans/{planId}/candidates?page=0&size=8 사용
	 */
	Page<PlanCandidate> findByPlanOrderByRankAsc(Plan plan, Pageable pageable);

	/**
	 * planId로 직접 조회 (페이징)
	 */
	Page<PlanCandidate> findByPlanPlanIdOrderByRankAsc(Long planId, Pageable pageable);

	/**
	 * 약속의 모든 후보 식당 삭제
	 * 결정 도구 재선택 시 기존 데이터 삭제용
	 */
	void deleteByPlan(Plan plan);
}
