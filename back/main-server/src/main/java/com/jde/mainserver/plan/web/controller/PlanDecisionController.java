package com.jde.mainserver.plan.web.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.plan.web.dto.request.ConfirmDecisionRequest;
import com.jde.mainserver.plan.web.dto.request.SubmitBallotRequest;
import com.jde.mainserver.plan.web.dto.response.DecisionResponse;
import com.jde.mainserver.plan.web.dto.response.TallyResponse;
import com.jde.mainserver.plan.entity.enums.DecisionToolType;
import com.jde.mainserver.plan.service.PlanDecisionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "약속 결정", description = "약속 결정 관련 API")
@RequiredArgsConstructor
@RestController
@RequestMapping("/plans/{planId}")
public class PlanDecisionController {

    private final PlanDecisionService decisionService;

    // 1) 결정 도구 선택 POST /plans/{planId}/tool?type={VOTE|LADDER|ROULETTE}
    @Operation(
        summary = "결정 도구 선택",
        description = "약속의 결정 도구를 선택합니다. Plan.status를 VOTING으로 변경하고, 현재 화면에 보여지고 있는 후보 식당들을 저장합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @PostMapping("/tool")
    public ApiResponse<DecisionResponse> selectTool(
            @Parameter(description = "약속 ID", example = "1", required = true)
            @PathVariable Long planId,
            @Parameter(description = "결정 도구 타입", example = "VOTE", required = true)
            @RequestParam("type") DecisionToolType type,
            @Parameter(description = "현재 화면에 보여지고 있는 후보 식당 ID 리스트", required = true)
            @RequestBody List<Long> candidateRestaurantIds,
            @AuthUser Long userId
    ) {
        var d = decisionService.selectTool(planId, type, candidateRestaurantIds, userId);
        return ApiResponse.onSuccess(DecisionResponse.from(d));
    }

    // 2) 최종 식당 확정 PATCH /plans/{planId}/decision
    @Operation(
        summary = "최종 식당 확정",
        description = "약속의 최종 식당을 확정합니다. Plan.status를 DECIDED로 변경하고, 확정 식당을 저장합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @PatchMapping("/decision")
    public ApiResponse<DecisionResponse> confirmFinal(
            @Parameter(description = "약속 ID", example = "1", required = true)
            @PathVariable Long planId,
            @RequestBody ConfirmDecisionRequest req,
            @AuthUser Long userId
    ) {
        var d = decisionService.confirmFinal(planId, req);
        return ApiResponse.onSuccess(DecisionResponse.from(d));
    }


    // 3) 투표 시작 POST /plans/{planId}/decision/vote/start
    @Operation(
        summary = "투표 시작",
        description = "투표를 시작합니다. PlanDecision.status를 VOTING으로 변경합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @PostMapping("/decision/vote/start")
    public ApiResponse<DecisionResponse> startVote(
            @Parameter(description = "약속 ID", example = "1", required = true)
            @PathVariable Long planId,
            @AuthUser Long userId
    ) {
        var d = decisionService.startVote(planId);
        return ApiResponse.onSuccess(DecisionResponse.from(d));
    }

    // 4) 투표 제출(1인1표) POST /plans/{planId}/decision/vote/ballots
    @Operation(
        summary = "투표 제출",
        description = "투표를 제출합니다. 1인 1표로 제한됩니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @PostMapping("/decision/vote/ballots")
    public ApiResponse<Void> submitBallot(
            @Parameter(description = "약속 ID", example = "1", required = true)
            @PathVariable Long planId,
            @RequestBody SubmitBallotRequest req,
            @AuthUser Long userId
    ) {
        decisionService.submitBallot(planId, userId, req);
        return ApiResponse.onSuccess();
    }

    // 5) 투표 집계 조회 GET /plans/{planId}/decision/vote/tally
    @Operation(
        summary = "투표 집계 조회",
        description = "투표 결과를 집계하여 조회합니다.",
        security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @GetMapping("/decision/vote/tally")
    public ApiResponse<TallyResponse> tally(
            @Parameter(description = "약속 ID", example = "1", required = true)
            @PathVariable Long planId,
            @AuthUser Long userId
    ) {
        return ApiResponse.onSuccess(decisionService.tally(planId));
    }
}
