package com.jde.mainserver.plan.controller;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.plan.dto.request.ConfirmDecisionRequest;
import com.jde.mainserver.plan.dto.request.SubmitBallotRequest;
import com.jde.mainserver.plan.dto.response.DecisionResponse;
import com.jde.mainserver.plan.dto.response.TallyResponse;
import com.jde.mainserver.plan.entity.enums.DecisionToolType;
import com.jde.mainserver.plan.service.PlanDecisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/plans/{planId}")
public class PlanDecisionController {

    private final PlanDecisionService decisionService;

    /** JwtFilter가 subject에 넣은 문자열 ID를 Long으로 반환 */
    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Unauthenticated");
        }
        try {
            return Long.parseLong(auth.getName());
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Invalid JWT subject (not a number)");
        }
    }

    // 1) 결정 도구 선택 POST /plans/{planId}/tool?type={VOTE|LADDER|ROULETTE}
    @PostMapping("/tool")
    public ApiResponse<DecisionResponse> selectTool(
            @PathVariable Long planId,
            @RequestParam("type") DecisionToolType type
    ) {
        Long userId = currentUserId();
        var d = decisionService.selectTool(planId, type, userId);
        return ApiResponse.onSuccess(DecisionResponse.from(d));
    }

    // 2) 최종 식당 확정 PATCH /plans/{planId}/decision
    @PatchMapping("/decision")
    public ApiResponse<DecisionResponse> confirmFinal(
            @PathVariable Long planId,
            @RequestBody ConfirmDecisionRequest req
    ) {
        var d = decisionService.confirmFinal(planId, req);
        return ApiResponse.onSuccess(DecisionResponse.from(d));
    }


    // 3) 투표 시작 POST /plans/{planId}/decision/vote/start
    @PostMapping("/decision/vote/start")
    public ApiResponse<DecisionResponse> startVote(@PathVariable Long planId) {
        var d = decisionService.startVote(planId);
        return ApiResponse.onSuccess(DecisionResponse.from(d));
    }

    // 4) 투표 제출(1인1표) POST /plans/{planId}/decision/vote/ballots
    @PostMapping("/decision/vote/ballots")
    public ApiResponse<Void> submitBallot(
            @PathVariable Long planId,
            @RequestBody SubmitBallotRequest req
    ) {
        Long userId = currentUserId();
        decisionService.submitBallot(planId, userId, req);
        return ApiResponse.onSuccess();
    }

    // 5) 투표 집계 조회 GET /plans/{planId}/decision/vote/tally
    @GetMapping("/decision/vote/tally")
    public ApiResponse<TallyResponse> tally(@PathVariable Long planId) {
        return ApiResponse.onSuccess(decisionService.tally(planId));
    }
}
