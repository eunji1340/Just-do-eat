/**
 * plan/web/controller/PlanController.java
 * 약속 컨트롤러
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.web.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.plan.service.command.PlanCommandService;
import com.jde.mainserver.plan.web.dto.request.PlanCreateRequest;
import com.jde.mainserver.plan.web.dto.response.PlanCreateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "약속", description = "약속 관련 API")
@RestController
@RequestMapping("/plans")
@RequiredArgsConstructor
public class PlanController {
	private final PlanCommandService planCommandService;

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
}
