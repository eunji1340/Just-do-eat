/**
 * main/repository/CandidateRepository.java
 * 후보 식당 조회 Repository
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.repository;

import com.jde.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.entity.RestaurantHour;
import com.jde.mainserver.restaurants.entity.RestaurantTag;
import com.jde.mainserver.restaurants.repository.RestaurantHourRepository;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.repository.RestaurantTagRepository;
import com.jde.mainserver.main.entity.UserRestaurantState;
import com.jde.mainserver.restaurants.entity.enums.OpenStatus;

import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class CandidateRepository {

	private static final int DEFAULT_MAX_CANDIDATES = 200; // 후보 수 증가 (pref_score 반영을 위해)
	private static final int MAX_RADIUS_SEARCH = 200; // 반경 검색 시 최대 개수
	private static final double PREF_SCORE_THRESHOLD = -0.8; // 선호 점수 임계값 (이하 제외)
	private static final int EARTH_RADIUS_M = 6371000; // 지구 반지름 (미터)

	// 기본 위치: 서울 강남구 테헤란로 212
	private static final double DEFAULT_LAT = 37.5012767241426; // 위도
	private static final double DEFAULT_LNG = 127.039600248343; // 경도
	private static final double DEFAULT_RADIUS_M = 5000.0; // 기본 반경 5km

	private final RestaurantRepository restaurantRepository;
	private final RestaurantHourRepository restaurantHourRepository;
	private final RestaurantTagRepository restaurantTagRepository;
	private final UserRestaurantStateRepository userRestaurantStateRepository;

	public CandidateRepository(
		RestaurantRepository restaurantRepository,
		RestaurantHourRepository restaurantHourRepository,
		RestaurantTagRepository restaurantTagRepository,
		UserRestaurantStateRepository userRestaurantStateRepository
	) {
		this.restaurantRepository = restaurantRepository;
		this.restaurantHourRepository = restaurantHourRepository;
		this.restaurantTagRepository = restaurantTagRepository;
		this.userRestaurantStateRepository = userRestaurantStateRepository;
	}

	/**
	 * FastAPI 점수 엔진에 전달할 후보 식당 리스트 조회
	 *
	 * 처리 과정:
	 * 1. 반경 기반 식당 조회 (기본 위치: 서울 강남구 테헤란로 212 기준)
	 * 2. 사용자 선호도 기반 필터링 (최근 DISLIKE, 낮은 선호 점수 제외)
	 * 3. 영업시간, 태그, 거리 등 메타데이터 수집
	 * 4. Candidate DTO로 변환
	 *
	 * 위치 정보가 context에 없으면 기본 위치(서울 강남구 테헤란로 212)를 사용합니다.
	 *
	 * @param userId 사용자 ID (null이면 비회원)
	 * @param context 컨텍스트 정보 (lat, lng, radiusM, maxCandidates) - 없으면 기본값 사용
	 * @return 후보 식당 리스트
	 */
	public List<PersonalScoreRequest.Candidate> getCandidates(Long userId, Map<String, Object> context) {
		// 1. 파라미터 추출 (없으면 기본값 사용)
		final int maxCandidates = getInt(context, "maxCandidates", DEFAULT_MAX_CANDIDATES);
		final Double userLat = getDouble(context, "lat", DEFAULT_LAT);
		final Double userLng = getDouble(context, "lng", DEFAULT_LNG);
		final Double radiusM = getDouble(context, "radiusM", DEFAULT_RADIUS_M);

		// 2. 식당 조회: 반경 검색 우선, 없으면 일반 페이징
		final List<Restaurant> restaurants = fetchRestaurants(userLat, userLng, radiusM, maxCandidates);
		if (restaurants.isEmpty()) {
			return Collections.emptyList();
		}

		// 3. 사용자 상태 로딩 및 필터링 (userId가 null이면 생략)
		List<Long> restaurantIds = restaurants.stream().map(Restaurant::getId).toList();
		Map<Long, UserRestaurantState> stateMap = userId != null
			? loadUserStates(userId, restaurantIds)
			: Collections.emptyMap();

		if (userId != null) {
			filterByUserPreference(restaurants, stateMap);
		}

		// 필터링 후 재계산
		restaurantIds = restaurants.stream().map(Restaurant::getId).toList();
		if (restaurantIds.isEmpty()) {
			return Collections.emptyList();
		}

		// 4. 벌크 로딩: 영업시간, 태그
		Map<Long, List<RestaurantHour>> hoursMap = loadRestaurantHours(restaurantIds);
		Map<Long, List<RestaurantTag>> tagsByRestaurant = loadRestaurantTags(restaurantIds);

		// 5. Candidate 변환
		return convertToCandidates(restaurants, stateMap, hoursMap, tagsByRestaurant, userLat, userLng);
	}

	/**
	 * 식당 조회 (반경 기반 검색, 거리순 정렬)
	 */
	private List<Restaurant> fetchRestaurants(Double userLat, Double userLng, Double radiusM, int maxCandidates) {
		// 반경 기반 검색 (거리순 정렬)
		Pageable pageable = PageRequest.of(0, Math.min(maxCandidates, MAX_RADIUS_SEARCH));
		Page<Restaurant> page = restaurantRepository.findNearestWithinMeters(
			userLng, userLat, radiusM, pageable
		);
		// 가변 리스트로 변환 (필터링을 위해)
		return new ArrayList<>(page.getContent());
	}

	/**
	 * 사용자 식당 상태 로딩
	 */
	private Map<Long, UserRestaurantState> loadUserStates(long userId, List<Long> restaurantIds) {
		List<UserRestaurantState> states = userRestaurantStateRepository
			.findById_UserIdAndId_RestaurantIdIn(userId, restaurantIds);
		return states.stream()
			.collect(Collectors.toMap(s -> s.getId().getRestaurantId(), s -> s));
	}

	/**
	 * 사용자 선호도 기반 필터링
	 *
	 * 제외 조건:
	 * - 쿨다운 기간 내인 식당 (cooldownUntil > 현재 시각)
	 * - 선호 점수가 -0.8 이하인 식당
	 */
	private void filterByUserPreference(List<Restaurant> restaurants, Map<Long, UserRestaurantState> stateMap) {
		java.time.Instant now = java.time.Instant.now();

		restaurants.removeIf(r -> {
			UserRestaurantState state = stateMap.get(r.getId());
			if (state == null) {
				return false; // 상태가 없으면 포함
			}

			// 쿨다운 기간 체크 (cooldownUntil이 현재보다 미래면 제외)
			boolean inCooldown = state.getCooldownUntil() != null
				&& state.getCooldownUntil().isAfter(now);

			// 낮은 선호 점수 체크
			boolean lowPref = state.getPrefScore() != null
				&& state.getPrefScore().doubleValue() <= PREF_SCORE_THRESHOLD;

			return inCooldown || lowPref;
		});
	}

	/**
	 * 식당별 영업시간 벌크 로딩
	 */
	private Map<Long, List<RestaurantHour>> loadRestaurantHours(List<Long> restaurantIds) {
		return restaurantHourRepository
			.findByRestaurant_IdIn(restaurantIds)
			.stream()
			.collect(Collectors.groupingBy(h -> h.getRestaurant().getId()));
	}

	/**
	 * 식당별 태그 벌크 로딩
	 */
	private Map<Long, List<RestaurantTag>> loadRestaurantTags(List<Long> restaurantIds) {
		return restaurantTagRepository
			.findByRestaurantIdIn(restaurantIds)
			.stream()
			.collect(Collectors.groupingBy(RestaurantTag::getRestaurantId));
	}

	/**
	 * Restaurant 엔티티를 Candidate DTO로 변환
	 */
	private List<PersonalScoreRequest.Candidate> convertToCandidates(
		List<Restaurant> restaurants,
		Map<Long, UserRestaurantState> stateMap,
		Map<Long, List<RestaurantHour>> hoursMap,
		Map<Long, List<RestaurantTag>> tagsByRestaurant,
		Double userLat,
		Double userLng
	) {
		return restaurants.stream().map(r -> {
			// 거리 계산 (사용자 위치가 있는 경우)
			Float distanceM = calculateDistance(userLat, userLng, r.getGeom());

			// 영업 상태 계산
			Boolean isOpen = calculateOpenStatus(r.getId(), hoursMap);

			// 가격대: enum name 그대로 전달 ("LOW", "MEDIUM", "HIGH", "PREMIUM")
			String priceRange = r.getPriceRange() != null ? r.getPriceRange().name() : null;

			// 태그 선호도 맵 (restaurant_tag.weight, confidence 사용)
			Map<Long, PersonalScoreRequest.TagPreference> tagPref = buildTagPreferenceMap(
				tagsByRestaurant.getOrDefault(r.getId(), Collections.emptyList())
			);

			// 개인 선호 점수 (UserRestaurantState.pref_score)
			Float prefScore = extractPrefScore(stateMap.get(r.getId()));

			return new PersonalScoreRequest.Candidate(
				r.getId(),
				tagPref,
				distanceM,
				isOpen,
				priceRange,
				prefScore
			);
		}).toList();
	}

	/**
	 * 두 지점 간 거리 계산 (Haversine 공식, 미터 단위)
	 *
	 * @param userLat 사용자 위도
	 * @param userLng 사용자 경도
	 * @param restaurantPoint 식당 좌표 (Point: x=경도, y=위도)
	 * @return 거리(미터), 계산 불가 시 null
	 */
	private Float calculateDistance(Double userLat, Double userLng, Point restaurantPoint) {
		if (userLat == null || userLng == null || restaurantPoint == null) {
			return null;
		}

		double lat2 = restaurantPoint.getY(); // 위도
		double lng2 = restaurantPoint.getX(); // 경도

		double dLat = Math.toRadians(lat2 - userLat);
		double dLng = Math.toRadians(lng2 - userLng);

		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
			+ Math.cos(Math.toRadians(userLat)) * Math.cos(Math.toRadians(lat2))
			* Math.sin(dLng / 2) * Math.sin(dLng / 2);

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return (float)(EARTH_RADIUS_M * c);
	}

	/**
	 * 영업 상태 계산 (OpenStatusUtil 사용)
	 */
	private Boolean calculateOpenStatus(Long restaurantId, Map<Long, List<RestaurantHour>> hoursMap) {
		try {
			List<RestaurantHour> hours = hoursMap.getOrDefault(restaurantId, Collections.emptyList());
			OpenStatus status = com.jde.mainserver.restaurants.service.OpenStatusUtil
				.calcStatus(hours, java.time.ZoneId.of("Asia/Seoul"));
			return status == OpenStatus.OPEN;
		} catch (Exception e) {
			// 영업시간 계산 실패 시 안전하게 false 반환
			return false;
		}
	}

	/**
	 * RestaurantTag 리스트를 TagPreference 맵으로 변환
	 * (restaurant_tag.weight, confidence 사용)
	 */
	private Map<Long, PersonalScoreRequest.TagPreference> buildTagPreferenceMap(
		List<RestaurantTag> restaurantTags
	) {
		return restaurantTags.stream()
			.collect(Collectors.toMap(
				RestaurantTag::getTagId,
				rt -> new PersonalScoreRequest.TagPreference(
					rt.getWeight().floatValue(),
					rt.getConfidence().floatValue()
				)
			));
	}

	/**
	 * 사용자 선호 점수 추출
	 */
	private Float extractPrefScore(UserRestaurantState state) {
		if (state == null || state.getPrefScore() == null) {
			return null;
		}
		return state.getPrefScore().floatValue();
	}

	/**
	 * 컨텍스트에서 정수 값 추출
	 */
	private static Integer getInt(Map<String, Object> ctx, String key, Integer def) {
		if (ctx == null) {
			return def;
		}
		Object v = ctx.get(key);
		return (v instanceof Number) ? ((Number)v).intValue() : def;
	}

	/**
	 * 컨텍스트에서 실수 값 추출
	 */
	private static Double getDouble(Map<String, Object> ctx, String key, Double def) {
		if (ctx == null) {
			return def;
		}
		Object v = ctx.get(key);
		if (v == null) {
			return def;
		}
		if (v instanceof Number) {
			return ((Number)v).doubleValue();
		}
		return def;
	}
}
