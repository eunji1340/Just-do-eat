package com.JDE.mainserver.plans.decision.entity;

import com.JDE.mainserver.plans.decision.enums.DecisionStatus;
import com.JDE.mainserver.plans.decision.enums.DecisionToolType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "plan_decision")
public class PlanDecision {

    @Id
    @Column(name = "plan_id")
    private Long planId; // 약속ID(1:1 관리, PK)

    @Enumerated(EnumType.STRING)
    @Column(name = "tool_type", nullable = false)
    private DecisionToolType toolType = DecisionToolType.VOTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DecisionStatus status = DecisionStatus.PENDING;

    @Column(name = "final_restaurant_id")
    private Long finalRestaurantId;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "created_by")
    private Long createdBy;
}
