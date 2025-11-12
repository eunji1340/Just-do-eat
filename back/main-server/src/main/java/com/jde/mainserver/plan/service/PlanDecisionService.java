package com.jde.mainserver.plan.service;

import com.jde.mainserver.plan.entity.PlanDecision;
import com.jde.mainserver.plan.entity.PlanVote;
import com.jde.mainserver.plan.entity.enums.DecisionStatus;
import com.jde.mainserver.plan.entity.enums.DecisionToolType;
import com.jde.mainserver.plan.repository.PlanDecisionRepository;
import com.jde.mainserver.plan.repository.PlanVoteRepository;
import com.jde.mainserver.plan.dto.request.ConfirmDecisionRequest;
import com.jde.mainserver.plan.dto.request.SubmitBallotRequest;
import com.jde.mainserver.plan.dto.response.TallyResponse;
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
            decision.setStartedAt(null);
            decision.setClosedAt(null);
        }
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
