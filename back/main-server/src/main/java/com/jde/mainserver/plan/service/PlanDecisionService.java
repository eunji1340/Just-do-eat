package com.jde.mainserver.plan.service;

import com.jde.mainserver.plan.web.dto.request.ConfirmDecisionRequest;
import com.jde.mainserver.plan.web.dto.request.SubmitBallotRequest;
import com.jde.mainserver.plan.web.dto.response.TallyResponse;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.PlanCandidate;
import com.jde.mainserver.plan.entity.PlanDecision;
import com.jde.mainserver.plan.entity.PlanVote;
import com.jde.mainserver.plan.entity.enums.DecisionStatus;
import com.jde.mainserver.plan.entity.enums.DecisionToolType;
import com.jde.mainserver.plan.entity.enums.PlanStatus;
import com.jde.mainserver.plan.repository.PlanCandidateRepository;
import com.jde.mainserver.plan.repository.PlanDecisionRepository;
import com.jde.mainserver.plan.repository.PlanRepository;
import com.jde.mainserver.plan.repository.PlanVoteRepository;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
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
    private final PlanRepository planRepository;
    private final PlanCandidateRepository planCandidateRepository;
    private final RestaurantRepository restaurantRepository;

    /**
     * 결정 도구 선택
     * - Plan.status를 VOTING으로 변경
     * - 현재 화면에 보여지고 있는 후보 식당들을 PlanCandidate에 저장
     * - VOTE: 아직 투표를 시작하지 않았으므로 startedAt 은 null
     * - ROULETTE: 도구 선택 시점 = 룰렛 시작 시점으로 보고 startedAt 을 즉시 기록
     */
    @Transactional
    public PlanDecision selectTool(Long planId, DecisionToolType type, List<Long> candidateRestaurantIds, Long userId) {
        // Validation
        if (candidateRestaurantIds == null || candidateRestaurantIds.isEmpty()) {
            throw new IllegalArgumentException("후보 식당 ID 리스트는 필수입니다");
        }

        // 1. Plan 조회 및 status를 VOTING으로 변경
        Plan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan Not Found"));
        
        plan.setStatus(PlanStatus.VOTING);
        planRepository.save(plan);

        // 2. 기존 PlanCandidate 삭제 (재선택 시)
        planCandidateRepository.deleteByPlan(plan);

        // 3. 현재 화면에 보여지고 있는 후보 식당들을 PlanCandidate에 저장
        for (Long restaurantId : candidateRestaurantIds) {
            Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant Not Found: " + restaurantId));
            
            PlanCandidate candidate = PlanCandidate.builder()
                .plan(plan)
                .restaurant(restaurant)
                .build();
            
            planCandidateRepository.save(candidate);
        }

        // 4. PlanDecision 생성/업데이트
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

        // 기존 투표가 있으면 삭제 (재투표 가능)
        voteRepository.findByPlanIdAndUserId(planId, userId)
                .ifPresent(voteRepository::delete);

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

        // 모든 투표를 가져와서 식당별 userId 리스트 생성
        List<PlanVote> allVotes = voteRepository.findAllByPlanId(planId);
        java.util.Map<Long, java.util.List<Long>> restaurantUserIdsMap = allVotes.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        PlanVote::getRestaurantId,
                        java.util.stream.Collectors.mapping(
                                PlanVote::getUserId,
                                java.util.stream.Collectors.toList()
                        )
                ));

        List<TallyResponse.Item> items = new ArrayList<>();
        for (var r : rows) {
            Long restaurantId = r.getRestaurantId();
            List<Long> userIds = restaurantUserIdsMap.getOrDefault(restaurantId, new ArrayList<>());
            items.add(new TallyResponse.Item(restaurantId, r.getVotes(), userIds));
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
     * - Plan.status를 DECIDED로 변경
     * - Plan.restaurant에 확정 식당 저장
     * - PlanDecision.finalRestaurantId에 확정 식당 ID 저장
     * - PlanDecision.status를 DECIDED로 변경
     * - startedAt 이 비어 있으면 안전망으로 현재 시각을 시작 시점으로 기록
     *   (이전 데이터나 수동 확정 케이스)
     * - closedAt 은 한 번만(비어 있을 때만) 기록해서, 다른 곳에서 미리 닫아둔 시간은 보존
     */
    @Transactional
    public PlanDecision confirmFinal(Long planId, ConfirmDecisionRequest req) {
        // 1. Plan 조회 및 업데이트
        Plan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan Not Found"));
        
        Restaurant restaurant = restaurantRepository.findById(req.restaurantId())
            .orElseThrow(() -> new IllegalArgumentException("Restaurant Not Found: " + req.restaurantId()));
        
        plan.setStatus(PlanStatus.DECIDED);
        plan.setRestaurant(restaurant);
        planRepository.save(plan);

        // 2. PlanDecision 업데이트
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

        return decisionRepository.save(decision);
    }
}
