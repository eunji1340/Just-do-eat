package com.jde.mainserver.plan.entity;

import com.jde.mainserver.plan.entity.enums.PlanStatus;
import com.jde.mainserver.plan.entity.enums.PlanDecisionTool;
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
    private Long planId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tool_type", nullable = false)
    private PlanDecisionTool toolType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PlanStatus status;

    @Column(name = "final_restaurant_id")
    private Long finalRestaurantId;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @PrePersist
    public void onCreate() {
        if (status == null) status = PlanStatus.OPEN;
    }
}
