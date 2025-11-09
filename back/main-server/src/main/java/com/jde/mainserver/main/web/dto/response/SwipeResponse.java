/**
 * main/web/dto/response/SwipeResponse.java
 * 스와이프 액션 처리 응답 DTO
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.web.dto.response;

import com.jde.mainserver.main.entity.SwipeAction;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Schema(
	description = "스와이프 액션 처리 응답",
	example = """
		{
		  "userId": 1,
		  "restaurantId": 1001,
		  "isSaved": false,
		  "lastSwipe": "SELECT",
		  "lastSwipeAt": "2025-11-09T08:00:00Z",
		  "prefScore": 0.800
		}
		"""
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SwipeResponse {

    @Schema(description = "유저 ID", example = "1")
    private Long userId;

    @Schema(description = "식당 ID", example = "1001")
    private Long restaurantId;

    @Schema(description = "저장 여부", example = "false")
    private Boolean isSaved;

    @Schema(description = "최근 스와이프 액션", example = "SELECT")
    private SwipeAction lastSwipe;

    @Schema(description = "최근 스와이프 시각", example = "2025-11-09T08:00:00Z")
    private Instant lastSwipeAt;

    @Schema(description = "개인 선호 점수 (UserRestaurantState.pref_score)", example = "0.800")
    private Double prefScore;
}


