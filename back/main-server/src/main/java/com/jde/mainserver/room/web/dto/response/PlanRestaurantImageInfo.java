package com.jde.mainserver.room.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class PlanRestaurantImageInfo {

    private Long planId;
    private LocalDateTime startAt;
    private String restaurantImageUrl;
}
