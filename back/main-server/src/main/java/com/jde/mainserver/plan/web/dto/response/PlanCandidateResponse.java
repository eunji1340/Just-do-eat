/**
 * plan/web/dto/response/PlanCandidateResponse.java
 * 약속 후보 식당 응답 DTO
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.web.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Schema(description = "약속 후보 식당 정보")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanCandidateResponse {

	@Schema(description = "식당 요약 정보")
	private RestaurantSummaryResponse restaurant;

	@Schema(description = "메뉴 정보", example = "[{\"name\": \"연어랑 육회랑\", \"price\": 37000, \"is_recommend\": false, \"is_ai_mate\": false}]")
	@JsonProperty("menu")
	private Object menu;

	@Schema(description = "거리(미터)", example = "250")
	private Integer distanceM;

}
