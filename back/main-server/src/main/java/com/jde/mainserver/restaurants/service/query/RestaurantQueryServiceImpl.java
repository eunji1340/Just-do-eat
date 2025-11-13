/**
 * restaurants/service/query/RestaurantQueryServiceImpl.java
 * 식당 Query 서비스 구현체
 * Author: Kim
 * Date: 2025-11-09
 */

package com.jde.mainserver.restaurants.service.query;

import com.jde.mainserver.main.converter.MainConverter;
import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.main.service.command.MainCommandService;
import com.jde.mainserver.restaurants.converter.RestaurantConverter;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.entity.RestaurantHour;
import com.jde.mainserver.restaurants.exception.RestaurantErrorCode;
import com.jde.mainserver.restaurants.exception.RestaurantException;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.converter.CategoryMapper;
import com.jde.mainserver.restaurants.service.OpenStatusUtil;
import com.jde.mainserver.restaurants.web.dto.request.RestaurantSearchRequest;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;

import lombok.RequiredArgsConstructor;

import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantQueryServiceImpl implements RestaurantQueryService {

	private final RestaurantRepository restaurantRepository;
	private final MainCommandService mainCommandService;

	/** 식당 검색 (필터/반경 포함, 키워드만 있어도 검색 가능) */
	@Override
	public Page<RestaurantSummaryResponse> search(RestaurantSearchRequest req, Pageable pageable) {

		boolean hasGeo = req.lat() != null && req.lng() != null && req.meters() != null;
		boolean hasQuery = req.query() != null && !req.query().isBlank();
		boolean hasFilter = req.priceRange() != null || req.tag() != null || req.openStatus() != null;

		// ⭐ 검색 조건이 하나도 없으면 빈 결과 반환
		if (!hasGeo && !hasQuery && !hasFilter) {
			return Page.empty(pageable);
		}

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

			// 태그(부분일치) — tags가 TEXT/JSON 문자열이라 가정
			if (req.tag() != null && !req.tag().isBlank()) {
				predicates.add(cb.like(cb.lower(root.get("tags")), "%" + req.tag().toLowerCase() + "%"));
			}

			// ⭐ predicates가 비어있으면 항상 false 반환 (빈 결과)
			if (predicates.isEmpty()) {
				return cb.disjunction(); // WHERE 1=0과 동일
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		Page<Restaurant> page = restaurantRepository.findAll(spec, pageable);

		// openStatus 필터링이 있으면 in-memory 필터링 적용 (@Transient 필드이므로)
		if (req.openStatus() != null) {
			List<Restaurant> filtered = page.getContent().stream()
					.filter(r -> r.getOpenStatus() == req.openStatus())
					.collect(Collectors.toList());

			List<RestaurantSummaryResponse> mapped = filtered.stream()
					.map(RestaurantConverter::toSummary)
					.collect(Collectors.toList());

			// total 재계산
			long totalWithOpenStatus = page.get()
					.filter(r -> r.getOpenStatus() == req.openStatus())
					.count();

			return new PageImpl<>(mapped, pageable, totalWithOpenStatus);
		}

		return page.map(RestaurantConverter::toSummary);
	}

	/** In-memory 필터링 (반경 검색 시 사용) */
	private java.util.function.Predicate<Restaurant> inMemoryFilter(RestaurantSearchRequest req) {
		return r -> {
			// 가격대
			if (req.priceRange() != null && req.priceRange() != r.getPriceRange())
				return false;
			// 영업 상태
			if (req.openStatus() != null && req.openStatus() != r.getOpenStatus())
				return false;

			// 텍스트 검색(거리모드에서도 허용)
			if (req.query() != null && !req.query().isBlank()) {
				String q = req.query().toLowerCase();
				String n = safe(r.getName());
				String a = safe(r.getAddress());
				String c1 = safe(r.getCategory1());
				String c2 = safe(r.getCategory2());
				String c3 = safe(r.getCategory3());
				if (!(n.contains(q) || a.contains(q) || c1.contains(q) || c2.contains(q) || c3.contains(q)))
					return false;
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
		if (userId != null) {
			mainCommandService.handleView(restaurantId, userId);
		}

		Restaurant restaurant = restaurantRepository.findByIdWithHours(restaurantId)
				.orElseThrow(() -> new RestaurantException(RestaurantErrorCode.NOT_FOUND_RESTAURANT));

		return RestaurantConverter.toDetail(restaurant);
	}

	@Override
	public RestaurantShareResponse getShare(Long restaurantId, Long userId) {
		if (userId != null) {
			mainCommandService.handleShare(restaurantId, userId);
		}

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

	@Override
	public List<RestaurantSummaryResponse> getPopularRestaurantsTop10(double lng, double lat) {
		double[] radiusSteps = {700, 1000, 1500, 2000, 3000};
		final int targetCount = 10;

		List<Restaurant> restaurants = null;
		for (double radius : radiusSteps) {
			restaurants = restaurantRepository.findPopularRestaurantsByLocationOptionalCategory(
					lng, lat, radius, targetCount, false, List.of("__DUMMY__"));

			if (restaurants != null && restaurants.size() >= targetCount) {
				break;
			}
		}

		// 결과가 없으면 빈 리스트 반환
		if (restaurants == null || restaurants.isEmpty()) {
			return List.of();
		}

		// 람다에서 사용하기 위해 final 변수로 복사
		final List<Restaurant> finalRestaurants = restaurants;
		int size = Math.min(finalRestaurants.size(), targetCount);
		return IntStream.range(0, size)
				.mapToObj(i -> RestaurantConverter.toSummary(finalRestaurants.get(i)))
				.filter(Objects::nonNull)
				.toList();
	}

	@Override
	public FeedResponse getPopularRestaurantsByCategory(double lng, double lat, String category, String cursor) {
		double[] radiusSteps = {700, 1000, 1500, 2000, 3000};
		final int minCount = 10;
		final int batchSize = 10;
		final int maxLimit = 100;

		List<String> category2List = CategoryMapper.getCategory2List(category);
		if (category2List.isEmpty()) {
			return new FeedResponse(List.of(), null);
		}

		// 커서 파싱
		int offset = 0;
		if (cursor != null && !cursor.trim().isEmpty() && !cursor.trim().equals("0")) {
			try {
				offset = Math.max(0, Integer.parseInt(cursor.trim()));
			} catch (NumberFormatException e) {
				offset = 0;
			}
		}

		// 첫 요청인 경우 반경 확장, 다음 페이지는 최대 반경 사용
		List<Restaurant> allRestaurants = null;
		if (offset == 0) {
			for (double radius : radiusSteps) {
				allRestaurants = restaurantRepository.findPopularRestaurantsByLocationOptionalCategory(
						lng, lat, radius, maxLimit, true, category2List);

				if (allRestaurants != null && allRestaurants.size() >= minCount) {
					break;
				}
			}
		} else {
			allRestaurants = restaurantRepository.findPopularRestaurantsByLocationOptionalCategory(
					lng, lat, radiusSteps[radiusSteps.length - 1], maxLimit, true, category2List);
		}

		// 결과가 없으면 빈 리스트 반환
		if (allRestaurants == null || allRestaurants.isEmpty()) {
			return new FeedResponse(List.of(), null);
		}

		// 람다에서 사용하기 위해 final 변수로 복사
		final List<Restaurant> finalRestaurants = allRestaurants;

		// 배치 추출
		int startIdx = offset;
		int endIdx = Math.min(startIdx + batchSize, finalRestaurants.size());

		if (startIdx >= finalRestaurants.size()) {
			return new FeedResponse(List.of(), null);
		}

		// 식당 ID 목록 추출
		List<Long> batchRestaurantIds = IntStream.range(startIdx, endIdx)
				.mapToObj(i -> finalRestaurants.get(i).getId())
				.toList();

		// 식당 정보 조회 (hours 포함)
		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdIn(batchRestaurantIds).stream()
				.collect(Collectors.toMap(Restaurant::getId, r -> r));

		// 영업시간 맵 생성
		Map<Long, List<RestaurantHour>> hoursMap = restaurantMap.values().stream()
				.filter(r -> r.getHours() != null && !r.getHours().isEmpty())
				.collect(Collectors.toMap(Restaurant::getId, Restaurant::getHours));

		// 현재 배치의 식당들 변환 (FeedResponse 형식)
		List<FeedResponse.RestaurantItem> feedItems = IntStream.range(startIdx, endIdx)
				.mapToObj(i -> {
					Long restaurantId = finalRestaurants.get(i).getId();
					Restaurant restaurant = restaurantMap.get(restaurantId);
					if (restaurant == null) {
						return null;
					}

					// 거리 계산
					Point restaurantPoint = restaurant.getGeom();
					Integer distanceM = restaurantPoint != null
							? calculateDistance(lat, lng, restaurantPoint)
							: null;

					// 영업 상태 계산
					Boolean isOpen = calculateOpenStatus(restaurant.getId(), hoursMap);

					return MainConverter.toFeedItem(restaurant, distanceM, isOpen, null);
				})
				.filter(Objects::nonNull)
				.toList();

		// 다음 커서 생성
		String nextCursor = endIdx < finalRestaurants.size() ? String.valueOf(endIdx) : null;
		return new FeedResponse(feedItems, nextCursor);
	}

	/**
	 * 두 지점 간 거리 계산 (미터 단위)
	 */
	private Integer calculateDistance(double lat, double lng, Point restaurantPoint) {
		if (restaurantPoint == null) {
			return null;
		}

		double lat2 = restaurantPoint.getY(); // 위도
		double lng2 = restaurantPoint.getX(); // 경도

		double dLat = Math.toRadians(lat2 - lat);
		double dLng = Math.toRadians(lng2 - lng);

		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
				+ Math.cos(Math.toRadians(lat)) * Math.cos(Math.toRadians(lat2))
				* Math.sin(dLng / 2) * Math.sin(dLng / 2);

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		final double EARTH_RADIUS_M = 6371000; // 지구 반지름 (미터)
		return (int)(EARTH_RADIUS_M * c);
	}

	/**
	 * 영업 상태 계산
	 */
	private Boolean calculateOpenStatus(Long restaurantId, Map<Long, List<RestaurantHour>> hoursMap) {
		try {
			List<RestaurantHour> hours = hoursMap.getOrDefault(restaurantId, Collections.emptyList());
			com.jde.mainserver.restaurants.entity.enums.OpenStatus status = OpenStatusUtil
					.calcStatus(hours, java.time.ZoneId.of("Asia/Seoul"));
			return status == com.jde.mainserver.restaurants.entity.enums.OpenStatus.OPEN;
		} catch (Exception e) {
			return false;
		}
	}
}