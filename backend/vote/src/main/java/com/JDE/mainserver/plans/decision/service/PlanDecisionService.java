package com.JDE.mainserver.plans.decision.service;

import com.JDE.mainserver.plans.decision.entity.PlanDecision;
import com.JDE.mainserver.plans.decision.entity.PlanVote;
import com.JDE.mainserver.plans.decision.enums.DecisionStatus;
import com.JDE.mainserver.plans.decision.enums.DecisionToolType;
import com.JDE.mainserver.plans.decision.repository.PlanDecisionRepository;
import com.JDE.mainserver.plans.decision.repository.PlanVoteRepository;
import com.JDE.mainserver.web.dto.request.decision.ConfirmDecisionRequest;
import com.JDE.mainserver.web.dto.request.decision.SubmitBallotRequest;
import com.JDE.mainserver.web.dto.response.decision.TallyResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PlanDecisionService {

    private final PlanDecisionRepository decisionRepository;
    private final PlanVoteRepository voteRepository;

    @Transactional
    public PlanDecision selectTool(Long planId, DecisionToolType type, Long userId) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseGet(() -> PlanDecision.builder()
                        .planId(planId)
                        .createdBy(userId)
                        .build());
        decision.setToolType(type);
        decision.setStatus(DecisionStatus.PENDING);
        return decisionRepository.save(decision);
    }

    @Transactional
    public PlanDecision startVote(Long planId) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));
        decision.setStatus(DecisionStatus.VOTING);
        decision.setStartedAt(Instant.now());
        return decision;
    }

    @Transactional
    public void submitBallot(Long planId, Long userId, SubmitBallotRequest req) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));

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
        decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));

        var rows = voteRepository.tallyByPlanId(planId);
        long total = voteRepository.countByPlanId(planId);

        var items = rows.stream()
                .map(r -> new TallyResponse.Item(r.getRestaurantId(), r.getVotes()))
                .toList();

        return new TallyResponse(planId, items, total);
    }

    @Transactional
    public PlanDecision close(Long planId) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));
        decision.setStatus(DecisionStatus.CLOSED);
        decision.setClosedAt(Instant.now());
        return decision;
    }

    @Transactional
    public PlanDecision confirmFinal(Long planId, ConfirmDecisionRequest req) {
        PlanDecision decision = decisionRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("plan decision not found"));
        decision.setFinalRestaurantId(req.restaurantId());
        decision.setStatus(DecisionStatus.DECIDED);
        return decision;
    }
}
