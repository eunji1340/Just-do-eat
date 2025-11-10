/**
 * main/web/dto/response/LastSelectedRestaurantResponse.java
 * 최근 선택 식당 응답 DTO
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.web.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(
	description = "최근 선택 식당 응답",
	example = """
		{
		  "restaurantId": 1001,
		  "name": "아리네술상"
		}
		"""
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LastSelectedRestaurantResponse {

	@Schema(description = "식당 ID", example = "1001", required = true)
	@JsonProperty("restaurantId")
	private Long restaurantId;

	@Schema(description = "식당명", example = "아리네술상", required = true, type = "string")
	@JsonProperty("name")
	private String name;
}

