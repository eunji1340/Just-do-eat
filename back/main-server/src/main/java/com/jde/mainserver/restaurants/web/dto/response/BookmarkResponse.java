/**
 * restaurants/web/dto/response/BookmarkResponse.java
 * 즐겨찾기 응답 DTO
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.web.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(
	description = "즐겨찾기 응답",
	example = """
		{
		  "userId": 1,
		  "restaurantId": 1001,
		  "isSaved": true,
		  "prefScore": 1.200
		}
		"""
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookmarkResponse {

    @Schema(description = "유저 ID", example = "1")
    private Long userId;

    @Schema(description = "식당 ID", example = "1001")
    private Long restaurantId;

    @Schema(description = "저장 여부", example = "true")
    private Boolean isSaved;

    @Schema(description = "개인 선호 점수 (UserRestaurantState.pref_score)", example = "1.200")
    private Double prefScore;
}

