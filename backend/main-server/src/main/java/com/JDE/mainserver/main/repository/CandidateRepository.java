/**
 * main/repository/CandidateRepository.java
 * 후보 식당 생성
 * Author: Jang
 * Date: 2025-11-04
 *
 */

package com.JDE.mainserver.main.repository;

import com.JDE.mainserver.main.service.query.CandidateRetrievalService;
import com.JDE.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.JDE.mainserver.restaurants.entity.Restaurant;
import com.JDE.mainserver.restaurants.entity.RestaurantHour;
import com.JDE.mainserver.restaurants.entity.RestaurantTag;
import com.JDE.mainserver.restaurants.repository.RestaurantHourRepository;
import com.JDE.mainserver.restaurants.repository.RestaurantRepository;
import com.JDE.mainserver.restaurants.repository.RestaurantTagRepository;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class CandidateRepository implements CandidateRetrievalService {

	private final RestaurantRepository restaurantRepository;
	private final RestaurantHourRepository restaurantHourRepository;
	private final RestaurantTagRepository restaurantTagRepository;

	public CandidateRepository(
		RestaurantRepository restaurantRepository,
		RestaurantHourRepository restaurantHourRepository,
		RestaurantTagRepository restaurantTagRepository
	) {
		this.restaurantRepository = restaurantRepository;
		this.restaurantHourRepository = restaurantHourRepository;
		this.restaurantTagRepository = restaurantTagRepository;
	}

	@Override
	public List<PersonalScoreRequest.Candidate> getCandidates(long userId, Map<String, Object> context) {
		// 0) 파라미터
		final int maxCandidates = getInt(context, "maxCandidates", 100);
		final Double userLat = getDouble(context, "lat", null);
		final Double userLng = getDouble(context, "lng", null);
		final Double radiusM = getDouble(context, "radiusM", null); // 반경(미터)

		// 1) 식당 조회: 반경 검색 우선, 없으면 일반 페이징
		final List<Restaurant> restaurants;
		if (userLat != null && userLng != null && radiusM != null && radiusM > 0) {
			Pageable pageable = PageRequest.of(0, Math.min(maxCandidates, 200));
			Page<Restaurant> page = restaurantRepository.findNearestWithinMeters(
				userLng, userLat, radiusM, pageable
			);
			restaurants = page.getContent();
		} else {
			Pageable pageable = PageRequest.of(0, maxCandidates);
			restaurants = restaurantRepository.findAll(pageable).getContent();
		}
		if (restaurants.isEmpty()) return Collections.emptyList();

		// 2) 벌크로 hours 로딩 → OPEN 계산용
		List<Long> restaurantIds = restaurants.stream().map(Restaurant::getId).toList();
		Map<Long, List<RestaurantHour>> hoursMap = restaurantHourRepository
			.findByRestaurant_IdIn(restaurantIds)
			.stream()
			.collect(Collectors.groupingBy(h -> h.getRestaurant().getId()));

		// 3) 벌크로 식당별 태그 로딩 → 점수 엔진에 넘길 tagPref 구성
		Map<Long, List<RestaurantTag>> tagsByRestaurant = restaurantTagRepository
			.findByRestaurantIdIn(restaurantIds)
			.stream()
			.collect(Collectors.groupingBy(RestaurantTag::getRestaurantId));

		// 5) Candidate 변환
		return restaurants.stream().map(r -> {
			// 거리(있으면)
			Float distanceM = (userLat != null && userLng != null && r.getGeom() != null)
				? calculateDistanceM(userLat, userLng, r.getGeom())
				: null;

			// OPEN 여부 (hoursMap 사용)
			boolean isOpen = false;
			try {
				List<RestaurantHour> hours = hoursMap.getOrDefault(r.getId(), Collections.emptyList());
				isOpen = com.JDE.mainserver.restaurants.service.OpenStatusUtil
					.calcStatus(hours, java.time.ZoneId.of("Asia/Seoul"))
					== Restaurant.OpenStatus.OPEN;
			} catch (Exception ignore) { /* 안전상 무시 */ }

			// 가격대 매핑: 0=0-1만, 1=1-2만, 2=2-3만, 3=3-4만+
			Integer priceRange = 0;
			if (r.getPriceRange() != null) {
				switch (r.getPriceRange()) {
					case LOW     -> priceRange = 0;
					case MEDIUM  -> priceRange = 1;
					case HIGH    -> priceRange = 2;
					case PREMIUM -> priceRange = 3;
				}
			}

			// 태그 가중치 → TagPreference 맵
			Map<Long, PersonalScoreRequest.TagPreference> tagPref =
				tagsByRestaurant.getOrDefault(r.getId(), Collections.emptyList())
					.stream()
					.collect(Collectors.toMap(
						RestaurantTag::getTagId,
						rt -> new PersonalScoreRequest.TagPreference(
							rt.getWeight().floatValue(),
							rt.getConfidence().floatValue()
						)
					));

			return new PersonalScoreRequest.Candidate(
				r.getId(),
				tagPref,
				distanceM,
				isOpen,
				priceRange
			);
		}).toList();
	}

	/** 두 지점 간 거리 계산 (미터) — Haversine */
	private Float calculateDistanceM(Double lat1, Double lng1, Point point2) {
		if (point2 == null || lat1 == null || lng1 == null) return null;

		double lat2 = point2.getY();
		double lng2 = point2.getX();
		final int R = 6371000;

		double dLat = Math.toRadians(lat2 - lat1);
		double dLng = Math.toRadians(lng2 - lng1);

		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
			+ Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
			* Math.sin(dLng / 2) * Math.sin(dLng / 2);

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return (float) (R * c);
	}

	private static Integer getInt(Map<String, Object> ctx, String key, Integer def) {
		if (ctx == null) return def;
		Object v = ctx.get(key);
		return (v instanceof Number) ? ((Number) v).intValue() : def;
	}

	private static Double getDouble(Map<String, Object> ctx, String key, Double def) {
		if (ctx == null) return def;
		Object v = ctx.get(key);
		if (v == null) return def;
		if (v instanceof Number) {
			return ((Number) v).doubleValue();
		}
		return def;
	}
}
