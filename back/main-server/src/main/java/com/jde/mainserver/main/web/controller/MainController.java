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
import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.main.web.dto.response.SwipeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
		@RequestParam long userId,

		@Parameter(description = "다음 배치 커서 (null이나 0이면 첫 요청)", example = "0")
		@RequestParam(required = false) String cursor
	) {
		// 위치 정보는 DB에서 조회 (현재는 기본값 사용)
		// TODO: 향후 사용자 위치를 DB에서 조회하도록 수정
		return mainQueryService.getFeedBatch(userId, cursor, new HashMap<>());
	}

    @Operation(summary = "스와이프 액션 처리", description = "HOLD/DISLIKE/SELECT 기록")
    @PostMapping("/feed/swipe")
    public SwipeResponse swipe(@Valid @RequestBody SwipeRequest request) {
        return mainCommandService.handleSwipe(request);
    }
}

