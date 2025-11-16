/**
 * plan/service/command/PlanCommandServiceImpl.java
 * 약속 생성/수정 등의 커맨드 서비스 구현체
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.service.command;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.plan.entity.PlanParticipant;
import com.jde.mainserver.plan.entity.enums.PlanRole;
import com.jde.mainserver.plan.entity.enums.PlanStatus;
import com.jde.mainserver.plan.entity.enums.PlanPriceRange;
import com.jde.mainserver.plan.repository.PlanParticipantRepository;
import com.jde.mainserver.plan.repository.PlanRepository;
import com.jde.mainserver.main.repository.UserTagPrefRepository;
import com.jde.mainserver.main.repository.UserRestaurantStateRepository;
import com.jde.mainserver.main.repository.http.ScoreEngineHttpClient;
import com.jde.mainserver.plan.web.dto.request.GroupScoreReqeust;
import com.jde.mainserver.plan.web.dto.request.PlanCreateRequest;
import com.jde.mainserver.plan.web.dto.response.GroupScoreResponse;
import com.jde.mainserver.plan.web.dto.response.PlanCandidateResponse;
import com.jde.mainserver.plan.web.dto.response.PlanCreateResponse;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.repository.RoomMemberRepository;
import com.jde.mainserver.room.repository.RoomRepository;
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

import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanCommandServiceImpl implements PlanCommandService {
	private static final int INITIAL_BATCH_SIZE = 8; // 약속 생성 시 반환할 개수 (미리보기용)
	private static final String REDIS_KEY_PREFIX = "plan:pool:";
	private static final Duration CACHE_TTL = Duration.ofHours(1); // 캐시 유지 시간

	private final PlanRepository planRepository;
	private final RoomRepository roomRepository;
	private final MemberRepository memberRepository;
	private final PlanParticipantRepository planParticipantRepository;
	private final RoomMemberRepository roomMemberRepository;
	private final RestaurantRepository restaurantRepository;
	private final UserTagPrefRepository userTagPrefRepository;
	private final RestaurantTagRepository restaurantTagRepository;
	private final RestaurantHourRepository restaurantHourRepository;
	private final UserRestaurantStateRepository userRestaurantStateRepository;
	private final ScoreEngineHttpClient scoreEngineHttpClient;
	private final RedisTemplate<String, Object> redisTemplate;

	private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

	@Override
	public PlanCreateResponse createPlan(Long roomId, Long userId, PlanCreateRequest request) {
		Room room = roomRepository.findById(roomId)
			.orElseThrow(() -> new IllegalArgumentException("Room Not Found"));
		Member manager = memberRepository.findById(userId)
			.orElseThrow(() -> new IllegalArgumentException("Member Not Found"));

		// manager가 이 room의 멤버인지 검증
		if (!roomMemberRepository.existsByRoomAndUserAndIsDelFalse(room, manager)) {
			throw new IllegalArgumentException("Manager is not a member of this room");
		}

		Point centerPoint = geometryFactory.createPoint(
			new org.locationtech.jts.geom.Coordinate(request.getCenterLon(), request.getCenterLat())
		);

		// radiusM 기본값 처리 (null이면 5000m)
		Integer radiusM = request.getRadiusM() != null ? request.getRadiusM() : 5000;

		Plan plan = Plan.builder()
			.planName(request.getPlanName())
			.planGeom(centerPoint)
			.radiusM(radiusM)
			.startsAt(request.getStartsAt())
			.dislikeCategories(
				request.getDislikeCategories() != null ? request.getDislikeCategories() : Collections.emptyList()
			)
			.priceRanges(
				request.getPriceRanges() != null ? request.getPriceRanges() : Collections.emptyList()
			)
			.status(PlanStatus.OPEN)
			.decisionTool(null)
			.room(room)
			.build();

		planRepository.save(plan);

		// 참여자 ID 수집 (manager 포함)
		Set<Long> participantIds = new LinkedHashSet<>();
		participantIds.add(userId);
		if (request.getParticipantIds() != null) {
			participantIds.addAll(request.getParticipantIds());
		}

		// room의 멤버 ID 목록 조회 (삭제되지 않은 멤버만)
		Set<Long> roomMemberIds = roomMemberRepository.findByRoomAndIsDelFalse(room).stream()
			.map(roomMember -> roomMember.getUser().getUserId())
			.collect(Collectors.toSet());

		// 모든 참여자가 room의 멤버인지 검증
		for (Long participantId : participantIds) {
			if (!roomMemberIds.contains(participantId)) {
				throw new IllegalArgumentException("Participant " + participantId + " is not a member of this room");
			}
		}

		// PlanParticipant 생성 및 저장
		for (Long participantId : participantIds) {
			Member member = memberRepository.findById(participantId)
				.orElseThrow(() -> new IllegalArgumentException("Member Not Found: " + participantId));

			PlanParticipant participant = PlanParticipant.builder()
				.plan(plan)
				.user(member)
				.planRole(
					participantId.equals(userId)
						? PlanRole.MANAGER
						: PlanRole.PARTICIPANTS
				)
				.build();

			planParticipantRepository.save(participant);
		}

		List<PlanCandidateResponse> candidates = getCandidates(plan);

		return PlanCreateResponse.builder()
			.planId(plan.getPlanId())
			.roomId(room.getRoomId())
			.participantIds(participantIds.stream().toList())
			.planName(plan.getPlanName())
			.radiusM(plan.getRadiusM())
			.startsAt(plan.getStartsAt())
			.dislikeCategories(plan.getDislikeCategories())
			.priceRanges(plan.getPriceRanges())
			.decisionTool(plan.getDecisionTool())
			.status(plan.getStatus())
			.candidates(candidates)
			.build();
	}

	/**
	 * 약속 기준 후보 식당 조회 (반경 + 가격대 + 비선호 카테고리 필터 + FastAPI 그룹 점수 계산)
	 * 필터링 후 최소 100개가 되도록 반경을 확장합니다.
	 *
	 * 처리 과정:
	 * 1. PostGIS로 반경 내 식당 조회 (거리순 정렬, 최대 200개)
	 * 2. 가격대와 비선호 카테고리로 필터링
	 * 3. 필터링 후 100개 미만이면 반경 확장
	 * 4. 참여자들의 태그 선호도 조회
	 * 5. 후보 식당의 태그 정보 조회
	 * 6. FastAPI로 그룹 점수 계산 요청
	 * 7. 점수순 정렬하여 상위 8개를 PlanCandidateResponse로 변환하여 반환
	 *
	 * 참고: 약속 생성 시 미리보기용으로만 사용되며, DB/Redis에 저장하지 않음
	 */
	private List<PlanCandidateResponse> getCandidates(Plan plan) {
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
			// 1. PostGIS로 반경 내 식당 조회 (거리순 정렬)
			Pageable pageable = PageRequest.of(0, maxCandidates);
			Page<Restaurant> page = restaurantRepository.findNearestWithinMeters(
				centerLon, centerLat, (double) radiusM, pageable
			);

			List<Restaurant> restaurants = page.getContent();

			// 2. 오픈 상태 필터링을 위한 영업시간 벌크 조회 (startsAt이 있을 때만, N+1 문제 해결)
			Map<Long, List<RestaurantHour>> hoursByRestaurant = Collections.emptyMap();
			if (plan.getStartsAt() != null && !restaurants.isEmpty()) {
				List<Long> restaurantIds = restaurants.stream()
					.map(Restaurant::getId)
					.toList();
				List<RestaurantHour> allHours = restaurantHourRepository.findByRestaurant_IdIn(restaurantIds);
				hoursByRestaurant = allHours.stream()
					.collect(Collectors.groupingBy(h -> h.getRestaurant().getId()));
			}

			// 3. 필터링: 가격대, 비선호 카테고리, 오픈 상태 (startsAt이 있을 때만)
			final Map<Long, List<RestaurantHour>> hoursMap = hoursByRestaurant;
			filtered = restaurants.stream()
				.filter(r -> matchesPriceFilter(r, plan.getPriceRanges()))
				.filter(r -> matchesDislikeCategoryFilter(r, plan.getDislikeCategories()))
				.filter(r -> matchesOpenStatusFilter(r, plan.getStartsAt(), hoursMap.get(r.getId())))
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

		// 모든 참여자의 pref_score 벌크 조회 (식당별로 평균 계산)
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
		
		// 평균 계산
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
				
				// 식당 태그 정보 (weight, confidence 사용)
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

				return GroupScoreReqeust.CandidateFeature.builder()
					.restaurantId(r.getId())
					.distanceM(distanceM)
					.tagPref(tagPref)
					.prefScore(prefScore)
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

		// 6. 점수순 정렬하여 식당 ID 리스트 추출 (전체 100개, 피드 조회 시 동일한 리스트를 보여주기 위해)
		List<Long> sortedRestaurantIds = scores.entrySet().stream()
			.sorted((a, b) -> Float.compare(b.getValue(), a.getValue()))
			.map(Map.Entry::getKey)
			.toList();

		// 7. Redis에 저장 (피드 조회 시 동일한 리스트를 보여주기 위해)
		String redisKey = REDIS_KEY_PREFIX + plan.getPlanId();
		redisTemplate.opsForValue().set(redisKey, sortedRestaurantIds, CACHE_TTL);

		// 8. 상위 8개만 추출하여 반환
		List<Long> topRestaurantIds = sortedRestaurantIds.stream()
			.limit(INITIAL_BATCH_SIZE)
			.toList();

		// 약속 생성 시에는 hours가 필요 없으므로 hours를 로드하지 않는 메서드 사용 (성능 최적화)
		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdInWithoutHours(topRestaurantIds).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));

		return topRestaurantIds.stream()
			.map(restaurantId -> {
				Restaurant restaurant = restaurantMap.get(restaurantId);
				if (restaurant == null) {
					return null;
				}
				return toPlanCandidateResponse(restaurant, center);
			})
			.filter(r -> r != null)
			.toList();
	}

	// 가격대 필터 확인
	private boolean matchesPriceFilter(Restaurant restaurant, List<PlanPriceRange> priceRanges) {
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
	// hours 파라미터: 벌크 조회로 미리 가져온 영업시간 리스트 (N+1 문제 해결)
	private boolean matchesOpenStatusFilter(Restaurant restaurant, java.time.LocalDateTime startsAt, List<RestaurantHour> hours) {
		// startsAt이 null이면 필터링하지 않음
		if (startsAt == null) {
			return true;
		}

		// hours가 null이거나 비어있으면 통과 (영업시간 정보가 없으면 필터링하지 않음)
		if (hours == null || hours.isEmpty()) {
			return true;
		}

		try {
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
}
