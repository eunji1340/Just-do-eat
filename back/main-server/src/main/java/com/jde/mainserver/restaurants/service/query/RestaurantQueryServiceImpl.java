/**
 * restaurants/service/query/RestaurantQueryServiceImpl.java
 * 식당 Query 서비스 구현체
 * Author: Kim
 * Date: 2025-11-09 (updated 2025-11-14)
 */

package com.jde.mainserver.restaurants.service.query;

import com.jde.mainserver.main.converter.MainConverter;
import com.jde.mainserver.main.service.command.MainCommandService;
import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.restaurants.converter.CategoryMapper;
import com.jde.mainserver.restaurants.converter.RestaurantConverter;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.entity.RestaurantHour;
import com.jde.mainserver.restaurants.exception.RestaurantErrorCode;
import com.jde.mainserver.restaurants.exception.RestaurantException;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.service.OpenStatusUtil;
import com.jde.mainserver.restaurants.web.dto.request.RestaurantSearchRequest;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantBookmarkResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantDetailResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantShareResponse;
import com.jde.mainserver.restaurants.web.dto.response.RestaurantSummaryResponse;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantQueryServiceImpl implements RestaurantQueryService {

	private final RestaurantRepository restaurantRepository;
	private final MainCommandService mainCommandService;

	/**
	 * 식당 검색 (필터/반경 포함, 키워드만 있어도 검색 가능)
	 * - currentUserId가 null이 아니면 북마크 여부(bookmarked)도 함께 세팅
	 */
	@Override
	public Page<RestaurantSummaryResponse> search(RestaurantSearchRequest req, Pageable pageable, Long currentUserId) {

		boolean hasGeo = req.lat() != null && req.lng() != null && req.meters() != null;
		boolean hasQuery = req.query() != null && !req.query().isBlank();
		boolean hasFilter = req.priceRange() != null || req.tag() != null || req.openStatus() != null;

		System.out.println("[search] currentUserId = " + currentUserId);

		// 검색 조건이 하나도 없으면 빈 결과
		if (!hasGeo && !hasQuery && !hasFilter) {
			return Page.empty(pageable);
		}

		// 1) 반경 검색이 있는 경우: 거리 정렬 후 in-memory 필터링
		if (hasGeo) {
			Page<Restaurant> page = restaurantRepository.findNearestWithinMeters(
					req.lng(), req.lat(), req.meters(), pageable
			);

			List<Restaurant> filtered = page.getContent().stream()
					.filter(inMemoryFilter(req))
					.toList();

			List<RestaurantSummaryResponse> mapped = mapWithBookmark(filtered, currentUserId);

			long totalWithFilters = page.get()
					.filter(inMemoryFilter(req))
					.count();

			return new PageImpl<>(mapped, pageable, totalWithFilters);
		}

		// 2) 일반 검색: JPA Specification
		Specification<Restaurant> spec = (root, query, cb) -> {
			List<Predicate> predicates = new ArrayList<>();

			// 텍스트 검색
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

			// 태그
			if (req.tag() != null && !req.tag().isBlank()) {
				predicates.add(cb.like(cb.lower(root.get("tags")), "%" + req.tag().toLowerCase() + "%"));
			}

			// 조건 없으면 빈 결과
			if (predicates.isEmpty()) {
				return cb.disjunction();
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};

		Page<Restaurant> page = restaurantRepository.findAll(spec, pageable);

		// 영업 상태 필터 in-memory
		if (req.openStatus() != null) {
			List<Restaurant> filtered = page.getContent().stream()
					.filter(r -> r.getOpenStatus() == req.openStatus())
					.toList();

			List<RestaurantSummaryResponse> mapped = mapWithBookmark(filtered, currentUserId);

			long total = page.get()
					.filter(r -> r.getOpenStatus() == req.openStatus())
					.count();

			return new PageImpl<>(mapped, pageable, total);
		}

		// 기본 케이스
		List<RestaurantSummaryResponse> mapped = mapWithBookmark(page.getContent(), currentUserId);
		return new PageImpl<>(mapped, pageable, page.getTotalElements());
	}

	/** In-memory 필터링 (반경 검색 시 사용) */
	private java.util.function.Predicate<Restaurant> inMemoryFilter(RestaurantSearchRequest req) {
		return r -> {
			if (req.priceRange() != null && req.priceRange() != r.getPriceRange())
				return false;
			if (req.openStatus() != null && req.openStatus() != r.getOpenStatus())
				return false;

			if (req.query() != null && !req.query().isBlank()) {
				String q = req.query().toLowerCase();
				if (!(safe(r.getName()).contains(q)
						|| safe(r.getAddress()).contains(q)
						|| safe(r.getCategory1()).contains(q)
						|| safe(r.getCategory2()).contains(q)
						|| safe(r.getCategory3()).contains(q))) {
					return false;
				}
			}
			return true;
		};
	}

	private String safe(String s) {
		return s == null ? "" : s.toLowerCase();
	}

	/**
	 * Restaurant 리스트 → RestaurantSummaryResponse 변환 + 북마크 여부 결정
	 * 🔥 디버그 로그 포함
	 */
	private List<RestaurantSummaryResponse> mapWithBookmark(List<Restaurant> restaurants, Long userId) {
		if (restaurants == null || restaurants.isEmpty()) {
			return List.of();
		}

		List<Long> restaurantIds = restaurants.stream()
				.map(Restaurant::getId)
				.toList();

		System.out.println("[mapWithBookmark] userId=" + userId +
				" | restaurantIds=" + restaurantIds);

		Set<Long> bookmarkedIds = new HashSet<>();

		if (userId != null) {
			List<Long> savedIds =
					restaurantRepository.findSavedRestaurantIdsByUserIdAndRestaurantIds(userId, restaurantIds);

			System.out.println("[mapWithBookmark] savedIds from DB = " + savedIds);

			bookmarkedIds.addAll(savedIds);
		}

		return restaurants.stream()
				.map(r -> {
					RestaurantSummaryResponse dto = RestaurantConverter.toSummary(r);
					boolean isBookmarked = userId != null && bookmarkedIds.contains(r.getId());

					if (isBookmarked) {
						System.out.println("[mapWithBookmark] TRUE → restaurantId=" + r.getId());
					}

					dto.setBookmarked(isBookmarked);
					return dto;
				})
				.toList();
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

		if (restaurants == null || restaurants.isEmpty()) {
			return List.of();
		}

		final List<Restaurant> finalRestaurants = restaurants;
		int size = Math.min(finalRestaurants.size(), targetCount);

		// 인기 Top10은 일단 북마크 여부 없이 summary만 반환 (필요하면 userId 인자 추가해서 확장)
		return IntStream.range(0, size)
				.mapToObj(finalRestaurants::get)
				.map(RestaurantConverter::toSummary)
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

		int offset = 0;
		if (cursor != null && !cursor.trim().isEmpty() && !cursor.equals("0")) {
			try {
				offset = Math.max(0, Integer.parseInt(cursor.trim()));
			} catch (NumberFormatException ignored) {}
		}

		List<Restaurant> allRestaurants = null;

		// 첫 요청: 반경 확장하면서 최소 개수 확보
		if (offset == 0) {
			for (double radius : radiusSteps) {
				allRestaurants = restaurantRepository.findPopularRestaurantsByLocationOptionalCategory(
						lng, lat, radius, maxLimit, true, category2List);

				if (allRestaurants != null && allRestaurants.size() >= minCount) {
					break;
				}
			}
		} else {
			// 다음 페이지: 최대 반경 그대로 사용
			allRestaurants = restaurantRepository.findPopularRestaurantsByLocationOptionalCategory(
					lng, lat, radiusSteps[radiusSteps.length - 1], maxLimit, true, category2List);
		}

		if (allRestaurants == null || allRestaurants.isEmpty()) {
			return new FeedResponse(List.of(), null);
		}

		// 🔹 람다 캡처용 final 리스트
		final List<Restaurant> finalAllRestaurants = allRestaurants;

		int startIdx = offset;
		int endIdx = Math.min(startIdx + batchSize, finalAllRestaurants.size());

		if (startIdx >= finalAllRestaurants.size()) {
			return new FeedResponse(List.of(), null);
		}

		// 식당 ID 목록
		List<Long> ids = IntStream.range(startIdx, endIdx)
				.mapToObj(i -> finalAllRestaurants.get(i).getId())
				.toList();

		// 식당 정보 (hours 포함) 조회
		Map<Long, Restaurant> restaurantMap =
				restaurantRepository.findAllByIdIn(ids).stream()
						.collect(Collectors.toMap(Restaurant::getId, r -> r));

		// 영업시간 맵 생성
		Map<Long, List<RestaurantHour>> hoursMap =
				restaurantMap.values().stream()
						.filter(r -> r.getHours() != null && !r.getHours().isEmpty())
						.collect(Collectors.toMap(Restaurant::getId, Restaurant::getHours));

		// 배치 변환
		List<FeedResponse.RestaurantItem> feedItems =
				IntStream.range(startIdx, endIdx)
						.mapToObj(i -> {
							Long id = finalAllRestaurants.get(i).getId();
							Restaurant r = restaurantMap.get(id);
							if (r == null) {
								return null;
							}

							// 거리 계산
							Point p = r.getGeom();
							Integer dist = (p != null) ? calculateDistance(lat, lng, p) : null;

							// 영업 상태 계산
							Boolean isOpen = calculateOpenStatus(id, hoursMap);

							return MainConverter.toFeedItem(r, dist, isOpen, null);
						})
						.filter(Objects::nonNull)
						.toList();

		String nextCursor = endIdx < finalAllRestaurants.size() ? String.valueOf(endIdx) : null;
		return new FeedResponse(feedItems, nextCursor);
	}

	/** 두 지점 간 거리 계산 (미터 단위) */
	private Integer calculateDistance(double lat, double lng, Point pt) {
		if (pt == null) return null;

		double lat2 = pt.getY();
		double lng2 = pt.getX();

		double dLat = Math.toRadians(lat2 - lat);
		double dLng = Math.toRadians(lng2 - lng);

		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
				+ Math.cos(Math.toRadians(lat)) * Math.cos(Math.toRadians(lat2))
				* Math.sin(dLng / 2) * Math.sin(dLng / 2);

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		final double R = 6371000; // 지구 반지름 (m)
		return (int) (R * c);
	}

	/** 영업 상태 계산 */
	private Boolean calculateOpenStatus(Long restaurantId, Map<Long, List<RestaurantHour>> hoursMap) {
		try {
			List<RestaurantHour> hours = hoursMap.getOrDefault(restaurantId, List.of());
			return OpenStatusUtil.calcStatus(hours, java.time.ZoneId.of("Asia/Seoul"))
					== com.jde.mainserver.restaurants.entity.enums.OpenStatus.OPEN;
		} catch (Exception e) {
			return false;
		}
	}
}
