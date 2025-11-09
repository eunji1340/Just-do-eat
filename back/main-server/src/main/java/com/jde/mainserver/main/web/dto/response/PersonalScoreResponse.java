/**
 * main/web/dto/response/PersonalScoreResponse.java
 * FastAPI 점수 엔진 개인화 점수 계산 응답 DTO
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.web.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public record PersonalScoreResponse(
	/** 점수 계산된 식당 리스트 (점수 높은 순으로 정렬됨) */
	List<ScoredItem> items,

	/** 디버그 정보 (algo_version, elapsed_ms 등) */
	Map<String, Object> debug
) {
	public record ScoredItem(
		@JsonProperty("restaurant_id")
		Long restaurantId,

		/** 개인화 점수 (태그 유사도, 거리, 선호도 등 종합) */
		double score,

		/** 점수 구성 요소 (debug 모드일 때만 포함) */
		Map<String, Object> reasons
	) {
	}
}