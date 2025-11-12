/**
 * restaurants/web/dto/response/RestaurantBookmarkResponse.java
 * 즐겨찾기 식당 정보 응답 DTO
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.web.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "즐겨찾기 식당 정보")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantBookmarkResponse {

	@Schema(description = "식당 ID", example = "1001")
	@JsonProperty("restaurant_id")
	private Long restaurantId;

	@Schema(description = "식당명", example = "아리네술상")
	@JsonProperty("name")
	private String name;

	@Schema(description = "카테고리 대분류", example = "음식점")
	@JsonProperty("category1")
	private String category1;

	@Schema(description = "카테고리 중분류", example = "술집")
	@JsonProperty("category2")
	private String category2;

	@Schema(description = "카테고리 소분류", example = "실내포장마차")
	@JsonProperty("category3")
	private String category3;

	@Schema(description = "메뉴 정보 (JSONB)", example = "[{\"name\":\"치킨\",\"price\":20000,\"is_recommend\":true}]")
	@JsonProperty("menu")
	private Object menu;

	@Schema(description = "해당 식당이 저장된 수 (is_saved=true인 사용자 수)", example = "42")
	@JsonProperty("saved_count")
	private Long savedCount;

	@Schema(description = "이미지 URL 배열", example = "[\"http://t1.daumcdn.net/local/kakaomapPhoto/review/3166313fc72c663dd1a368548ddaed18792cbfdb?original\"]")
	@JsonProperty("image")
	private Object image;
}

