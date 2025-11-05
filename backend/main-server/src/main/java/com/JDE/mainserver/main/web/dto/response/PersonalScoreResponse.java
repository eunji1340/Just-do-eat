/**
 * main/web/dto/response/PersonalScoreResponse.java
 * FastAPI 점수 엔진의 "개인 추천 점수" 응답 DTO
 * Author: Jang
 * Date: 2025-10-31
 */

package com.JDE.mainserver.main.web.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record PersonalScoreResponse(
	List<ScoredItem> items,
	Map<String, Object> debug
) {
	public record ScoredItem(
		@JsonProperty("restaurant_id")
		Long restaurantId,
		double score,
		Map<String, Object> reasons
	) {}
}