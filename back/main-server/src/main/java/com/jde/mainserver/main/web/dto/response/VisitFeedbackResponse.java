/**
 * main/web/dto/response/VisitFeedbackResponse.java
 * 방문 피드백 응답 DTO
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.web.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Schema(description = "방문 피드백 응답")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitFeedbackResponse {

	@Schema(description = "사용자 ID", example = "1")
	private Long userId;

	@Schema(description = "식당 ID", example = "1001")
	private Long restaurantId;

	@Schema(description = "방문 여부", example = "true")
	private Boolean isVisited;

	@Schema(description = "개인 선호 점수", example = "1.800")
	private BigDecimal prefScore;
}

