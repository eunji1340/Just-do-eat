/**
 * restaurants/service/query/RestaurantQueryServiceImpl.java
 * 식당 Query 서비스 구현체
 * Author: Kim
 * Date: 2025-11-12 (finalized)
 */
package com.jde.mainserver.restaurants.service.query;

import com.jde.mainserver.main.service.command.MainCommandService;
import com.jde.mainserver.restaurants.converter.RestaurantConverter;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.exception.RestaurantErrorCode;
import com.jde.mainserver.restaurants.exception.RestaurantException;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.web.dto.request.RestaurantSearchRequest;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantQueryServiceImpl implements RestaurantQueryService {

	private final RestaurantRepository restaurantRepository;
	private final MainCommandService mainCommandService;

	/** 기존 호환 메서드(키워드만) — 내부적으로 새 메서드 호출 */
	@Override
	public Page<RestaurantSummaryResponse> searchByKeyword(String query, Pageable pageable) {
		RestaurantSearchRequest req = new RestaurantSearchRequest(query, null, null, null, null, null, null);
		return search(req, pageable);
	}

	/** 새 검색(필터/반경) */
	public Page<RestaurantSummaryResponse> search(RestaurantSearchRequest req, Pageable pageable) {

		boolean hasGeo = req.lat() != null && req.lng() != null && req.meters() != null;

		// 1) 반경 검색이 있으면: 거리 정렬 네이티브 먼저 → 이후 나머지 필터는 in-memory 필터링
		if (hasGeo) {
			Page<Restaurant> page = restaurantRepository.findNearestWithinMeters(
					req.lng(), req.lat(), req.meters(), pageable
			);

			List<Restaurant> filtered = page.getContent().stream()
					.filter(inMemoryFilter(req))
					.collect(Collectors.toList());

			List<RestaurantSummaryResponse> mapped = filtered.stream()
					.map(RestaurantConverter::toSummary)
					.collect(Collectors.toList());

			// countQuery는 반경 내 전체이므로, 추가 필터 반영해 total 재계산
			long totalWithFilters = page.get()
					.filter(inMemoryFilter(req))
					.count();

			return new PageImpl<>(mapped, pageable, totalWithFilters);
		}

		// 2) 일반 검색: JPA Specification(쿼리 레벨에서 필터 적용)
		Specification<Restaurant> spec = (root, query, cb) -> {
			List<Predicate> predicates = new ArrayList<>();

			// 텍스트 검색: name/address/category1~3
			if (req.query() != null && !req.query().isBlank()) {
				String q = "%" + req.query().toLowerCase() + "%";
				predicates.add(
						cb.or(
								cb.like(cb.lower(root.get("name")), q),
								cb.like(cb.lower(root.get("address")), q),
								cb.like(cb.lower(root.get("category1")), q),
								cb.like(cb.lower(root.get("category2")), q),
								cb.like(cb.lower(root.get("category3")), q)
						)
				);
			}

			// 가격대
			if (req.priceRange() != null) {
				predicates.add(cb.equal(root.get("priceRange"), req.priceRange()));
			}

			// 영업 상태
			if (req.openStatus() != null) {
				predicates.add(cb.equal(root.get("openStatus"), req.openStatus()));
			}

			// 태그(부분일치) — tags가 TEXT/JSON 문자열이라 가정
			if (req.tag() != null && !req.tag().isBlank()) {
				predicates.add(cb.like(cb.lower(root.get("tags")), "%" + req.tag().toLowerCase() + "%"));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		Page<Restaurant> page = restaurantRepository.findAll(spec, pageable);
		return page.map(RestaurantConverter::toSummary);
	}

	/** In-memory 필터링 (반경 검색 시 사용) */
	private java.util.function.Predicate<Restaurant> inMemoryFilter(RestaurantSearchRequest req) {
		return r -> {
			// 가격대
			if (req.priceRange() != null && req.priceRange() != r.getPriceRange()) return false;
			// 영업 상태
			if (req.openStatus() != null && req.openStatus() != r.getOpenStatus()) return false;
			// 태그
			if (req.tag() != null && !req.tag().isBlank()) {
				String tags = r.getTags() == null ? "" : r.getTags().toLowerCase();
				if (!tags.contains(req.tag().toLowerCase())) return false;
			}
			// 텍스트 검색(거리모드에서도 허용)
			if (req.query() != null && !req.query().isBlank()) {
				String q = req.query().toLowerCase();
				String n = safe(r.getName());
				String a = safe(r.getAddress());
				String c1 = safe(r.getCategory1());
				String c2 = safe(r.getCategory2());
				String c3 = safe(r.getCategory3());
				if (!(n.contains(q) || a.contains(q) || c1.contains(q) || c2.contains(q) || c3.contains(q))) return false;
			}
			return true;
		};
	}

	private String safe(String s) {
		return s == null ? "" : s.toLowerCase();
	}

	@Override
	@Transactional
	public RestaurantDetailResponse getDetail(Long restaurantId, Long userId) {
		// ✅ userId가 있을 때만 개인화 뷰/선호도 갱신
		if (userId != null) {
			mainCommandService.handleView(restaurantId, userId);
		} else {
			// (선택) 비회원 조회 시 전역 view_count 증가만 수행하고 싶다면 여기에 추가
			// restaurantRepository.increaseGlobalViewCount(restaurantId);
		}

		Restaurant restaurant = restaurantRepository.findByIdWithHours(restaurantId)
				.orElseThrow(() -> new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT));

		return RestaurantConverter.toDetail(restaurant);
	}


	@Override
	@Transactional
	public RestaurantShareResponse getShare(Long restaurantId, Long userId) {
		mainCommandService.handleShare(restaurantId, userId);

		Restaurant restaurant = restaurantRepository.findById(restaurantId)
				.orElseThrow(() -> new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT));

		return RestaurantConverter.toShare(restaurant);
	}

	@Override
	public Page<RestaurantBookmarkResponse> getBookmarks(Long userId, Pageable pageable) {
		Page<Restaurant> bookmarkedRestaurants = restaurantRepository.findBookmarkedByUserId(userId, pageable);

		return bookmarkedRestaurants.map(restaurant -> {
			Long savedCount = restaurantRepository.countSavedUsersByRestaurantId(restaurant.getId());
			return RestaurantConverter.toBookmark(restaurant, savedCount);
		});
	}
}
