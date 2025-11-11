/**
 * restaurants/web/controller/RestaurantController.java
 * 식당 컨트롤러
 * Author: Jang
 * Date: 2025-11-09 (updated 2025-11-12)
 */
package com.jde.mainserver.restaurants.web.controller;

import com.jde.mainserver.restaurants.service.command.RestaurantCommandService;
import com.jde.mainserver.restaurants.service.query.RestaurantQueryService;
import com.jde.mainserver.restaurants.web.dto.request.RestaurantSearchRequest;
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

	@Operation(summary = "식당 검색", description = "검색/필터(영업중, 반경, 가격, 태그 등)")
	@GetMapping
	public Page<RestaurantSummaryResponse> search(
			@Parameter(description = "검색 키워드", example = "치킨")
			@RequestParam(required = false) String query,
			@Parameter(description = "위도", example = "37.4979")
			@RequestParam(required = false) Double lat,
			@Parameter(description = "경도", example = "127.0276")
			@RequestParam(required = false) Double lng,
			@Parameter(description = "반경(미터)", example = "1000")
			@RequestParam(required = false) Double meters,
			@Parameter(description = "가격대", example = "MEDIUM")
			@RequestParam(required = false) String priceRange,
			@Parameter(description = "영업상태", example = "OPEN")
			@RequestParam(required = false) String openStatus,
			@Parameter(description = "태그", example = "한식")
			@RequestParam(required = false) String tag,
			@Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
			@RequestParam(defaultValue = "0") int page,
			@Parameter(description = "페이지 크기", example = "10")
			@RequestParam(defaultValue = "10") int size
	) {
		var pageable = PageRequest.of(page, size, Sort.by("id").descending());

		// 문자열 → Enum 변환(널 허용)
		var pr = priceRange == null ? null :
				com.jde.mainserver.restaurants.entity.enums.PriceRange.valueOf(priceRange.toUpperCase());
		var os = openStatus == null ? null :
				com.jde.mainserver.restaurants.entity.enums.OpenStatus.valueOf(openStatus.toUpperCase());

		var req = new RestaurantSearchRequest(query, lat, lng, meters, pr, os, tag);
		// QueryServiceImpl의 새 search 메서드 사용
		try {
			var method = restaurantQueryService.getClass()
					.getMethod("search", RestaurantSearchRequest.class, org.springframework.data.domain.Pageable.class);
			@SuppressWarnings("unchecked")
			Page<RestaurantSummaryResponse> result =
					(Page<RestaurantSummaryResponse>) method.invoke(restaurantQueryService, req, pageable);
			return result;
		} catch (NoSuchMethodException e) {
			// 인터페이스에 아직 선언 안된 경우(하위호환) — 키워드만 검색으로 폴백
			return restaurantQueryService.searchByKeyword(query == null ? "" : query, pageable);
		} catch (Exception e) {
			// 예외 시 폴백
			return restaurantQueryService.searchByKeyword(query == null ? "" : query, pageable);
		}
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
