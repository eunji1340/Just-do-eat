/**
 * plan/web/dto/response/GroupScoreResponse.java
 * 그룹 추천 점수 응답 DTO
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.web.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Schema(description = "그룹 추천 점수 응답")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupScoreResponse {
	@Schema(
		description = "식당별 그룹 점수 맵 {restaurantId: score}",
		example = """
			{
			  "1001": 0.91,
			  "1002": 0.82,
			  "1003": 0.77
			}
			"""
	)
	private Map<Long, Float> scores;
}
