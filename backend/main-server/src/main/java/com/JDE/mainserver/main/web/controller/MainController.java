/**
 * main/web/controller/MainController.java
 * 메인 피드 API
 * Author: Jang
 * Date: 2025-10-31
 */
package com.JDE.mainserver.main.web.controller;

import com.JDE.mainserver.main.service.query.FeedService;
import com.JDE.mainserver.main.web.dto.response.FeedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;

@Tag(name = "메인", description = "메인 페이지 API")
@RestController
@RequestMapping("/main")
public class MainController {
	private final FeedService feedService;

	public MainController(FeedService feedService) {
		this.feedService = feedService;
	}

	@Operation(
		summary = "개인 추천 피드 조회",
		description = "사용자별 개인화 추천 피드를 무한 스크롤 방식으로 조회합니다. cursor가 없으면 첫 요청, 숫자면 해당 인덱스부터 조회합니다."
	)
	@ApiResponses({
		@ApiResponse(
			responseCode = "200",
			description = "피드 조회 성공",
			content = @Content(
				mediaType = "application/json",
				schema = @Schema(implementation = FeedResponse.class),
				examples = @ExampleObject(
					name = "피드 조회 성공 예시",
					value = """
						{
						  "items": [
						    {
						      "restaurant_id": 1,
						      "name": "맛있는 한식당",
						      "address": "서울시 강남구 테헤란로 123",
						      "phone": "02-1234-5678",
						      "summary": "전통 한식의 맛을 느낄 수 있는 곳",
						      "image": ["http://example.com/korean_main.jpg"],
						      "category": "한식",
						      "rating": 4.5,
						      "price_range": "MEDIUM",
						      "website_url": "https://map.kakao.com/?q=맛있는한식당",
						      "menu": [
						        {"name": "비빔밥", "price": 10000},
						        {"name": "불고기", "price": 15000}
						      ],
						      "distance_m": 350,
						      "is_open": true
						    }
						  ],
						  "next_cursor": "10"
						}
						"""
				)
			)
		)
	})
	@GetMapping("/feed")
	public FeedResponse feed(
		@Parameter(
			description = "유저 ID",
			required = true,
			example = "1"
		)
		@RequestParam long userId,
		
		@Parameter(
			description = "다음 페이지 커서 (첫 요청 시 생략 가능, 숫자 문자열)",
			required = false,
			example = "10"
		)
		@RequestParam(required = false) String cursor
	) {
		return feedService.getFeedBatch(userId, cursor, new HashMap<>());
	}
}

