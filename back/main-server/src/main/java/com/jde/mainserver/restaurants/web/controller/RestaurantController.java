/**
 * restaurants/web/controller/RestaurantController.java
 * 식당 컨트롤러
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.web.controller;

import com.jde.mainserver.restaurants.service.command.RestaurantCommandService;
import com.jde.mainserver.restaurants.service.query.RestaurantQueryService;
import com.jde.mainserver.restaurants.web.dto.response.BookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@Tag(name = "식당", description = "식당 관련 API")
@RestController
@RequestMapping("/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

	private final RestaurantQueryService restaurantQueryService;
	private final RestaurantCommandService restaurantCommandService;

	@Operation(summary = "식당 검색", description = "키워드로 식당을 검색합니다. 키워드가 없으면 전체 조회합니다.")
	@GetMapping
	public Page<RestaurantSummaryResponse> search(
		@Parameter(description = "검색 키워드", example = "치킨")
		@RequestParam(required = false, defaultValue = "") String query,
		@Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
		@RequestParam(defaultValue = "0") int page,
		@Parameter(description = "페이지 크기", example = "10")
		@RequestParam(defaultValue = "10") int size
	) {
		var pageable = PageRequest.of(page, size, Sort.by("id").descending());
		return restaurantQueryService.searchByKeyword(query, pageable);
	}

	@Operation(summary = "식당 상세 조회", description = "식당의 상세 정보를 조회합니다. view_count가 증가하고 선호 점수가 업데이트됩니다.")
	@GetMapping("/{restaurantId}")
	public RestaurantDetailResponse detail(
		@Parameter(description = "식당 ID", example = "1001", required = true)
		@PathVariable Long restaurantId,
		@Parameter(description = "유저 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId
	) {
		return restaurantQueryService.getDetail(restaurantId, userId);
	}

	@Operation(summary = "식당 공유", description = "식당의 공유 링크를 반환합니다. share_count가 증가하고 선호 점수가 업데이트됩니다.")
	@PostMapping("/{restaurantId}/share")
	public RestaurantShareResponse share(
		@Parameter(description = "식당 ID", example = "1001", required = true)
		@PathVariable Long restaurantId,
		@Parameter(description = "유저 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId
	) {
		return restaurantQueryService.getShare(restaurantId, userId);
	}

	@Operation(summary = "식당 즐겨찾기 추가", description = "식당을 즐겨찾기에 추가합니다. is_saved=true로 변경되며 개인 점수와 태그 선호도가 업데이트됩니다.")
	@PostMapping("/{restaurantId}/bookmark")
	public BookmarkResponse addBookmark(
		@Parameter(description = "식당 ID", example = "1001", required = true)
		@PathVariable Long restaurantId,
		@Parameter(description = "유저 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId
	) {
		return restaurantCommandService.addBookmark(restaurantId, userId);
	}

	@Operation(summary = "식당 즐겨찾기 해제", description = "식당을 즐겨찾기에서 제거합니다. is_saved=false로 변경되며 개인 점수와 태그 선호도가 업데이트됩니다.")
	@DeleteMapping("/{restaurantId}/bookmark")
	public BookmarkResponse removeBookmark(
		@Parameter(description = "식당 ID", example = "1001", required = true)
		@PathVariable Long restaurantId,
		@Parameter(description = "유저 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId
	) {
		return restaurantCommandService.removeBookmark(restaurantId, userId);
	}

	@Operation(summary = "즐겨찾기한 식당 목록 조회", description = "사용자가 즐겨찾기한 식당 목록을 조회합니다. 식당 id, 식당명, 카테고리123, 메뉴, 저장된 수, 이미지를 반환합니다. 최근 저장한 순서로 정렬됩니다.")
	@GetMapping("/bookmarks")
	public Page<RestaurantBookmarkResponse> getBookmarks(
		@Parameter(description = "유저 ID", example = "1", required = true)
		@RequestHeader("UserId") Long userId,
		@Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
		@RequestParam(defaultValue = "0") int page,
		@Parameter(description = "페이지 크기", example = "10")
		@RequestParam(defaultValue = "10") int size
	) {
		var pageable = PageRequest.of(page, size);
		return restaurantQueryService.getBookmarks(userId, pageable);
	}
}

