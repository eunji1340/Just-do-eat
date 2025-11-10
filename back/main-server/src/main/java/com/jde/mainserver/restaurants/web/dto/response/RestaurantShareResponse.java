/**
 * restaurants/web/dto/response/RestaurantShareResponse.java
 * 식당 공유 응답 DTO
 * Author: Kim
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.web.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "식당 공유 응답")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantShareResponse {

	@Schema(description = "식당 ID", example = "1001")
	private Long restaurantId;

	@Schema(description = "카카오맵 URL", example = "https://place.map.kakao.com/12345678")
	private String kakaoUrl;

	@Schema(description = "식당 이름", example = "맛있는 식당")
	private String name;
}

