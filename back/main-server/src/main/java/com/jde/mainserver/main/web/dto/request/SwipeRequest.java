/**
 * main/web/dto/request/SwipeRequest.java
 * 스와이프 액션 요청 DTO
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.web.dto.request;

import com.jde.mainserver.main.entity.enums.SwipeAction;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(
	description = "스와이프 액션 요청",
	example = """
		{
		  "restaurantId": 1001,
		  "action": "SELECT"
		}
		"""
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SwipeRequest {

    @Schema(description = "식당 ID", example = "379")
    @NotNull
    private Long restaurantId;

    @Schema(description = "스와이프 액션 (HOLD/DISLIKE/SELECT)", example = "HOLD")
    @NotNull
    private SwipeAction action;
}


