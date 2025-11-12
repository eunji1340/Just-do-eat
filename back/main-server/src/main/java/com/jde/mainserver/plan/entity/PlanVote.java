package com.jde.mainserver.plan.entity;

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
                @UniqueConstraint(name = "uk_plan_user_once", columnNames = {"plan_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_vote_plan", columnList = "plan_id")
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
    private Long restaurantId; // restaurant.restaurant_id (bigint) 와 매칭

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "voted_at", nullable = false)
    private Instant votedAt;

    @PrePersist
    public void onCreate() {
        if (votedAt == null) votedAt = Instant.now();
    }
}
