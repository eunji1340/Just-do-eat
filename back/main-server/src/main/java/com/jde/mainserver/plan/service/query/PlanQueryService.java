/**
 * plan/service/query/PlanQueryService.java
 * 약속 Query 서비스 인터페이스
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.service.query;

import com.jde.mainserver.plan.web.dto.response.PlanCandidateResponse;
import com.jde.mainserver.plan.web.dto.response.PlanCreateResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface PlanQueryService {
	/**
	 * 약속 정보 조회
	 *
	 * @param planId 약속 ID
	 * @return 약속 정보 응답 DTO
	 */
	PlanCreateResponse getPlan(Long planId);

	/**
	 * 약속 후보 식당 조회 (페이징)
	 *
	 * status = OPEN이면 재계산하여 반환 (구경 모드)
	 * status = VOTING/DECIDED면 plan_candidate에서 읽기 (결정 모드)
	 *
	 * @param planId 약속 ID
	 * @param pageable 페이징 정보
	 * @return 후보 식당 페이지
	 */
	Page<PlanCandidateResponse> getCandidates(Long planId, Pageable pageable);

	/**
	 * 약속 후보 식당 피드 조회 (cursor 기반 무한 스크롤)
	 *
	 * status = OPEN이면 Redis에서 조회 (구경 모드)
	 * status = VOTING/DECIDED면 plan_candidate에서 읽기 (결정 모드)
	 *
	 * @param planId 약속 ID
	 * @param cursor 다음 배치 커서 (null이나 "0"이면 첫 요청)
	 * @return 후보 식당 리스트와 다음 커서를 담은 Map (items: List<PlanCandidateResponse>, next_cursor: String)
	 */
	Map<String, Object> getCandidateFeed(Long planId, String cursor);
}
