/**
 * restaurants/web/dto/response/RestaurantDetailResponse.java
 * 식당 상세 정보 응답 DTO
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

import java.util.List;

@Schema(description = "식당 상세 정보")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDetailResponse {

	@Schema(description = "식당 ID", example = "1001")
	@JsonProperty("restaurant_id")
	private Long restaurantId;

	@Schema(description = "카카오 장소 ID", example = "27347714")
	@JsonProperty("kakao_id")
	private Long kakaoId;

	@Schema(description = "식당명", example = "아리네술상")
	@JsonProperty("name")
	private String name;

	@Schema(description = "도로명주소", example = "서울 강남구 논현로94길 11")
	@JsonProperty("address")
	private String address;

	@Schema(description = "지번주소", example = "서울 강남구 역삼동 669-16")
	@JsonProperty("address_lot")
	private String addressLot;

	@Schema(description = "전화번호", example = "02-1234-5678")
	@JsonProperty("phone")
	private String phone;

	@Schema(description = "카카오 소개 정보 (JSON)", example = "{\"title\": \"피규어 가득한 감성 이자카야 술상\", \"summary\": \"역삼역 근처에 위치한 이자카야 스타일의 술집으로, 다양한 안주와 일식 메뉴를 제공합니다.\"}")
	@JsonProperty("kakao_summary")
	private Object kakaoSummary;

	@Schema(description = "카테고리 대분류", example = "음식점")
	@JsonProperty("category1")
	private String category1;

	@Schema(description = "카테고리 중분류", example = "술집")
	@JsonProperty("category2")
	private String category2;

	@Schema(description = "카테고리 소분류", example = "실내포장마차")
	@JsonProperty("category3")
	private String category3;

	@Schema(description = "카카오맵 URL", example = "http://place.map.kakao.com/27347714")
	@JsonProperty("kakao_url")
	private String kakaoUrl;

	@Schema(description = "카카오 평점", example = "4.1")
	@JsonProperty("kakao_rating")
	private Float kakaoRating;

	@Schema(description = "카카오 리뷰 수", example = "10")
	@JsonProperty("kakao_review_cnt")
	private Integer kakaoReviewCnt;

	@Schema(description = "블로그 리뷰 수", example = "27")
	@JsonProperty("blog_review_cnt")
	private Integer blogReviewCnt;

	@Schema(description = "가격대", example = "MEDIUM")
	@JsonProperty("price_range")
	private String priceRange;

	@Schema(description = "이미지 URL 배열", example = "[\"http://t1.daumcdn.net/local/kakaomapPhoto/review/3166313fc72c663dd1a368548ddaed18792cbfdb?original\"]")
	@JsonProperty("image")
	private Object image;

	@Schema(description = "메뉴 정보", example = "[{\"name\": \"연어랑 육회랑\", \"price\": 37000, \"is_recommend\": false, \"is_ai_mate\": false}]")
	@JsonProperty("menu")
	private Object menu;

	@Schema(description = "주차 가능 여부", example = "false")
	@JsonProperty("is_parking")
	private Boolean isParking;

	@Schema(description = "예약 가능 여부", example = "true")
	@JsonProperty("is_reservation")
	private Boolean isReservation;

	@Schema(description = "영업시간 정보", example = "[{\"dow\": 1, \"open\": \"18:00:00\", \"close\": \"02:00:00\", \"break_open\": null, \"break_close\": null, \"is_holiday\": false}]")
	@JsonProperty("hours")
	private List<HourItem> hours;

	@Schema(description = "영업시간 정보")
	@Getter
	@Setter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class HourItem {
		@Schema(description = "요일 (0=공휴일, 1=월요일, ..., 7=일요일)", example = "1")
		@JsonProperty("dow")
		private Integer dow;

		@Schema(description = "영업 시작 시각", example = "18:00:00")
		@JsonProperty("open")
		private String open;

		@Schema(description = "영업 종료 시각", example = "02:00:00")
		@JsonProperty("close")
		private String close;

		@Schema(description = "브레이크타임 시작 시각", example = "14:00:00")
		@JsonProperty("break_open")
		private String breakOpen;

		@Schema(description = "브레이크타임 종료 시각", example = "15:00:00")
		@JsonProperty("break_close")
		private String breakClose;

		@Schema(description = "공휴일 여부", example = "false")
		@JsonProperty("is_holiday")
		private Boolean isHoliday;
	}
}

