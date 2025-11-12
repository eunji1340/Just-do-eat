/**
 * main/web/dto/response/FeedResponse.java
 * 피드 무한 스크롤용 응답 DTO
 * Author: Jang
 * Date: 2025-10-31
 */

package com.jde.mainserver.main.web.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;

@Schema(
	description = "개인 추천 피드 응답 (무한 스크롤)",
	example = """
		{
		  "items": [
		    {
		      "restaurant_id": 1,
		      "kakao_id": 27347714,
		      "name": "아리네술상",
		      "address": "서울 강남구 논현로94길 11",
		      "address_lot": "서울 강남구 역삼동 669-16",
		      "phone": "02-1234-5678",
		      "kakao_summary": {
		        "title": "피규어 가득한 감성 이자카야 술상",
		        "summary": "역삼역 근처에 위치한 이자카야 스타일의 술집으로, 다양한 안주와 일식 메뉴를 제공합니다."
		      },
		      "category1": "음식점",
		      "category2": "술집",
		      "category3": "실내포장마차",
		      "kakao_url": "http://place.map.kakao.com/27347714",
		      "kakao_rating": 4.1,
		      "kakao_review_cnt": 10,
		      "blog_review_cnt": 27,
		      "price_range": "MEDIUM",
		      "image": [
		        "http://t1.daumcdn.net/local/kakaomapPhoto/review/3166313fc72c663dd1a368548ddaed18792cbfdb?original"
		      ],
		      "menu": [
		        {
		          "name": "연어랑 육회랑",
		          "price": 37000,
		          "is_recommend": false,
		          "is_ai_mate": false
		        },
		        {
		          "name": "생연어회",
		          "price": 26000,
		          "is_recommend": false,
		          "is_ai_mate": false
		        }
		      ],
		      "is_parking": false,
		      "is_reservation": true,
		      "hours": [
		        {
		          "dow": 1,
		          "open": "18:00:00",
		          "close": "02:00:00",
		          "break_open": null,
		          "break_close": null,
		          "is_holiday": false
		        },
		        {
		          "dow": 2,
		          "open": "18:00:00",
		          "close": "02:00:00",
		          "break_open": null,
		          "break_close": null,
		          "is_holiday": false
		        }
		      ],
		      "distance_m": 250,
		      "is_open": true
		    }
		  ],
		  "next_cursor": "10"
		}
		"""
)
public record FeedResponse(
        @Schema(description = "현재 배치의 식당 리스트", example = "[]")
        @JsonProperty("items")
        List<RestaurantItem> items,

        @Schema(description = "다음 배치 요청을 위한 커서 (null이면 더 이상 데이터 없음)", example = "10")
        @JsonProperty("next_cursor")
        String nextCursor
) {
    @Schema(description = "식당 정보")
    public record RestaurantItem(
            @Schema(description = "식당 ID", example = "1")
            @JsonProperty("restaurant_id")
            Long restaurantId,

            @Schema(description = "카카오 장소 ID", example = "27347714")
            @JsonProperty("kakao_id")
            Long kakaoId,

            @Schema(description = "식당명", example = "아리네술상")
            @JsonProperty("name")
            String name,

            @Schema(description = "도로명주소", example = "서울 강남구 논현로94길 11")
            @JsonProperty("address")
            String address,

            @Schema(description = "지번주소", example = "서울 강남구 역삼동 669-16")
            @JsonProperty("address_lot")
            String addressLot,

            @Schema(description = "전화번호", example = "02-1234-5678")
            @JsonProperty("phone")
            String phone,

            @Schema(description = "카카오 소개 정보 (JSON)", example = "{\"title\": \"피규어 가득한 감성 이자카야 술상\", \"summary\": \"역삼역 근처에 위치한 이자카야 스타일의 술집으로, 다양한 안주와 일식 메뉴를 제공합니다.\"}")
            @JsonProperty("kakao_summary")
            Object kakaoSummary,

            @Schema(description = "카테고리 대분류", example = "음식점")
            @JsonProperty("category1")
            String category1,

            @Schema(description = "카테고리 중분류", example = "술집")
            @JsonProperty("category2")
            String category2,

            @Schema(description = "카테고리 소분류", example = "실내포장마차")
            @JsonProperty("category3")
            String category3,

            @Schema(description = "카카오맵 URL", example = "http://place.map.kakao.com/27347714")
            @JsonProperty("kakao_url")
            String kakaoUrl,

            @Schema(description = "카카오 평점", example = "4.1")
            @JsonProperty("kakao_rating")
            Float kakaoRating,

            @Schema(description = "카카오 리뷰 수", example = "10")
            @JsonProperty("kakao_review_cnt")
            Integer kakaoReviewCnt,

            @Schema(description = "블로그 리뷰 수", example = "27")
            @JsonProperty("blog_review_cnt")
            Integer blogReviewCnt,

            @Schema(description = "가격대", example = "MEDIUM")
            @JsonProperty("price_range")
            String priceRange,

            @Schema(description = "이미지 URL 배열", example = "[\"http://t1.daumcdn.net/local/kakaomapPhoto/review/3166313fc72c663dd1a368548ddaed18792cbfdb?original\"]")
            @JsonProperty("image")
            Object image,

            @Schema(description = "메뉴 정보", example = "[{\"name\": \"연어랑 육회랑\", \"price\": 37000, \"is_recommend\": false, \"is_ai_mate\": false}, {\"name\": \"생연어회\", \"price\": 26000, \"is_recommend\": false, \"is_ai_mate\": false}]")
            @JsonProperty("menu")
            Object menu,

            @Schema(description = "주차 가능 여부", example = "false")
            @JsonProperty("is_parking")
            Boolean isParking,

            @Schema(description = "예약 가능 여부", example = "true")
            @JsonProperty("is_reservation")
            Boolean isReservation,

            @Schema(description = "영업시간 정보", example = "[{\"dow\": 1, \"open\": \"18:00:00\", \"close\": \"02:00:00\", \"break_open\": null, \"break_close\": null, \"is_holiday\": false}]")
            @JsonProperty("hours")
            List<HourItem> hours,

            @Schema(description = "거리(미터)", example = "250")
            @JsonProperty("distance_m")
            Integer distanceM,

            @Schema(description = "영업 중 여부", example = "true")
            @JsonProperty("is_open")
            Boolean isOpen,

            @Schema(description = "점수 계산 상세 정보 (debug)", example = "{\"w_tag\": 0.0, \"w_saved\": 0.0, \"w_pref\": 0.015, \"base\": 0.115, \"distance_decay\": 0.98, \"final\": 0.1127}")
            @JsonProperty("debug")
            Map<String, Object> debug
    ) {
        @Schema(description = "영업시간 정보")
        public record HourItem(
                @Schema(description = "요일 (0=공휴일, 1=월요일, ..., 7=일요일)", example = "1")
                @JsonProperty("dow")
                Integer dow,

                @Schema(description = "영업 시작 시각", example = "18:00:00")
                @JsonProperty("open")
                String open,

                @Schema(description = "영업 종료 시각", example = "02:00:00")
                @JsonProperty("close")
                String close,

                @Schema(description = "브레이크타임 시작 시각", example = "14:00:00")
                @JsonProperty("break_open")
                String breakOpen,

                @Schema(description = "브레이크타임 종료 시각", example = "15:00:00")
                @JsonProperty("break_close")
                String breakClose,

                @Schema(description = "공휴일 여부", example = "false")
                @JsonProperty("is_holiday")
                Boolean isHoliday
        ) {}
    }
}
