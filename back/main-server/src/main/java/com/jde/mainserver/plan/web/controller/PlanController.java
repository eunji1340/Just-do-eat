/**
 * plan/web/controller/PlanController.java
 * 약속 컨트롤러
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.web.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.plan.service.command.PlanCommandService;
import com.jde.mainserver.plan.service.query.PlanDetailQueryService;
import com.jde.mainserver.plan.service.query.PlanQueryService;
import com.jde.mainserver.plan.web.dto.request.PlanCreateRequest;
import com.jde.mainserver.plan.web.dto.response.PlanCreateResponse;
import com.jde.mainserver.plan.web.dto.response.PlanDetailResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "약속", description = "약속 관련 API")
@RestController
@RequestMapping("/plans")
@RequiredArgsConstructor
public class PlanController {

	private final PlanCommandService planCommandService;
	private final PlanQueryService planQueryService;
	private final PlanDetailQueryService planDetailQueryService;
	@Operation(
		summary = "약속 생성",
		description = "모임 방(room) 안에 새로운 약속을 생성합니다. JWT 기반 인증이 필요하며, 생성자는 해당 방의 멤버여야 합니다.",
		security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@PostMapping("/{roomId}")
	public PlanCreateResponse createPlan(
		@Parameter(description = "모임 방 ID", example = "1", required = true)
		@PathVariable Long roomId,
		@AuthUser Long userId,
		@Valid @RequestBody PlanCreateRequest request
	) {
		return planCommandService.createPlan(roomId, userId, request);
	}

	@Operation(
		summary = "약속 후보 식당 조회",
		description = "cursor 기반 무한 스크롤로 약속 후보 식당을 조회합니다. 항상 8개씩 반환합니다. status=OPEN이면 Redis에서 조회하고, status=VOTING/DECIDED면 DB에서 조회합니다.",
		security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@GetMapping("/{planId}/candidates")
	public Map<String, Object> getCandidates(
		@Parameter(description = "약속 ID", example = "1", required = true)
		@PathVariable Long planId,
		@Parameter(description = "다음 배치 커서 (null이나 \"0\"이면 첫 요청)", example = "0")
		@RequestParam(required = false) String cursor
	) {
		return planQueryService.getCandidateFeed(planId, cursor);
	}

	@GetMapping("/{planId}")
	@Operation(summary = "약속 상세 API", description = "약속 상세 정보를 조회합니다. 약속 후보는 제외되어 있습니다.", security = @SecurityRequirement(name = "Json Web Token(JWT)"))
	public ApiResponse<PlanDetailResponse> planDetail(@AuthUser Member user, @PathVariable Long planId) {
		PlanDetailResponse planDetailResponse = planDetailQueryService.planDetail(user, planId);
		return ApiResponse.onSuccess(planDetailResponse);
	}
}
