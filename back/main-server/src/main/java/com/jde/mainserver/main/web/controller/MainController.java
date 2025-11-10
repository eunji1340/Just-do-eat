/**
 * main/web/controller/MainController.java
 * 메인 화면 컨트롤러
 * Author: Jang
 * Date: 2025-10-31
 */

package com.jde.mainserver.main.web.controller;

import com.jde.mainserver.main.service.query.MainQueryService;
import com.jde.mainserver.main.service.command.MainCommandService;
import com.jde.mainserver.main.web.dto.request.SwipeRequest;
import com.jde.mainserver.main.web.dto.request.VisitFeedbackRequest;
import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.main.web.dto.response.SwipeResponse;
import com.jde.mainserver.main.web.dto.response.LastSelectedRestaurantResponse;
import com.jde.mainserver.main.web.dto.response.VisitFeedbackResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;

@Tag(name = "메인", description = "메인 피드 및 스와이프 API")
@RestController
@RequestMapping("/main")
@RequiredArgsConstructor
public class MainController {

    private final MainQueryService mainQueryService;
    private final MainCommandService mainCommandService;

	@Operation(summary = "개인 추천 피드 조회", description = "cursor 기반 무한 스크롤 피드 (사용자 위치는 DB에서 조회)")
	@GetMapping("/feed")
	public FeedResponse getFeed(
		@Parameter(description = "사용자 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId,

		@Parameter(description = "다음 배치 커서 (null이나 0이면 첫 요청)", example = "0")
		@RequestParam(required = false) String cursor
	) {
		// 위치 정보는 DB에서 조회 (현재는 기본값 사용)
		// TODO: 향후 사용자 위치를 DB에서 조회하도록 수정
		return mainQueryService.getFeedBatch(userId, cursor, new HashMap<>());
	}

    @Operation(summary = "스와이프 액션 처리", description = "HOLD/DISLIKE/SELECT 기록")
    @PostMapping("/feed/swipe")
    public SwipeResponse swipe(
		@Parameter(description = "사용자 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId,
		@Valid @RequestBody SwipeRequest request
	) {
        return mainCommandService.handleSwipe(userId, request);
    }

	@Operation(summary = "최근 선택 식당 조회", description = "사용자가 가장 최근에 SELECT 액션으로 선택한 식당을 조회합니다. 없으면 204 No Content를 반환합니다.")
	@GetMapping("/restaurants/last-selected")
	public ResponseEntity<LastSelectedRestaurantResponse> getLastSelectedRestaurant(
		@Parameter(description = "사용자 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId
	) {
		LastSelectedRestaurantResponse response = mainQueryService.getLastSelectedRestaurant(userId);
		if (response == null) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "방문 피드백 처리", description = "방문 여부와 만족도(LIKE/NEUTRAL/DISLIKE)를 기록하고 선호 점수를 업데이트합니다.")
	@PostMapping("/restaurants/{restaurantId}/visit-feedback")
	public VisitFeedbackResponse visitFeedback(
		@Parameter(description = "식당 ID", example = "1001", required = true)
		@PathVariable Long restaurantId,
		@Parameter(description = "사용자 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId,
		@Valid @RequestBody VisitFeedbackRequest request
	) {
		return mainCommandService.handleVisitFeedback(
			restaurantId,
			userId,
			request.getIsVisited(),
			request.getSatisfaction()
		);
	}
}

