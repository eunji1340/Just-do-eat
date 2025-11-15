/**
 * plan/service/query/PlanQueryServiceImpl.java
 * 약속 Query 서비스 구현체
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.service.query;

import com.jde.mainserver.main.repository.UserTagPrefRepository;
import com.jde.mainserver.main.repository.UserRestaurantStateRepository;
import com.jde.mainserver.main.repository.http.ScoreEngineHttpClient;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.PlanCandidate;
import com.jde.mainserver.plan.entity.PlanParticipant;
import com.jde.mainserver.plan.entity.enums.PlanStatus;
import com.jde.mainserver.plan.repository.PlanCandidateRepository;
import com.jde.mainserver.plan.repository.PlanParticipantRepository;
import com.jde.mainserver.plan.repository.PlanRepository;
import com.jde.mainserver.plan.web.dto.request.GroupScoreReqeust;
import com.jde.mainserver.plan.web.dto.response.GroupScoreResponse;
import com.jde.mainserver.plan.web.dto.response.PlanCandidateResponse;
import com.jde.mainserver.plan.web.dto.response.PlanCreateResponse;
import com.jde.mainserver.restaurants.converter.RestaurantConverter;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.entity.RestaurantTag;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.repository.RestaurantTagRepository;
import com.jde.mainserver.restaurants.repository.RestaurantHourRepository;
import com.jde.mainserver.restaurants.entity.RestaurantHour;
import com.jde.mainserver.restaurants.entity.enums.OpenStatus;
import com.jde.mainserver.restaurants.service.OpenStatusUtil;

import lombok.RequiredArgsConstructor;

import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanQueryServiceImpl implements PlanQueryService {
	private static final String REDIS_KEY_PREFIX = "plan:pool:";
	private static final Duration CACHE_TTL = Duration.ofHours(1); // 캐시 유지 시간
	private static final int BATCH_SIZE = 8; // 배치 크기 (고정)

	private final PlanRepository planRepository;
	private final PlanParticipantRepository planParticipantRepository;
	private final PlanCandidateRepository planCandidateRepository;
	private final RestaurantRepository restaurantRepository;
	private final UserTagPrefRepository userTagPrefRepository;
	private final RestaurantTagRepository restaurantTagRepository;
	private final RestaurantHourRepository restaurantHourRepository;
	private final UserRestaurantStateRepository userRestaurantStateRepository;
	private final ScoreEngineHttpClient scoreEngineHttpClient;
	private final RedisTemplate<String, Object> redisTemplate;

	@Override
	public PlanCreateResponse getPlan(Long planId) {
		Plan plan = planRepository.findById(planId)
			.orElseThrow(() -> new IllegalArgumentException("Plan Not Found"));

		List<Long> participantIds = planParticipantRepository.findByPlanPlanId(planId).stream()
			.map(pp -> pp.getUser().getUserId())
			.toList();

		return PlanCreateResponse.builder()
			.planId(plan.getPlanId())
			.roomId(plan.getRoom().getRoomId())
			.participantIds(participantIds)
			.planName(plan.getPlanName())
			.radiusM(plan.getRadiusM())
			.startsAt(plan.getStartsAt())
			.dislikeCategories(plan.getDislikeCategories())
			.priceRanges(plan.getPriceRanges())
			.decisionTool(plan.getDecisionTool())
			.status(plan.getStatus())
			.candidates(null) // 후보는 별도 API로 조회
			.build();
	}

	@Override
	public Page<PlanCandidateResponse> getCandidates(Long planId, Pageable pageable) {
		Plan plan = planRepository.findById(planId)
			.orElseThrow(() -> new IllegalArgumentException("Plan Not Found"));

		// status = OPEN이면 재계산 (구경 모드)
		if (plan.getStatus() == PlanStatus.OPEN) {
			return getCandidatesByRecalculation(plan, pageable);
		}

		// status = VOTING/DECIDED면 plan_candidate에서 읽기 (결정 모드)
		return getCandidatesFromDatabase(plan, pageable);
	}

	@Override
	public Map<String, Object> getCandidateFeed(Long planId, String cursor) {
		Plan plan = planRepository.findById(planId)
			.orElseThrow(() -> new IllegalArgumentException("Plan Not Found"));

		// status = OPEN이면 Redis에서 조회 (구경 모드)
		if (plan.getStatus() == PlanStatus.OPEN) {
			return getCandidateFeedFromRedis(plan, cursor);
		}

		// status = VOTING/DECIDED면 plan_candidate에서 읽기 (결정 모드)
		return getCandidateFeedFromDatabase(plan, cursor);
	}

	/**
	 * Redis에서 후보 피드 조회 (구경 모드, status = OPEN)
	 * cursor 기반 무한 스크롤 지원
	 */
	private Map<String, Object> getCandidateFeedFromRedis(Plan plan, String cursor) {
		String redisKey = REDIS_KEY_PREFIX + plan.getPlanId();

		// 커서 파싱: 숫자만 받음 (예: "0", "8", "18")
		int offset = 0;
		if (cursor == null || cursor.trim().isEmpty() || cursor.trim().equals("0")) {
			offset = 0;
		} else {
			try {
				offset = Integer.parseInt(cursor.trim());
				if (offset < 0) {
					offset = 0;
				}
			} catch (NumberFormatException e) {
				offset = 0;
			}
		}

		// Redis에서 캐시된 식당 ID 리스트 조회 (안전한 역직렬화)
		List<Long> sortedRestaurantIds;
		try {
			Object cachedObj = redisTemplate.opsForValue().get(redisKey);
			if (cachedObj != null) {
				sortedRestaurantIds = deserializeRestaurantIdList(cachedObj);
				if (sortedRestaurantIds == null || sortedRestaurantIds.isEmpty()) {
					// 캐시가 비어있으면 재생성
					sortedRestaurantIds = calculateAndCacheCandidates(plan, redisKey);
				}
			} else {
				// 캐시가 없으면 계산 후 저장
				sortedRestaurantIds = calculateAndCacheCandidates(plan, redisKey);
			}
		} catch (Exception e) {
			// 역직렬화 실패 시 캐시 삭제 후 재생성
			redisTemplate.delete(redisKey);
			sortedRestaurantIds = calculateAndCacheCandidates(plan, redisKey);
		}

		// 배치 크기: 항상 8개
		int batchSize = BATCH_SIZE;

		// 배치 추출
		int startIdx = offset;
		int endIdx = Math.min(startIdx + batchSize, sortedRestaurantIds.size());

		if (startIdx >= sortedRestaurantIds.size()) {
			// 풀을 모두 소진했으면 빈 리스트 반환
			return Map.of("items", List.<PlanCandidateResponse>of(), "next_cursor", (String)null);
		}

		List<Long> pagedRestaurantIds = sortedRestaurantIds.subList(startIdx, endIdx);

		Point center = plan.getPlanGeom();
		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdIn(pagedRestaurantIds).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));

		List<PlanCandidateResponse> candidateResponses = pagedRestaurantIds.stream()
			.map(restaurantId -> {
				Restaurant restaurant = restaurantMap.get(restaurantId);
				if (restaurant == null) {
					return null;
				}
				return toPlanCandidateResponse(restaurant, center);
			})
			.filter(r -> r != null)
			.toList();

		// 다음 커서 계산
		String nextCursor = null;
		if (endIdx < sortedRestaurantIds.size()) {
			nextCursor = String.valueOf(endIdx);
		}

		Map<String, Object> result = new HashMap<>();
		result.put("items", candidateResponses);
		result.put("next_cursor", nextCursor);
		return result;
	}

	/**
	 * DB에서 후보 피드 조회 (결정 모드, status = VOTING/DECIDED)
	 * cursor 기반 무한 스크롤 지원
	 */
	private Map<String, Object> getCandidateFeedFromDatabase(Plan plan, String cursor) {
		// 커서 파싱
		int offset = 0;
		if (cursor == null || cursor.trim().isEmpty() || cursor.trim().equals("0")) {
			offset = 0;
		} else {
			try {
				offset = Integer.parseInt(cursor.trim());
				if (offset < 0) {
					offset = 0;
				}
			} catch (NumberFormatException e) {
				offset = 0;
			}
		}

		// 배치 크기: 항상 8개
		int batchSize = BATCH_SIZE;

		// DB에서 전체 후보 조회 (저장 순서대로, createdAt 기준)
		List<PlanCandidate> allCandidates = planCandidateRepository.findByPlanOrderByCreatedAtAsc(plan);

		if (allCandidates.isEmpty()) {
			return Map.of("items", List.<PlanCandidateResponse>of(), "next_cursor", (String)null);
		}

		// 배치 추출
		int startIdx = offset;
		int endIdx = Math.min(startIdx + batchSize, allCandidates.size());

		if (startIdx >= allCandidates.size()) {
			return Map.of("items", List.<PlanCandidateResponse>of(), "next_cursor", (String)null);
		}

		List<PlanCandidate> pagedCandidates = allCandidates.subList(startIdx, endIdx);

		List<Long> restaurantIds = pagedCandidates.stream()
			.map(pc -> pc.getRestaurant().getId())
			.toList();

		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdIn(restaurantIds).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));

		Point center = plan.getPlanGeom();
		List<PlanCandidateResponse> candidateResponses = pagedCandidates.stream()
			.map(pc -> {
				Restaurant restaurant = restaurantMap.get(pc.getRestaurant().getId());
				if (restaurant == null) {
					return null;
				}
				return toPlanCandidateResponse(restaurant, center);
			})
			.filter(r -> r != null)
			.toList();

		// 다음 커서 계산
		String nextCursor = null;
		if (endIdx < allCandidates.size()) {
			nextCursor = String.valueOf(endIdx);
		}

		Map<String, Object> result = new HashMap<>();
		result.put("items", candidateResponses);
		result.put("next_cursor", nextCursor);
		return result;
	}

	/**
	 * 재계산하여 후보 조회 (구경 모드, status = OPEN)
	 * Redis 캐싱을 사용하여 여러 사용자가 같은 약속을 봐도 동일한 결과를 보도록 함
	 */
	private Page<PlanCandidateResponse> getCandidatesByRecalculation(Plan plan, Pageable pageable) {
		String redisKey = REDIS_KEY_PREFIX + plan.getPlanId();

		// Redis에서 캐시된 식당 ID 리스트 조회 (안전한 역직렬화)
		List<Long> sortedRestaurantIds;
		try {
			Object cachedObj = redisTemplate.opsForValue().get(redisKey);
			if (cachedObj != null) {
				sortedRestaurantIds = deserializeRestaurantIdList(cachedObj);
				if (sortedRestaurantIds == null || sortedRestaurantIds.isEmpty()) {
					// 캐시가 비어있으면 재생성
					sortedRestaurantIds = calculateAndCacheCandidates(plan, redisKey);
				}
			} else {
				// 캐시가 없으면 계산 후 저장
				sortedRestaurantIds = calculateAndCacheCandidates(plan, redisKey);
			}
		} catch (Exception e) {
			// 역직렬화 실패 시 캐시 삭제 후 재생성
			redisTemplate.delete(redisKey);
			sortedRestaurantIds = calculateAndCacheCandidates(plan, redisKey);
		}

		// 페이징 적용
		int start = (int)pageable.getOffset();
		int end = Math.min(start + pageable.getPageSize(), sortedRestaurantIds.size());

		if (start >= sortedRestaurantIds.size()) {
			return Page.empty(pageable);
		}

		List<Long> pagedRestaurantIds = sortedRestaurantIds.subList(start, end);

		Point center = plan.getPlanGeom();
		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdIn(pagedRestaurantIds).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));

		List<PlanCandidateResponse> candidateResponses = pagedRestaurantIds.stream()
			.map(restaurantId -> {
				Restaurant restaurant = restaurantMap.get(restaurantId);
				if (restaurant == null) {
					return null;
				}
				return toPlanCandidateResponse(restaurant, center);
			})
			.filter(r -> r != null)
			.toList();

		return new PageImpl<>(candidateResponses, pageable, sortedRestaurantIds.size());
	}

	/**
	 * 후보 식당 계산 후 Redis에 캐싱
	 * 필터링 후 최소 100개가 되도록 반경을 확장합니다.
	 * 
	 * @return 점수순 정렬된 식당 ID 리스트
	 */
	private List<Long> calculateAndCacheCandidates(Plan plan, String redisKey) {
		Point center = plan.getPlanGeom();
		double centerLat = center.getY();
		double centerLon = center.getX();

		// 반경 설정: plan.getRadiusM() 사용하되, null이면 5000M 기본값
		int initialRadiusM = plan.getRadiusM() != null ? plan.getRadiusM() : 5000;
		int initialMaxCandidates = 200;
		final int MIN_CANDIDATES = 100; // 최소 목표 개수
		final int MAX_EXPANSIONS = 2; // 최대 확장 횟수
		final double RADIUS_MULTIPLIER = 2.0; // 반경 배수
		final int MAX_CANDIDATES_STEP = 150; // maxCandidates 증가분

		int radiusM = initialRadiusM;
		int maxCandidates = initialMaxCandidates;
		List<Restaurant> filtered = Collections.emptyList();

		// 반경 확장하면서 최소 100개 확보
		for (int expansion = 0; expansion <= MAX_EXPANSIONS; expansion++) {
			// 1. PostGIS로 반경 내 식당 조회
			Page<Restaurant> page = restaurantRepository.findNearestWithinMeters(
				centerLon, centerLat, (double) radiusM, PageRequest.of(0, maxCandidates)
			);

			List<Restaurant> restaurants = page.getContent();

			// 2. 필터링: 가격대, 비선호 카테고리, 오픈 상태 (startsAt이 있을 때만)
			filtered = restaurants.stream()
				.filter(r -> matchesPriceFilter(r, plan.getPriceRanges()))
				.filter(r -> matchesDislikeCategoryFilter(r, plan.getDislikeCategories()))
				.filter(r -> matchesOpenStatusFilter(r, plan.getStartsAt()))
				.limit(maxCandidates)
				.toList();

			// 필터링 후 100개 이상이면 종료
			if (filtered.size() >= MIN_CANDIDATES) {
				break;
			}

			// 마지막 확장이 아니면 반경과 maxCandidates 확장
			if (expansion < MAX_EXPANSIONS) {
				radiusM = (int)(radiusM * RADIUS_MULTIPLIER);
				maxCandidates += MAX_CANDIDATES_STEP;
			}
		}

		if (filtered.isEmpty()) {
			return Collections.emptyList();
		}

		// 3. 참여자들의 태그 선호도 조회
		List<Long> participantIds = planParticipantRepository.findByPlanPlanId(plan.getPlanId()).stream()
			.map(pp -> pp.getUser().getUserId())
			.toList();

		List<GroupScoreReqeust.UserPrefFeature> members = participantIds.stream()
			.map(userId -> {
				var userTagStats = userTagPrefRepository.getUserTagStats(userId);
				Map<Long, GroupScoreReqeust.TagPreference> tagPref = userTagStats.entrySet().stream()
					.collect(Collectors.toMap(
						Map.Entry::getKey,
						e -> GroupScoreReqeust.TagPreference.builder()
							.score((float)e.getValue().score())
							.confidence((float)e.getValue().confidence())
							.build()
					));
				return GroupScoreReqeust.UserPrefFeature.builder()
					.userId(userId)
					.tagPref(tagPref)
					.build();
			})
			.toList();

		// 4. 후보 식당의 태그 정보 및 pref_score 조회
		List<Long> restaurantIds = filtered.stream().map(Restaurant::getId).toList();
		Map<Long, List<RestaurantTag>> tagsByRestaurant = restaurantTagRepository
			.findByRestaurantIdIn(restaurantIds)
			.stream()
			.collect(Collectors.groupingBy(RestaurantTag::getRestaurantId));

		Map<Long, List<Float>> prefScoresByRestaurant = new HashMap<>();
		for (Long userId : participantIds) {
			List<com.jde.mainserver.main.entity.UserRestaurantState> states = userRestaurantStateRepository
				.findById_UserIdAndId_RestaurantIdIn(userId, restaurantIds);

			for (var state : states) {
				if (state.getPrefScore() != null) {
					Long restaurantId = state.getId().getRestaurantId();
					prefScoresByRestaurant.computeIfAbsent(restaurantId, k -> new java.util.ArrayList<>())
						.add(state.getPrefScore().floatValue());
				}
			}
		}

		Map<Long, Float> prefScoreByRestaurant = prefScoresByRestaurant.entrySet().stream()
			.collect(Collectors.toMap(
				Map.Entry::getKey,
				e -> {
					List<Float> scores = e.getValue();
					return scores.stream().reduce(0.0f, Float::sum) / scores.size();
				}
			));

		// 5. CandidateFeature로 변환
		List<GroupScoreReqeust.CandidateFeature> candidates = filtered.stream()
			.map(r -> {
				Float distanceM = (float)calculateDistanceMeters(centerLat, centerLon, r.getGeom());

				Map<Long, GroupScoreReqeust.TagPreference> tagPref = tagsByRestaurant
					.getOrDefault(r.getId(), Collections.emptyList())
					.stream()
					.collect(Collectors.toMap(
						RestaurantTag::getTagId,
						rt -> GroupScoreReqeust.TagPreference.builder()
							.weight(rt.getWeight().floatValue())
							.confidence(rt.getConfidence().floatValue())
							.build()
					));

				Float prefScore = prefScoreByRestaurant.get(r.getId());

				// 그룹 점수에서는 has_interaction_recent와 engagement_boost를 null로 설정
				// (개인 점수에서만 사용)
				return GroupScoreReqeust.CandidateFeature.builder()
					.restaurantId(r.getId())
					.distanceM(distanceM)
					.tagPref(tagPref)
					.prefScore(prefScore)
					.hasInteractionRecent(null)
					.engagementBoost(null)
					.build();
			})
			.toList();

		// 6. FastAPI로 그룹 점수 계산 요청
		GroupScoreReqeust groupScoreRequest = GroupScoreReqeust.builder()
			.members(members)
			.candidates(candidates)
			.debug(false)
			.build();

		GroupScoreResponse groupScoreResponse = scoreEngineHttpClient.groupScore(groupScoreRequest);
		Map<Long, Float> scores = groupScoreResponse.getScores();

		// 7. 점수순 정렬하여 식당 ID 리스트 추출
		List<Long> sortedRestaurantIds = scores.entrySet().stream()
			.sorted((a, b) -> Float.compare(b.getValue(), a.getValue()))
			.map(Map.Entry::getKey)
			.toList();

		// 8. Redis에 저장
		redisTemplate.opsForValue().set(redisKey, sortedRestaurantIds, CACHE_TTL);

		return sortedRestaurantIds;
	}

	/**
	 * DB에서 후보 조회 (결정 모드, status = VOTING/DECIDED)
	 */
	private Page<PlanCandidateResponse> getCandidatesFromDatabase(Plan plan, Pageable pageable) {
		Page<PlanCandidate> candidatePage = planCandidateRepository.findByPlanOrderByCreatedAtAsc(plan, pageable);

		List<Long> restaurantIds = candidatePage.getContent().stream()
			.map(pc -> pc.getRestaurant().getId())
			.toList();

		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdIn(restaurantIds).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));

		List<PlanCandidateResponse> candidateResponses = candidatePage.getContent().stream()
			.map(pc -> {
				Restaurant restaurant = restaurantMap.get(pc.getRestaurant().getId());
				if (restaurant == null) {
					return null;
				}
				Point center = plan.getPlanGeom();
				return toPlanCandidateResponse(restaurant, center);
			})
			.filter(r -> r != null)
			.toList();

		return new PageImpl<>(candidateResponses, pageable, candidatePage.getTotalElements());
	}

	// 가격대 필터 확인
	private boolean matchesPriceFilter(Restaurant restaurant, List<com.jde.mainserver.plan.entity.enums.PlanPriceRange> priceRanges) {
		if (priceRanges == null || priceRanges.isEmpty()) {
			return true;
		}
		if (restaurant.getPriceRange() == null) {
			return true;
		}

		String restaurantPriceRange = restaurant.getPriceRange().name();
		return priceRanges.stream()
			.anyMatch(pr -> pr.name().equals(restaurantPriceRange));
	}

	// 비선호 카테고리 필터
	private boolean matchesDislikeCategoryFilter(Restaurant restaurant, List<String> dislikeCategories) {
		if (dislikeCategories == null || dislikeCategories.isEmpty()) {
			return true;
		}

		String category = restaurant.getCategory2();
		if (category == null) {
			return true;
		}
		return !dislikeCategories.contains(category);
	}

	// 오픈 상태 필터 (startsAt이 있을 때만 적용)
	private boolean matchesOpenStatusFilter(Restaurant restaurant, java.time.LocalDateTime startsAt) {
		// startsAt이 null이면 필터링하지 않음
		if (startsAt == null) {
			return true;
		}

		try {
			// 식당의 영업시간 조회
			List<RestaurantHour> hours = restaurantHourRepository.findByRestaurant_Id(restaurant.getId());
			
			// 약속 시작 시간을 ZonedDateTime으로 변환 (Asia/Seoul 기준)
			java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Seoul");
			java.time.ZonedDateTime targetTime = startsAt.atZone(zoneId);
			
			// 특정 시각 기준 영업 상태 계산
			OpenStatus status = OpenStatusUtil.calcStatusAt(hours, zoneId, targetTime);
			
			// OPEN 상태인 경우만 통과
			return status == OpenStatus.OPEN;
		} catch (Exception e) {
			// 영업시간 계산 실패 시 안전하게 통과 (필터링하지 않음)
			return true;
		}
	}

	// Restaurant -> PlanCandidateResponse 변환
	private PlanCandidateResponse toPlanCandidateResponse(Restaurant restaurant, Point centerPoint) {
		Integer distanceM = calculateDistanceMeters(
			centerPoint.getY(), centerPoint.getX(),
			restaurant.getGeom()
		);

		return PlanCandidateResponse.builder()
			.restaurant(RestaurantConverter.toSummary(restaurant))
			.menu(restaurant.getMenu())
			.distanceM(distanceM)
			.build();
	}

	// 두 지점 간 거리 계산
	private Integer calculateDistanceMeters(double lat1, double lon1, Point other) {
		if (other == null) {
			return null;
		}

		double lat2 = other.getY();
		double lon2 = other.getX();

		double dLat = Math.toRadians(lat2 - lat1);
		double dLon = Math.toRadians(lon2 - lon1);

		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
			+ Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
			* Math.sin(dLon / 2) * Math.sin(dLon / 2);

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		int distanceM = (int)(6371000 * c); // 지구 반지름 6371000m

		return distanceM;
	}

	/**
	 * Redis에서 역직렬화된 Object를 List<Long>으로 안전하게 변환
	 */
	private List<Long> deserializeRestaurantIdList(Object cachedObj) {
		try {
			if (cachedObj instanceof List) {
				@SuppressWarnings("unchecked")
				List<Object> list = (List<Object>)cachedObj;
				return list.stream()
					.map(obj -> {
						if (obj instanceof Number) {
							return ((Number)obj).longValue();
						} else if (obj instanceof String) {
							return Long.parseLong((String)obj);
						}
						return null;
					})
					.filter(id -> id != null)
					.toList();
			}
			return null;
		} catch (Exception e) {
			return null;
		}
	}

}
