/**
 * plan/service/command/PlanCommandService.java
 * 약속 생성/수정 등의 커맨드 서비스 인터페이스
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.service.command;

import com.jde.mainserver.plan.web.dto.request.PlanCreateRequest;
import com.jde.mainserver.plan.web.dto.response.PlanCreateResponse;

public interface PlanCommandService {
	/**
	 * 약속 생성
	 * @param roomId 모임 방 ID
	 * @param userId 사용자 ID
	 * @param request 약속 생성 요청 DTO
	 * @return 약속 생성 응답 DTO
	 */
	PlanCreateResponse createPlan(Long roomId, Long userId, PlanCreateRequest request);
}
