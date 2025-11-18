package com.jde.mainserver.plan.repository;

import com.jde.mainserver.plan.entity.PlanVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PlanVoteRepository extends JpaRepository<PlanVote, Long> {

    boolean existsByPlanIdAndUserId(Long planId, Long userId);

    @Query("""
        select v.restaurantId as restaurantId, count(v) as votes
        from PlanVote v
        where v.planId = :planId
        group by v.restaurantId
        order by votes desc
    """)
    List<RestaurantVoteProjection> tallyByPlanId(Long planId);

    interface RestaurantVoteProjection {
        Long getRestaurantId();
        Long getVotes();
    }

    long countByPlanId(Long planId);

    List<PlanVote> findAllByPlanId(Long planId);
}
