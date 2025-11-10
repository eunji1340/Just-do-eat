/**
 * main/web/dto/request/VisitFeedbackRequest.java
 * 방문 피드백 요청 DTO
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.web.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(
	description = "방문 피드백 요청",
	example = """
		{
		  "isVisited": true,
		  "satisfaction": "LIKE"
		}
		"""
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VisitFeedbackRequest {

	@Schema(description = "방문 여부 (true = 방문함, false = 방문 안 함)", example = "true", required = true)
	@NotNull
	private Boolean isVisited;

	@Schema(description = "만족도 (LIKE = 좋았어요, NEUTRAL = 그냥 그랬어요, DISLIKE = 별로였어요). 방문 안 함일 경우 null 가능", example = "LIKE")
	private String satisfaction;  // "LIKE" | "NEUTRAL" | "DISLIKE" | null
}

