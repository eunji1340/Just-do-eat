package com.JDE.mainserver.web.controller;

import com.JDE.mainserver.plans.decision.enums.DecisionToolType;
import com.JDE.mainserver.plans.decision.service.PlanDecisionService;
import com.JDE.mainserver.web.dto.request.decision.ConfirmDecisionRequest;
import com.JDE.mainserver.web.dto.request.decision.SubmitBallotRequest;
import com.JDE.mainserver.web.dto.response.decision.TallyResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/plans/{planId}")
public class PlansDecisionController {

    private final PlanDecisionService decisionService;

    private Long currentUserId(Authentication authentication) {
        // JwtFilter에서 authentication.getName() == userId 문자열이라고 가정
        return Long.valueOf(authentication.getName());
    }

    /** 결정 도구 선택: POST /plans/{planId}/tool?type={vote|ladder} */
    @PostMapping("/tool")
    public ResponseEntity<?> selectTool(
            @PathVariable Long planId,
            @RequestParam("type") DecisionToolType type,
            Authentication auth
    ) {
        var result = decisionService.selectTool(planId, type, currentUserId(auth));
        return ResponseEntity.ok(result);
    }

    /** 최종 식당 확정: PATCH /plans/{planId}/decision */
    @PatchMapping("/decision")
    public ResponseEntity<?> confirmDecision(
            @PathVariable Long planId,
            @Valid @RequestBody ConfirmDecisionRequest request
    ) {
        var result = decisionService.confirmFinal(planId, request);
        return ResponseEntity.ok(result);
    }

    /** 투표 시작: POST /plans/{planId}/decision/vote/start */
    @PostMapping("/decision/vote/start")
    public ResponseEntity<?> startVote(@PathVariable Long planId) {
        var result = decisionService.startVote(planId);
        return ResponseEntity.ok(result);
    }

    /** 투표 제출(1인1표): POST /plans/{planId}/decision/vote/ballots */
    @PostMapping("/decision/vote/ballots")
    public ResponseEntity<?> submitBallot(
            @PathVariable Long planId,
            @Valid @RequestBody SubmitBallotRequest request,
            Authentication auth
    ) {
        decisionService.submitBallot(planId, currentUserId(auth), request);
        return ResponseEntity.ok().build();
    }

    /** 투표 집계 조회: GET /plans/{planId}/decision/vote/tally */
    @GetMapping("/decision/vote/tally")
    public ResponseEntity<TallyResponse> tally(@PathVariable Long planId) {
        var data = decisionService.tally(planId);
        return ResponseEntity.ok(data);
    }
}
