/**
 * restaurants/web/controller/RestaurantController.java
 * 식당 컨트롤러
 * Author: Jang
 * Date: 2025-11-09 (updated 2025-11-14)
 */

package com.jde.mainserver.restaurants.web.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.restaurants.exception.RestaurantErrorCode;
import com.jde.mainserver.restaurants.exception.RestaurantException;
import com.jde.mainserver.restaurants.service.command.RestaurantCommandService;
import com.jde.mainserver.restaurants.service.query.RestaurantQueryService;
import com.jde.mainserver.restaurants.web.dto.request.RestaurantSearchRequest;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@Tag(name = "식당", description = "식당 관련 API")
@RestController
@RequestMapping("/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

	private final RestaurantQueryService restaurantQueryService;
	private final RestaurantCommandService restaurantCommandService;

	@Operation(
			summary = "식당 검색",
			description = "검색/필터(영업중, 반경, 가격, 태그 등). 비회원도 가능, 회원이면 북마크 여부 반영.",
			security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@GetMapping
	public Page<RestaurantSummaryResponse> search(
			@AuthUser Long userId,
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

		// 🔹 userId는 로그인 시에만 값이 있고, 비회원이면 null
		return restaurantQueryService.search(req, pageable, userId);
	}

	@Operation(
			summary = "식당 상세 조회",
			description = "식당의 상세 정보를 조회합니다. 비회원도 접근 가능하며, 회원인 경우 view_count가 증가하고 선호 점수가 업데이트됩니다.",
			security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@GetMapping("/{restaurantId}")
	public RestaurantDetailResponse detail(
			@Parameter(description = "식당 ID", example = "379", required = true)
			@PathVariable Long restaurantId,
			@AuthUser Long userId
	) {
		return restaurantQueryService.getDetail(restaurantId, userId);
	}

	@Operation(
			summary = "식당 공유",
			description = "식당의 공유 링크를 반환합니다. 비회원도 접근 가능하며, 회원인 경우 share_count가 증가하고 선호 점수가 업데이트됩니다.",
			security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@PostMapping("/{restaurantId}/share")
	public RestaurantShareResponse share(
			@Parameter(description = "식당 ID", example = "379", required = true)
			@PathVariable Long restaurantId,
			@AuthUser Long userId
	) {
		return restaurantQueryService.getShare(restaurantId, userId);
	}

	@Operation(
			summary = "식당 즐겨찾기 추가",
			description = "식당을 즐겨찾기에 추가합니다. is_saved=true로 변경되며 개인 점수와 태그 선호도가 업데이트됩니다.",
			security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@PostMapping("/{restaurantId}/bookmark")
	public org.springframework.http.ResponseEntity<Void> addBookmark(
			@Parameter(description = "식당 ID", example = "379", required = true)
			@PathVariable Long restaurantId,
			@AuthUser Long userId
	) {
		if (userId == null) {
			throw new RestaurantException(RestaurantErrorCode.UNAUTHORIZED);
		}
		restaurantCommandService.addBookmark(restaurantId, userId);
		return org.springframework.http.ResponseEntity.noContent().build();
	}

	@Operation(
			summary = "식당 즐겨찾기 해제",
			description = "식당을 즐겨찾기에서 제거합니다. is_saved=false로 변경되며 개인 점수와 태그 선호도가 업데이트됩니다.",
			security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@DeleteMapping("/{restaurantId}/bookmark")
	public org.springframework.http.ResponseEntity<Void> removeBookmark(
			@Parameter(description = "식당 ID", example = "379", required = true)
			@PathVariable Long restaurantId,
			@AuthUser Long userId
	) {
		if (userId == null) {
			throw new RestaurantException(RestaurantErrorCode.UNAUTHORIZED);
		}
		restaurantCommandService.removeBookmark(restaurantId, userId);
		return org.springframework.http.ResponseEntity.noContent().build();
	}

	@Operation(
			summary = "즐겨찾기한 식당 목록 조회",
			description = "사용자가 즐겨찾기한 식당 목록을 조회합니다. 식당 id, 식당명, 카테고리123, 메뉴, 저장된 수, 이미지를 반환합니다. 최근 저장한 순서로 정렬됩니다.",
			security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@GetMapping("/bookmarks")
	public Page<RestaurantBookmarkResponse> getBookmarks(
			@AuthUser Long userId,
			@Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
			@RequestParam(required = false, defaultValue = "0") int page,
			@Parameter(description = "페이지 크기", example = "10")
			@RequestParam(required = false, defaultValue = "10") int size
	) {
		if (userId == null) {
			throw new RestaurantException(RestaurantErrorCode.UNAUTHORIZED);
		}
		Pageable pageable = PageRequest.of(page, size);
		return restaurantQueryService.getBookmarks(userId, pageable);
	}
}
