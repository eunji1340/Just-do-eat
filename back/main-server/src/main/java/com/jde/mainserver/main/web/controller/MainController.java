/**
 * main/web/controller/MainController.java
 * 메인 화면 컨트롤러
 * Author: Jang
 * Date: 2025-10-31
 */

package com.jde.mainserver.main.web.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.main.service.query.MainQueryService;
import com.jde.mainserver.main.service.command.MainCommandService;
import com.jde.mainserver.main.web.dto.request.SwipeRequest;
import com.jde.mainserver.main.web.dto.request.VisitFeedbackRequest;
import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.main.web.dto.response.SwipeResponse;
import com.jde.mainserver.main.web.dto.response.LastSelectedRestaurantResponse;
import com.jde.mainserver.main.web.dto.response.VisitFeedbackResponse;
import com.jde.mainserver.restaurants.service.query.RestaurantQueryService;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;

import com.jde.mainserver.main.web.dto.response.MainRegionRecommendResponse;
import com.jde.mainserver.main.service.query.MainRegionRecommendQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Tag(name = "메인", description = "메인 피드 및 스와이프 API")
@RestController
@RequestMapping("/main")
@RequiredArgsConstructor
public class MainController {

	private final MainQueryService mainQueryService;
	private final MainCommandService mainCommandService;
	private final RestaurantQueryService restaurantQueryService;
	private final MainRegionRecommendQueryService mainRegionRecommendQueryService;

	@Operation(
		summary = "개인 추천 피드 조회",
		description = "cursor 기반 무한 스크롤 피드 (비회원도 접근 가능, 비회원은 카카오 평점/리뷰 수 기준 정렬). 사용자 위치 기반으로 식당을 추천합니다.",
		security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@GetMapping("/feed")
	public FeedResponse getFeed(
		@AuthUser Long userId,
		@Parameter(description = "다음 배치 커서 (null이나 0이면 첫 요청)", example = "0")
		@RequestParam(required = false) String cursor,
		HttpServletRequest request
	) {
		double[] coordinates = mainQueryService.getCoordinates(userId);
		Map<String, Object> ctx = new HashMap<>();
		ctx.put("lng", coordinates[0]);
		ctx.put("lat", coordinates[1]);

		if (userId == null) {
			String clientIp = getClientIp(request);
			if (clientIp != null) {
				ctx.put("ip", clientIp);
			}
		}

		return mainQueryService.getFeedBatch(userId, cursor, ctx);
	}

	private String getClientIp(HttpServletRequest request) {
		String[] headers = {
			"X-Forwarded-For",
			"Proxy-Client-IP",
			"WL-Proxy-Client-IP",
			"HTTP_CLIENT_IP",
			"HTTP_X_FORWARDED_FOR"
		};

		for (String header : headers) {
			String ip = request.getHeader(header);
			if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
				if (ip.contains(",")) {
					ip = ip.split(",")[0].trim();
				}
				return ip;
			}
		}

		return request.getRemoteAddr();
	}

	@Operation(
		summary = "스와이프 액션 처리",
		description = "HOLD/DISLIKE/SELECT 기록",
		security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@PostMapping("/feed/swipe")
	public SwipeResponse swipe(
		@AuthUser Long userId,
		@Valid @RequestBody SwipeRequest request
	) {
		return mainCommandService.handleSwipe(userId, request);
	}

	@Operation(
		summary = "최근 선택 식당 조회",
		description = "사용자가 가장 최근에 SELECT 액션으로 선택한 식당을 조회합니다. 없으면 204 No Content를 반환합니다.",
		security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@GetMapping("/restaurants/last-selected")
	public ResponseEntity<LastSelectedRestaurantResponse> getLastSelectedRestaurant(
		@AuthUser Long userId
	) {
		LastSelectedRestaurantResponse response = mainQueryService.getLastSelectedRestaurant(userId);
		if (response == null) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(response);
	}

	@Operation(
		summary = "방문 피드백 처리",
		description = "방문 여부와 만족도(LIKE/NEUTRAL/DISLIKE)를 기록하고 선호 점수를 업데이트합니다.",
		security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@PostMapping("/restaurants/{restaurantId}/visit-feedback")
	public VisitFeedbackResponse visitFeedback(
		@Parameter(description = "식당 ID", example = "379", required = true)
		@PathVariable Long restaurantId,
		@AuthUser Long userId,
		@Valid @RequestBody VisitFeedbackRequest request
	) {
		return mainCommandService.handleVisitFeedback(
			restaurantId,
			userId,
			request.getIsVisited(),
			request.getSatisfaction()
		);
	}

	@Operation(
		summary = "위치 기반 인기 식당 Top10 조회",
		description = "사용자 기준 위치 주변 식당을 즐겨찾기 수 기준으로 정렬해 최대 10개 반환. 기본 반경 700m에서 시작하여 후보가 부족하면 자동으로 확장됩니다. 비로그인 유저는 기본 지역(region_id=1) 사용."
	)
	@GetMapping("/restaurants/popular")
	public List<RestaurantSummaryResponse> getPopularRestaurantsTop10(
		@AuthUser Long userId
	) {
		double[] coordinates = mainQueryService.getCoordinates(userId);
		return restaurantQueryService.getPopularRestaurantsTop10(coordinates[0], coordinates[1]);
	}

	@Operation(
		summary = "카테고리별 위치 기반 인기 식당 조회",
		description = "사용자 기준 위치 주변 식당을 즐겨찾기 수 기준으로 정렬해 cursor 기반으로 10개씩 제공. FeedResponse 형식으로 상세 정보 제공. 기본 반경 700m에서 시작하여 후보가 부족하면 자동으로 확장됩니다. 비로그인 유저는 기본 지역(region_id=1) 사용."
	)
	@GetMapping("/restaurants/popular/category/{category}")
	public FeedResponse getPopularRestaurantsByCategory(
		@AuthUser Long userId,
		@Parameter(description = "카테고리 (한식, 중식, 일식, 양식, 분식, 치킨, 패스트푸드, 디저트, 샐러드, 아시아/퓨전, 뷔페/패밀리, 술집)", example = "한식")
		@PathVariable String category,
		@Parameter(description = "다음 배치 커서 (null이나 0이면 첫 요청)", example = "0")
		@RequestParam(required = false) String cursor
	) {
		double[] coordinates = mainQueryService.getCoordinates(userId);
		return restaurantQueryService.getPopularRestaurantsByCategory(coordinates[0], coordinates[1], category, cursor);
	}

	@Operation(summary = "홈 화면 개요 (상권 및 추천 여부)", description = "회원의 설정된 상권 정보를 기반으로 홈 화면 초기 개요를 제공합니다.")
	@GetMapping("/overview")
	public MainRegionRecommendResponse getHomeOverview(
			@Parameter(description = "사용자 ID", example = "1", required = true)
			@RequestHeader("UserId") Long userId
	) {
		// MainRegionRecommendQueryService의 overview 메서드 호출
		return mainRegionRecommendQueryService.overview(userId);
	}


}

