package com.JDE.mainserver.restaurants.controller;

import com.JDE.mainserver.restaurants.dto.RestaurantDtos;
import com.JDE.mainserver.restaurants.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    // 검색
    @GetMapping
    public ResponseEntity<Page<RestaurantDtos.Summary>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("id").descending());
        var body = restaurantService.searchByKeyword(query, pageable);
        return ResponseEntity.ok(body);
        // ✅ ApiResponse 래퍼를 쓰려면 아래 한 줄로 교체:
        // return ResponseEntity.ok(ApiResponse.onSuccess(body)); // 메서드명(onSuccess/success/of) 맞춰 사용
    }

    // 상세
    @GetMapping("/{restaurantId}")
    public ResponseEntity<RestaurantDtos.Detail> detail(@PathVariable Long restaurantId) {
        var body = restaurantService.getDetail(restaurantId);
        return ResponseEntity.ok(body);
        // return ResponseEntity.ok(ApiResponse.onSuccess(body));
    }

    // 공유(외부 링크 반환)
    @PostMapping("/{restaurantId}/share")
    public ResponseEntity<RestaurantDtos.ShareResp> share(@PathVariable Long restaurantId) {
        var body = restaurantService.share(restaurantId);
        return ResponseEntity.ok(body);
        // return ResponseEntity.ok(ApiResponse.onSuccess(body));
    }

    /* 즐겨찾기는 Bookmark 레이어 연결 후 활성화 (지금은 주석 처리)
    @PostMapping("/{restaurantId}/bookmark")
    public ResponseEntity<Void> bookmark(@PathVariable Long restaurantId,
                                         @AuthenticationPrincipal Member me) {
        restaurantService.bookmark(restaurantId, me);
        return ResponseEntity.ok().build();
        // return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{restaurantId}/bookmark")
    public ResponseEntity<Void> unbookmark(@PathVariable Long restaurantId,
                                           @AuthenticationPrincipal Member me) {
        restaurantService.unbookmark(restaurantId, me);
        return ResponseEntity.ok().build();
    }
    */
}
