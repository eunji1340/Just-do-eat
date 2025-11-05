package com.JDE.mainserver.plans.decision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "plan_vote",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_plan_user", columnNames = {"plan_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_plan", columnList = "plan_id"),
                @Index(name = "idx_plan_restaurant", columnList = "plan_id, restaurant_id")
        }
)
public class PlanVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vote_id")
    private Long voteId;

    @Column(name = "plan_id", nullable = false)
    private Long planId;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "voted_at", nullable = false)
    private Instant votedAt;
}
