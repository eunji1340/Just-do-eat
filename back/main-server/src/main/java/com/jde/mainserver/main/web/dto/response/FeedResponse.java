package com.jde.mainserver.main.web.dto.response;

/**
 * main/web/dto/response/FeedResponse.java
 * 피드 무한 스크롤용 응답 DTO
 * Author: Jang
 * Date: 2025-10-31
 */

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record FeedResponse(
        /**
         * 현재 배치의 식당 리스트
         */
        @JsonProperty("items")
        List<RestaurantItem> items,

        /**
         * 다음 배치 요청을 위한 커서
         * null이면 더 이상 데이터 없음
         */
        @JsonProperty("next_cursor")
        String nextCursor
) {
    /**
     * 식당 정보
     */
    public record RestaurantItem(
            @JsonProperty("restaurant_id")
            Long restaurantId,

            @JsonProperty("name")
            String name,

            @JsonProperty("address")
            String address,

            @JsonProperty("phone")
            String phone,

            @JsonProperty("summary")
            String summary,

            @JsonProperty("image")
            Object image,

            @JsonProperty("category")
            String category,

            @JsonProperty("rating")
            Float rating,

            @JsonProperty("price_range")
            String priceRange,

            @JsonProperty("website_url")
            String websiteUrl,

            @JsonProperty("menu")
            Object menu,

            @JsonProperty("distance_m")
            Integer distanceM,

            @JsonProperty("is_open")
            Boolean isOpen
    ) {}
}
