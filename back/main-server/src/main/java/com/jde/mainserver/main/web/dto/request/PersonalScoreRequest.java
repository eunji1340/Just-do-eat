package com.jde.mainserver.main.web.dto.request;

/**
 * main/web/dto/request/PersonalScoreRequest.java
 * FastAPI 점수 엔진 요청 DTO
 * Author: Jang
 * Date: 2025-11-04
 */

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

/**
 * FastAPI 점수 엔진 개인화 점수 계산 요청
 */
public record PersonalScoreRequest(
        @JsonProperty("user_id")
        Long userId,

        @JsonProperty("user_tag_pref")
        Map<Long, TagPreference> userTagPref,

        @JsonProperty("candidates")
        List<Candidate> candidates
){
    public static PersonalScoreRequest of(Long userId, Map<Long, TagPreference> userPref, List<Candidate> cands) {
        return new PersonalScoreRequest(userId, userPref, cands);
    }

    /** 후보 식당 정보 */
    public record Candidate(
            @JsonProperty("restaurant_id")
            Long restaurantId,

            @JsonProperty("tag_pref")
            Map<Long, TagPreference> tagPref,

            @JsonProperty("distance_m")
            Float distanceM,

            @JsonProperty("is_open")
            Boolean isOpen,

            @JsonProperty("price_range")
            Integer priceRange  // 0~3
    ) {}

    /** 태그 선호도/가중치 (score/weight: -3.00~+3.00, confidence: 0.0~1.0) */
    public record TagPreference(
            @JsonProperty("score")
            Float score,

            @JsonProperty("confidence")
            Float confidence
    ) {}
}
