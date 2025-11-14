package com.jde.mainserver.plan.service;

import com.jde.mainserver.plan.web.dto.request.ConfirmDecisionRequest;
import com.jde.mainserver.plan.web.dto.request.SubmitBallotRequest;
import com.jde.mainserver.plan.web.dto.response.TallyResponse;
import com.jde.mainserver.plan.entity.PlanDecision;
import com.jde.mainserver.plan.entity.PlanVote;
import com.jde.mainserver.plan.entity.enums.DecisionStatus;
import com.jde.mainserver.plan.entity.enums.DecisionToolType;
import com.jde.mainserver.plan.repository.PlanDecisionRepository;
import com.jde.mainserver.plan.repository.PlanVoteRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PlanDecisionService {

    private final PlanDecisionRepository decisionRepository;
    private final PlanVoteRepository voteRepository;

    /**
     * 결정 도구 선택
     * - VOTE: 아직 투표를 시작하지 않았으므로 startedAt 은 null
     * - ROULETTE: 도구 선택 시점 = 룰렛 시작 시점으로 보고 startedAt 을 즉시 기록
     */
    @Transactional
    public PlanDecision selectTool(Long planId, DecisionToolType type, Long userId) {
        PlanDecision decision = decisionRepository.findById(planId).orElse(null);

        if (decision == null) {
            decision = PlanDecision.builder()
                    .planId(planId)
                    .toolType(type)
                    .status(DecisionStatus.PENDING)
                    .createdBy(userId)
                    .build();
        } else {
            decision.setToolType(type);
            decision.setStatus(DecisionStatus.PENDING);
            decision.setFinalRestaurantId(null);
            decision.setClosedAt(null);
        }

        // startedAt 처리: ROULETTE 는 도구 선택 시점을 시작으로 기록
        if (type == DecisionToolType.ROULETTE) {
            if (decision.getStartedAt() == null) {
                decision.setStartedAt(Instant.now());
            }
        } else {
            // VOTE / LADDER 등은 별도의 "start" 액션에서 시작 시점을 기록하도록 초기화
            decision.setStartedAt(null);
        }

        return decisionRepository.save(decision);
    }

    @Transactional
    public PlanDecision startVote(Long planId) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));

        if (decision.getToolType() != DecisionToolType.VOTE) {
            throw new IllegalStateException("tool type is not VOTE");
        }

        decision.setStatus(DecisionStatus.VOTING);
        decision.setStartedAt(Instant.now());
        return decision;
    }

    @Transactional
    public void submitBallot(Long planId, Long userId, SubmitBallotRequest req) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));

        if (decision.getToolType() != DecisionToolType.VOTE) {
            throw new IllegalStateException("tool type is not VOTE");
        }
        if (decision.getStatus() != DecisionStatus.VOTING) {
            throw new IllegalStateException("voting is not in progress");
        }
        if (voteRepository.existsByPlanIdAndUserId(planId, userId)) {
            throw new IllegalStateException("already voted");
        }

        PlanVote vote = PlanVote.builder()
                .planId(planId)
                .restaurantId(req.restaurantId())
                .userId(userId)
                .votedAt(Instant.now())
                .build();

        voteRepository.save(vote);
    }

    @Transactional
    public TallyResponse tally(Long planId) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));

        if (decision.getToolType() != DecisionToolType.VOTE) {
            throw new IllegalStateException("tool type is not VOTE");
        }

        var rows = voteRepository.tallyByPlanId(planId);
        long total = voteRepository.countByPlanId(planId);

        List<TallyResponse.Item> items = new ArrayList<>();
        for (var r : rows) {
            items.add(new TallyResponse.Item(r.getRestaurantId(), r.getVotes()));
        }

        return new TallyResponse(planId, items, total);
    }

    @Transactional
    public PlanDecision closeVote(Long planId) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));

        if (decision.getToolType() != DecisionToolType.VOTE) {
            throw new IllegalStateException("tool type is not VOTE");
        }

        decision.setStatus(DecisionStatus.CLOSED);
        decision.setClosedAt(Instant.now());
        return decision;
    }

    /**
     * 최종 식당 확정 (투표/룰렛/기타 도구 공통)
     * - startedAt 이 비어 있으면 안전망으로 현재 시각을 시작 시점으로 기록
     *   (이전 데이터나 수동 확정 케이스)
     * - closedAt 은 한 번만(비어 있을 때만) 기록해서, 다른 곳에서 미리 닫아둔 시간은 보존
     */
    @Transactional
    public PlanDecision confirmFinal(Long planId, ConfirmDecisionRequest req) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));

        Instant now = Instant.now();

        if (decision.getStartedAt() == null) {
            decision.setStartedAt(now);
        }
        if (decision.getClosedAt() == null) {
            decision.setClosedAt(now);
        }

        decision.setFinalRestaurantId(req.restaurantId());
        decision.setStatus(DecisionStatus.DECIDED);

        return decision;
    }
}
