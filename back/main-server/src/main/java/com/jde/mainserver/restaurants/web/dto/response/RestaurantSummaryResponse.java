/**
 * restaurants/web/dto/response/RestaurantSummaryResponse.java
 * 식당 요약 정보 응답 DTO
 * Author: Kim
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

@Schema(description = "식당 요약 정보")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantSummaryResponse {

	@Schema(description = "식당 ID", example = "1001")
	@JsonProperty("restaurant_id")
	private Long restaurantId;

	@Schema(description = "카카오 식당 ID", example = "1584928371")
	@JsonProperty("kakao_id")
	private Long kakaoId;

	@Schema(description = "식당명", example = "아리네술상")
	@JsonProperty("name")
	private String name;

	@Schema(description = "도로명주소", example = "서울 강남구 논현로94길 11")
	@JsonProperty("address")
	private String address;

	@Schema(description = "카테고리 대분류", example = "음식점")
	@JsonProperty("category1")
	private String category1;

	@Schema(description = "카테고리 중분류", example = "술집")
	@JsonProperty("category2")
	private String category2;

	@Schema(description = "카테고리 소분류", example = "실내포장마차")
	@JsonProperty("category3")
	private String category3;

	@Schema(description = "카카오 평점", example = "4.1")
	@JsonProperty("kakao_rating")
	private Float kakaoRating;

	@Schema(description = "카카오 리뷰 수", example = "321")
	@JsonProperty("kakao_review_cnt")
	private Integer kakaoReviewCnt;

	@Schema(description = "가격대", example = "MEDIUM")
	@JsonProperty("price_range")
	private String priceRange;

	@Schema(description = "대표 이미지 URL(첫 번째 사진)", example = "http://t1.daumcdn.net/local/kakaomapPhoto/review/3166313fc72c663dd1a368548ddaed18792cbfdb?original")
	@JsonProperty("image")
	private String image;

	@Schema(description = "현재 로그인 사용자가 이 식당을 북마크 했는지 여부 (비로그인 시 false)", example = "true")
	@JsonProperty("bookmarked")
	private Boolean bookmarked;
}
