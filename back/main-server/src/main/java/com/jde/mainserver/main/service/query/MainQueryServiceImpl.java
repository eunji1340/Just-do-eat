/**
 * main/service/query/MainQueryServiceImpl.java
 * 메인 Query 서비스 구현체
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.service.query;

import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.entity.RestaurantTag;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.restaurants.repository.RestaurantTagRepository;
import com.jde.mainserver.main.repository.CandidateRepository;
import com.jde.mainserver.main.repository.UserRestaurantStateRepository;
import com.jde.mainserver.main.repository.UserTagPrefRepository;
import com.jde.mainserver.main.repository.http.ScoreEngineHttpClient;
import com.jde.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.main.web.dto.response.PersonalScoreResponse;
import com.jde.mainserver.main.converter.MainConverter;
import com.jde.mainserver.region.entity.Region;
import com.jde.mainserver.region.repository.RegionRepository;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.restaurants.exception.RestaurantErrorCode;
import com.jde.mainserver.restaurants.exception.RestaurantException;
import org.locationtech.jts.geom.Point;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.SerializationException;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MainQueryServiceImpl implements MainQueryService {
	private static final int POOL_SIZE = 100; // 점수 계산할 큰 풀
	private static final int BATCH_SIZE = 10; // 한 번에 전달할 배치 크기
	private static final int HIGH_SCORE_THRESHOLD_BATCHES = 2; // 처음 몇 배치는 높은 점수 위주
	private static final String REDIS_KEY_PREFIX = "feed:pool:user:";
	private static final String REDIS_KEY_PREFIX_GUEST = "feed:pool:guest:";
	private static final Duration CACHE_TTL = Duration.ofHours(1); // 캐시 유지 시간
	private static final Duration CACHE_TTL_GUEST = Duration.ofMinutes(30); // 비회원 캐시 유지 시간 (짧게)

	private final UserTagPrefRepository userTagPrefRepository;
	private final CandidateRepository candidateRepository;
	private final ScoreEngineHttpClient scoreEngineHttpClient;
	private final RestaurantRepository restaurantRepository;
	private final RestaurantTagRepository restaurantTagRepository;
	private final RedisTemplate<String, Object> redisTemplate;
	private final UserRestaurantStateRepository userRestaurantStateRepository;
	private final MemberRepository memberRepository;
	private final RegionRepository regionRepository;

	public MainQueryServiceImpl(
		UserTagPrefRepository userTagPrefRepository,
		CandidateRepository candidateRepository,
		ScoreEngineHttpClient scoreEngineHttpClient,
		RestaurantRepository restaurantRepository,
		RestaurantTagRepository restaurantTagRepository,
		RedisTemplate<String, Object> redisTemplate,
		UserRestaurantStateRepository userRestaurantStateRepository,
		MemberRepository memberRepository,
		RegionRepository regionRepository
	) {
		this.userTagPrefRepository = userTagPrefRepository;
		this.candidateRepository = candidateRepository;
		this.scoreEngineHttpClient = scoreEngineHttpClient;
		this.restaurantRepository = restaurantRepository;
		this.restaurantTagRepository = restaurantTagRepository;
		this.redisTemplate = redisTemplate;
		this.userRestaurantStateRepository = userRestaurantStateRepository;
		this.memberRepository = memberRepository;
		this.regionRepository = regionRepository;
	}

	/** 피드 배치 조회 (cursor 없으면 첫 요청, 숫자면 해당 인덱스부터) */
	@Override
	public FeedResponse getFeedBatch(Long userId, String cursor, Map<String, Object> ctx) {
		// 커서 파싱: 숫자만 받음 (예: "0", "10", "20")
		int offset = 0;
		boolean isFirstRequest = false;
		if (cursor == null || cursor.trim().isEmpty() || cursor.trim().equals("0")) {
			isFirstRequest = true;
			offset = 0;
		} else {
			try {
				offset = Integer.parseInt(cursor.trim());
				if (offset < 0) {
					offset = 0;
					isFirstRequest = true;
				}
			} catch (NumberFormatException e) {
				offset = 0;
				isFirstRequest = true;
			}
		}

		// 사용자 타입 판별
		boolean isGuest = (userId == null);
		boolean isNewUser = false;
		if (!isGuest) {
			var userTagStats = userTagPrefRepository.getUserTagStats(userId);
			
			// user_tag_pref 확인 (문제가 있을 때만 경고)
			if (userTagStats == null || userTagStats.isEmpty()) {
				log.warn("[MainQueryService.getFeedBatch] user_tag_pref is empty: userId={}", userId);
			}
			
			boolean hasTagPref = (userTagStats != null && !userTagStats.isEmpty());
			
			// user_tag_pref가 없어도 pref_score가 있으면 기존 회원으로 판별
			if (!hasTagPref) {
				boolean hasPrefScore = userRestaurantStateRepository.existsByUserIdAndPrefScoreNotZero(userId);
				isNewUser = !hasPrefScore;
				log.debug("[MainQueryService.getFeedBatch] user type: userId={}, hasTagPref={}, hasPrefScore={}, isNewUser={}", 
					userId, hasTagPref, hasPrefScore, isNewUser);
			}
		}

		// 피드 풀 생성/조회
		List<RestaurantWithMeta> pool;

		if (isGuest) {
			// 비회원: Redis 사용 (100개까지 중복 없이 보기 위해)
			// IP 기반 임시 키 사용 (ctx에서 IP 추출, 없으면 매번 새로 생성)
			String guestId = extractGuestId(ctx);
			String redisKey = guestId != null ? REDIS_KEY_PREFIX_GUEST + guestId : null;

			if (redisKey != null) {
				if (isFirstRequest) {
					List<PersonalScoreRequest.Candidate> candidates = expandCandidatesUntilSufficient(null, ctx);
					// 최초 생성: 제한적 셔플 적용 (게스트ID 기반 시드)
					Long seed = System.currentTimeMillis() ^ guestId.hashCode();
					pool = preparePoolByRatingAndReview(candidates, true, seed);
					redisTemplate.opsForValue().set(redisKey, pool, CACHE_TTL_GUEST);
				} else {
					pool = getPoolFromRedisOrRegenerateGeneric(
						redisKey,
						CACHE_TTL_GUEST,
						() -> {
							List<PersonalScoreRequest.Candidate> cands = expandCandidatesUntilSufficient(null, ctx);
							Long seed = (long)redisKey.hashCode();
							return preparePoolByRatingAndReview(cands, true, seed);
						},
						"guest"
					);
				}
			} else {
				// IP 정보가 없으면 매번 새로 생성 (하지만 cursor는 무시)
				List<PersonalScoreRequest.Candidate> candidates = expandCandidatesUntilSufficient(null, ctx);
				pool = preparePoolByRatingAndReview(candidates, true, null);
				offset = 0; // cursor 무시
			}
		} else if (isNewUser) {
			// 신규 회원: Redis 사용 (100개까지 중복 없이 보기 위해)
			String redisKey = REDIS_KEY_PREFIX + userId;
			if (isFirstRequest) {
				List<PersonalScoreRequest.Candidate> candidates = expandCandidatesUntilSufficient(userId, ctx);
				pool = preparePoolByRatingAndReview(candidates, true, userId);
				redisTemplate.opsForValue().set(redisKey, pool, CACHE_TTL);
			} else {
				pool = getPoolFromRedisOrRegenerateGeneric(
					redisKey,
					CACHE_TTL,
					() -> {
						List<PersonalScoreRequest.Candidate> cands = expandCandidatesUntilSufficient(userId, ctx);
						return preparePoolByRatingAndReview(cands, true, userId);
					},
					"new_user"
				);
			}
		} else {
			// 기존 회원: Redis 사용 (100개까지 중복 없이 보기 위해)
			String redisKey = REDIS_KEY_PREFIX + userId;
			if (isFirstRequest) {
				pool = preparePoolForExistingUser(userId, ctx);
				redisTemplate.opsForValue().set(redisKey, pool, CACHE_TTL);
			} else {
				pool = getPoolFromRedisOrRegenerateGeneric(
					redisKey,
					CACHE_TTL,
					() -> preparePoolForExistingUser(userId, ctx),
					"existing_user"
				);
			}
		}

		// 배치 추출
		int startIdx = offset;
		int endIdx = Math.min(startIdx + BATCH_SIZE, pool.size());

		if (startIdx >= pool.size()) {
			// 풀을 모두 소진했으면 빈 리스트 반환
			// 프론트에서 nextCursor가 null이면 다음 요청에서 cursor를 null로 보내서 새로 시작
			return new FeedResponse(List.of(), null);
		}

		// 현재 배치의 식당들 (메타정보 포함)
		List<RestaurantWithMeta> batchRestaurants = pool.subList(startIdx, endIdx);

		// 식당 ID 목록 추출
		List<Long> batchRestaurantIds = batchRestaurants.stream()
			.map(RestaurantWithMeta::getRestaurantId)
			.toList();

		// 식당 정보 조회 (Entity 직접 사용)
		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdIn(batchRestaurantIds).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));

		// 북마크 정보 조회 (userId가 있을 때만)
		Set<Long> bookmarkedIds = new HashSet<>();
		if (userId != null && !batchRestaurantIds.isEmpty()) {
			List<Long> savedIds = restaurantRepository.findSavedRestaurantIdsByUserIdAndRestaurantIds(
				userId, batchRestaurantIds);
			bookmarkedIds.addAll(savedIds);
		}

		// 순서 유지하며 식당 정보 리스트 생성 (거리, 영업 상태 업데이트)
		List<FeedResponse.RestaurantItem> feedItems = batchRestaurants.stream()
			.map(meta -> {
				Restaurant restaurant = restaurantMap.get(meta.getRestaurantId());
				Boolean bookmarked = userId != null && bookmarkedIds.contains(meta.getRestaurantId());
				return MainConverter.toFeedItem(
					restaurant,
					meta.getDistanceM(),
					meta.getIsOpen(),
					bookmarked,
					meta.getDebug()
				);
			})
			.filter(Objects::nonNull)
			.toList();

		// 다음 커서 생성: 다음 배치의 시작 인덱스 (숫자만)
		String nextCursor = endIdx < pool.size() ? String.valueOf(endIdx) : null;

		return new FeedResponse(feedItems, nextCursor);
	}

	/**
	 * 비회원용 식별자 추출 (ctx에서 IP 또는 세션 ID 추출)
	 */
	private String extractGuestId(Map<String, Object> ctx) {
		if (ctx == null)
			return null;
		// ctx에서 "ip" 또는 "sessionId" 키로 식별자 추출
		Object ip = ctx.get("ip");
		Object sessionId = ctx.get("sessionId");
		if (sessionId != null) {
			return "session:" + sessionId.toString();
		}
		if (ip != null) {
			return "ip:" + ip.toString();
		}
		return null;
	}

	private List<RestaurantWithMeta> getPoolFromRedisOrRegenerateGeneric(
		String redisKey,
		Duration ttl,
		Supplier<List<RestaurantWithMeta>> regenerate,
		String logType
	) {
		try {
			Object cachedObj = redisTemplate.opsForValue().get(redisKey);
			if (cachedObj == null) {
				List<RestaurantWithMeta> pool = regenerate.get();
				redisTemplate.opsForValue().set(redisKey, pool, ttl);
				return pool;
			}

			// 캐시 역직렬화
			List<RestaurantWithMeta> pool = deserializePool(cachedObj);
			if (pool != null) {
				return pool;
			}

			// 형식 불일치 시 재생성
			redisTemplate.delete(redisKey);
			List<RestaurantWithMeta> regen = regenerate.get();
			redisTemplate.opsForValue().set(redisKey, regen, ttl);
			return regen;
		} catch (SerializationException e) {
			log.warn("{} Redis 역직렬화 실패, 캐시 삭제 후 재생성: key={}, error={}", logType, redisKey, e.getMessage());
			redisTemplate.delete(redisKey);
			List<RestaurantWithMeta> regen = regenerate.get();
			redisTemplate.opsForValue().set(redisKey, regen, ttl);
			return regen;
		}
	}

	private List<RestaurantWithMeta> deserializePool(Object cachedObj) {
		try {
			@SuppressWarnings("unchecked")
			List<Map<String, Object>> cachedList = (List<Map<String, Object>>)cachedObj;
			return cachedList.stream()
				.map(map -> {
					Object restaurantIdObj = map.get("restaurantId");
					Object distanceMObj = map.get("distanceM");
					Object isOpenObj = map.get("isOpen");
					@SuppressWarnings("unchecked")
					Map<String, Object> debugObj = (Map<String, Object>)map.get("debug");
					return new RestaurantWithMeta(
						restaurantIdObj != null ? ((Number)restaurantIdObj).longValue() : null,
						distanceMObj != null ? ((Number)distanceMObj).intValue() : null,
						isOpenObj != null ? (Boolean)isOpenObj : null,
						debugObj
					);
				})
				.filter(meta -> meta.getRestaurantId() != null)
				.toList();
		} catch (Exception e) {
			return null;
		}
	}

	/**
	 * 기존 회원용 피드 풀 생성 (개인화 추천 점수 기반)
	 */
	private List<RestaurantWithMeta> preparePoolForExistingUser(Long userId, Map<String, Object> ctx) {
		// 후보 조회
		List<PersonalScoreRequest.Candidate> candidates = candidateRepository.getCandidates(userId, ctx);

		// 사용자 태그 선호도 조회
		var userTagStats = userTagPrefRepository.getUserTagStats(userId);
		
		// user_tag_pref 확인 (문제가 있을 때만 경고)
		if (userTagStats == null || userTagStats.isEmpty()) {
			log.warn("[MainQueryService.preparePoolForExistingUser] user_tag_pref is empty: userId={}", userId);
		}
		
		var userTagPref = userTagStats.entrySet().stream()
			.collect(Collectors.toMap(
				Map.Entry::getKey,
				e -> new PersonalScoreRequest.TagPreference(
					(float)e.getValue().score(),
					(float)e.getValue().confidence()
				)
			));

		// Candidate를 Map으로 변환 (식당 ID -> Candidate)
		Map<Long, PersonalScoreRequest.Candidate> candidateMap = candidates.stream()
			.collect(Collectors.toMap(
				PersonalScoreRequest.Candidate::restaurantId,
				c -> c
			));

		// 점수 계산
		var req = PersonalScoreRequest.of(userId, userTagPref, candidates);
		// ML 모델 사용 (기본값: ml_v1)
		var res = scoreEngineHttpClient.score(req, "ml_v1");

		// 점수순 정렬
		var sortedItems = res.items().stream()
			.sorted((a, b) -> Double.compare(b.score(), a.score()))
			.collect(Collectors.toList());

		// 풀 크기 제한
		var limitedPool = sortedItems.size() > POOL_SIZE
			? sortedItems.subList(0, POOL_SIZE)
			: sortedItems;

		// 다양성 고려 재배치 (카테고리 및 태그 기반)
		var reorderedItems = applyDiversity(limitedPool, candidateMap);

		// 식당 ID와 메타정보 추출
		return convertToRestaurantWithMeta(reorderedItems, candidateMap);
	}

	/**
	 * PersonalScoreResponse.ScoredItem을 RestaurantWithMeta로 변환
	 */
	private List<RestaurantWithMeta> convertToRestaurantWithMeta(
		List<PersonalScoreResponse.ScoredItem> items,
		Map<Long, PersonalScoreRequest.Candidate> candidateMap
	) {
		return items.stream()
			.map(item -> {
				PersonalScoreRequest.Candidate candidate = candidateMap.get(item.restaurantId());
				if (candidate == null) {
					return new RestaurantWithMeta(
						item.restaurantId(),
						0,
						false,
						item.reasons() // debug 정보
					);
				}
				return new RestaurantWithMeta(
					item.restaurantId(),
					candidate.distanceM() != null ? candidate.distanceM().intValue() : null,
					candidate.isOpen(),
					item.reasons() // debug 정보
				);
			})
			.toList();
	}

	/**
	 * 평점/리뷰 기반 피드 풀 생성 (비회원/신규 회원 공통)
	 * 카카오 평점과 리뷰 수를 기반으로 신뢰도 점수를 계산하여 정렬
	 */
	private List<RestaurantWithMeta> preparePoolByRatingAndReview(
		List<PersonalScoreRequest.Candidate> candidates,
		boolean doShuffle,
		Long shuffleSeed
	) {
		// 식당 정보 조회 (평점, 리뷰 수 필요)
		List<Long> restaurantIds = candidates.stream()
			.map(PersonalScoreRequest.Candidate::restaurantId)
			.toList();

		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdIn(restaurantIds).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));

		// 평점/리뷰 정보가 있는 후보와 없는 후보를 분리
		List<PersonalScoreRequest.Candidate> withInfo = new ArrayList<>();
		List<PersonalScoreRequest.Candidate> noInfo = new ArrayList<>();
		for (PersonalScoreRequest.Candidate c : candidates) {
			Restaurant r = restaurantMap.get(c.restaurantId());
			if (r == null) {
				noInfo.add(c);
				continue;
			}
			BigDecimal rating = r.getKakaoRating();
			Integer reviewCnt = r.getKakaoReviewCnt();
			boolean hasRating = (rating != null && rating.doubleValue() > 0.0);
			boolean hasReviews = (reviewCnt != null && reviewCnt > 0);
			if (hasRating || hasReviews) {
				withInfo.add(c);
			} else {
				noInfo.add(c);
			}
		}

		// 신뢰도 점수 계산 및 정렬 (평점/리뷰 정보가 있는 후보만)
		List<ScoredRestaurant> scoredRestaurants = withInfo.stream()
			.map(candidate -> {
				Restaurant restaurant = restaurantMap.get(candidate.restaurantId());
				if (restaurant == null)
					return null;

				BigDecimal rating = restaurant.getKakaoRating();
				Integer reviewCnt = restaurant.getKakaoReviewCnt();

				// 평점이 없으면 0점 처리
				double ratingValue = rating != null ? rating.doubleValue() : 0.0;

				// 리뷰 수 기반 신뢰도 가중치 (0.0 ~ 1.0)
				double confidenceWeight = calculateReviewConfidence(reviewCnt);

				// 최종 점수 = 평점 * 신뢰도 가중치
				double score = ratingValue * confidenceWeight;

				return new ScoredRestaurant(
					candidate.restaurantId(),
					score,
					candidate
				);
			})
			.filter(Objects::nonNull)
			.sorted((a, b) -> Double.compare(b.score(), a.score()))
			.collect(Collectors.toList());

		// 풀 크기 제한
		var limitedPool = scoredRestaurants.size() > POOL_SIZE
			? scoredRestaurants.subList(0, POOL_SIZE)
			: scoredRestaurants;

		// 카테고리 다양성 고려 재배치 (랜덤 셔플은 최초 생성에만 제한적으로 수행)
		Map<Long, PersonalScoreRequest.Candidate> candidateMap = candidates.stream()
			.collect(Collectors.toMap(
				PersonalScoreRequest.Candidate::restaurantId,
				c -> c
			));

		List<ScoredRestaurant> inputForDiversity;
		if (doShuffle) {
			// 점수 구간(0.5 단위) 내에서 시드 기반 셔플
			Map<Integer, List<ScoredRestaurant>> scoreGroups = groupByScoreRange(limitedPool);
			List<ScoredRestaurant> shuffledPool = new ArrayList<>();
			java.util.Random rand = (shuffleSeed != null) ? new java.util.Random(shuffleSeed) : new java.util.Random();
			for (List<ScoredRestaurant> group : scoreGroups.values()) {
				Collections.shuffle(group, rand);
				shuffledPool.addAll(group);
			}
			inputForDiversity = shuffledPool;
		} else {
			// 결정적 순서 유지: 점수 → 식당ID
			inputForDiversity = limitedPool.stream()
				.sorted((a, b) -> {
					int scoreCompare = Double.compare(b.score(), a.score());
					if (scoreCompare != 0)
						return scoreCompare;
					return Long.compare(a.restaurantId(), b.restaurantId());
				})
				.collect(Collectors.toList());
		}

		var reorderedItems = applyDiversityForRatingFeed(inputForDiversity, candidateMap);

		// 메인 결과 (평점/리뷰 있는 식당들)
		List<RestaurantWithMeta> result = reorderedItems.stream()
			.map(sr -> {
				PersonalScoreRequest.Candidate candidate = candidateMap.get(sr.restaurantId());
				return new RestaurantWithMeta(
					sr.restaurantId(),
					candidate != null && candidate.distanceM() != null ? candidate.distanceM().intValue() : null,
					candidate != null && candidate.isOpen() != null ? candidate.isOpen() : false,
					null // 비회원/신규 회원은 debug 정보 없음
				);
			})
			.toList();

		// 정보 없는 식당들은 맨 뒤에 유지 (식당 ID순으로 정렬하여 일관된 순서 유지)
		List<RestaurantWithMeta> tail = noInfo.stream()
			.sorted((a, b) -> Long.compare(a.restaurantId(), b.restaurantId()))
			.map(c -> new RestaurantWithMeta(
				c.restaurantId(),
				c.distanceM() != null ? c.distanceM().intValue() : null,
				c.isOpen() != null ? c.isOpen() : false,
				null // 비회원/신규 회원은 debug 정보 없음
			))
			.toList();

		List<RestaurantWithMeta> combined = new ArrayList<>(result);
		combined.addAll(tail);
		return combined;
	}

	/**
	 * 리뷰 수 기반 신뢰도 가중치 계산
	 *
	 * @param reviewCnt 리뷰 수
	 * @return 0.0 ~ 1.0 사이의 신뢰도 가중치
	 */
	private double calculateReviewConfidence(Integer reviewCnt) {
		if (reviewCnt == null || reviewCnt <= 0) {
			return 0.1; // 리뷰가 없으면 매우 낮은 신뢰도
		}

		// 리뷰 수가 많을수록 신뢰도 증가 (로그 스케일 사용)
		// 10개: 0.5, 50개: 0.75, 100개: 0.9, 200개 이상: 1.0
		double logReview = Math.log10(reviewCnt + 1);
		double confidence = Math.min(logReview / 2.3, 1.0); // log10(200) ≈ 2.3

		// 최소 신뢰도 보장 (리뷰가 1개라도 있으면 최소 0.3)
		return Math.max(confidence, 0.3);
	}

	/**
	 * 신뢰도 점수를 구간별로 그룹화
	 * 비슷한 점수끼리 묶어서 같은 구간 내에서는 랜덤하게 섞음
	 */
	private Map<Integer, List<ScoredRestaurant>> groupByScoreRange(List<ScoredRestaurant> items) {
		// 점수를 0.5 단위로 구간화 (예: 0.0-0.5, 0.5-1.0, 1.0-1.5, ...)
		return items.stream()
			.collect(Collectors.groupingBy(sr -> {
				int range = (int)(sr.score() * 2); // 0.5 단위로 구간화
				return range;
			}));
	}

	/**
	 * 신뢰도 점수가 매겨진 식당
	 */
	private record ScoredRestaurant(
		Long restaurantId,
		double score,
		PersonalScoreRequest.Candidate candidate
	) {
	}

	/**
	 * 평점/리뷰 기반 피드용 다양성 재배치
	 */
	private List<ScoredRestaurant> applyDiversityForRatingFeed(
		List<ScoredRestaurant> sortedItems,
		Map<Long, PersonalScoreRequest.Candidate> candidateMap
	) {
		if (sortedItems.size() <= BATCH_SIZE * HIGH_SCORE_THRESHOLD_BATCHES) {
			return sortedItems;
		}

		// 첫 N개는 높은 점수 그대로 유지
		int highScoreEnd = BATCH_SIZE * HIGH_SCORE_THRESHOLD_BATCHES;
		List<ScoredRestaurant> highScoreItems = new ArrayList<>(
			sortedItems.subList(0, highScoreEnd)
		);

		// 나머지 아이템들
		List<ScoredRestaurant> remainingItems = new ArrayList<>(
			sortedItems.subList(highScoreEnd, sortedItems.size())
		);

		// 카테고리 정보 로딩
		Map<Long, RestaurantInfo> restaurantInfoMap = loadRestaurantInfo(
			remainingItems.stream().map(ScoredRestaurant::restaurantId).toList()
		);

		// 다양성 고려 재배치
		List<ScoredRestaurant> reorderedRemaining = reorderWithDiversityForRatingFeed(
			remainingItems,
			restaurantInfoMap
		);

		highScoreItems.addAll(reorderedRemaining);
		return highScoreItems;
	}

	/**
	 * 평점/리뷰 기반 피드용 다양성 재배치
	 */
	private List<ScoredRestaurant> reorderWithDiversityForRatingFeed(
		List<ScoredRestaurant> items,
		Map<Long, RestaurantInfo> restaurantInfoMap
	) {
		if (items.isEmpty()) {
			return List.of();
		}

		List<ScoredRestaurant> result = new ArrayList<>();
		List<ScoredRestaurant> remaining = new ArrayList<>(items);

		while (!remaining.isEmpty()) {
			ScoredRestaurant selected = selectNextItemForGuest(
				remaining,
				result,
				restaurantInfoMap
			);
			if (selected == null) {
				// 선택할 수 없으면 첫 번째 항목 선택
				selected = remaining.get(0);
			}
			result.add(selected);
			remaining.remove(selected);
		}

		return result;
	}

	/**
	 * 비회원용 다음 아이템 선택 (카테고리 다양성 고려)
	 */
	private ScoredRestaurant selectNextItemForGuest(
		List<ScoredRestaurant> candidates,
		List<ScoredRestaurant> selected,
		Map<Long, RestaurantInfo> restaurantInfoMap
	) {
		if (candidates.isEmpty()) {
			return null;
		}

		// 최근 선택된 아이템들의 카테고리 추출
		int lookbackSize = Math.min(BATCH_SIZE, selected.size());
		Set<String> recentCategories = new HashSet<>();

		for (int i = selected.size() - lookbackSize; i < selected.size(); i++) {
			if (i >= 0) {
				Long restaurantId = selected.get(i).restaurantId();
				RestaurantInfo info = restaurantInfoMap.get(restaurantId);
				if (info != null) {
					if (info.category1() != null)
						recentCategories.add(info.category1());
					if (info.category2() != null)
						recentCategories.add(info.category2());
					if (info.category3() != null)
						recentCategories.add(info.category3());
				}
			}
		}

		// 겹치지 않는 카테고리 + 양의 점수 우선 선택
		for (ScoredRestaurant item : candidates) {
			RestaurantInfo info = restaurantInfoMap.get(item.restaurantId());
			if (info == null)
				continue;
			boolean categoryOverlap = (info.category1() != null && recentCategories.contains(info.category1()))
				|| (info.category2() != null && recentCategories.contains(info.category2()))
				|| (info.category3() != null && recentCategories.contains(info.category3()));
			if (!categoryOverlap && item.score() > 0.0) {
				return item;
			}
		}

		// 겹치지 않는 카테고리 (점수 무관)
		for (ScoredRestaurant item : candidates) {
			RestaurantInfo info = restaurantInfoMap.get(item.restaurantId());
			if (info == null)
				continue;
			boolean categoryOverlap = (info.category1() != null && recentCategories.contains(info.category1()))
				|| (info.category2() != null && recentCategories.contains(info.category2()))
				|| (info.category3() != null && recentCategories.contains(info.category3()));
			if (!categoryOverlap) {
				return item;
			}
		}

		// 모두 겹치면 점수 높은 순으로 선택
		return candidates.get(0);
	}

	/**
	 * 카테고리 및 태그 다양성을 고려한 재배치
	 *
	 * 배치 단위로 카테고리와 태그가 다양하게 분산되도록 재배치합니다.
	 * - 첫 N개 배치는 높은 점수 위주로 유지
	 * - 나머지는 카테고리/태그 다양성을 고려하여 재배치
	 *
	 * @param sortedItems 점수순으로 정렬된 아이템 리스트
	 * @param candidateMap 식당 ID -> Candidate 맵 (카테고리 정보 포함)
	 * @return 재배치된 아이템 리스트
	 */
	private List<PersonalScoreResponse.ScoredItem> applyDiversity(
		List<PersonalScoreResponse.ScoredItem> sortedItems,
		Map<Long, PersonalScoreRequest.Candidate> candidateMap
	) {
		if (sortedItems.size() <= BATCH_SIZE * HIGH_SCORE_THRESHOLD_BATCHES) {
			// 아이템이 적으면 그냥 점수순 반환
			return sortedItems;
		}

		// 첫 N개는 높은 점수 그대로 유지
		int highScoreEnd = BATCH_SIZE * HIGH_SCORE_THRESHOLD_BATCHES;
		List<PersonalScoreResponse.ScoredItem> highScoreItems = new ArrayList<>(
			sortedItems.subList(0, highScoreEnd)
		);

		// 나머지 아이템들
		List<PersonalScoreResponse.ScoredItem> remainingItems = new ArrayList<>(
			sortedItems.subList(highScoreEnd, sortedItems.size())
		);

		// 카테고리 및 태그 정보 로딩
		Map<Long, RestaurantInfo> restaurantInfoMap = loadRestaurantInfo(
			remainingItems.stream().map(PersonalScoreResponse.ScoredItem::restaurantId).toList()
		);

		// 다양성 고려 재배치
		List<PersonalScoreResponse.ScoredItem> reorderedRemaining = reorderWithDiversity(
			remainingItems,
			restaurantInfoMap,
			candidateMap
		);

		// 합치기
		highScoreItems.addAll(reorderedRemaining);
		return highScoreItems;
	}

	/**
	 * 식당 정보 로딩 (카테고리 및 태그)
	 */
	private Map<Long, RestaurantInfo> loadRestaurantInfo(List<Long> restaurantIds) {
		if (restaurantIds.isEmpty()) {
			return Collections.emptyMap();
		}

		// 식당 정보 조회
		Map<Long, Restaurant> restaurantMap = restaurantRepository.findAllByIdIn(restaurantIds).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));

		// 태그 정보 조회
		Map<Long, List<RestaurantTag>> tagsByRestaurant = restaurantTagRepository
			.findByRestaurantIdIn(restaurantIds).stream()
			.collect(Collectors.groupingBy(RestaurantTag::getRestaurantId));

		// RestaurantInfo 맵 구성
		return restaurantIds.stream()
			.collect(Collectors.toMap(
				id -> id,
				id -> {
					Restaurant restaurant = restaurantMap.get(id);
					List<RestaurantTag> tags = tagsByRestaurant.getOrDefault(id, Collections.emptyList());
					return new RestaurantInfo(
						restaurant != null ? restaurant.getCategory1() : null,
						restaurant != null ? restaurant.getCategory2() : null,
						restaurant != null ? restaurant.getCategory3() : null,
						tags.stream().map(RestaurantTag::getTagId).collect(Collectors.toSet())
					);
				}
			));
	}

	/**
	 * 다양성을 고려한 재배치
	 *
	 * 배치 단위로 카테고리와 태그가 다양하게 분산되도록 재배치합니다.
	 */
	private List<PersonalScoreResponse.ScoredItem> reorderWithDiversity(
		List<PersonalScoreResponse.ScoredItem> items,
		Map<Long, RestaurantInfo> restaurantInfoMap,
		Map<Long, PersonalScoreRequest.Candidate> candidateMap
	) {
		if (items.isEmpty()) {
			return items;
		}

		List<PersonalScoreResponse.ScoredItem> result = new ArrayList<>();
		List<PersonalScoreResponse.ScoredItem> remaining = new ArrayList<>(items);

		// 배치 단위로 처리
		while (!remaining.isEmpty()) {
			PersonalScoreResponse.ScoredItem selected = selectNextItem(
				remaining,
				result,
				restaurantInfoMap,
				candidateMap
			);
			result.add(selected);
			remaining.remove(selected);
		}

		return result;
	}

	/**
	 * 다음 배치에 포함할 아이템 선택
	 *
	 * 현재 배치의 마지막 아이템들과 겹치지 않는 카테고리/태그를 가진 아이템을 우선 선택합니다.
	 */
	private PersonalScoreResponse.ScoredItem selectNextItem(
		List<PersonalScoreResponse.ScoredItem> candidates,
		List<PersonalScoreResponse.ScoredItem> selected,
		Map<Long, RestaurantInfo> restaurantInfoMap,
		Map<Long, PersonalScoreRequest.Candidate> candidateMap
	) {
		if (candidates.isEmpty()) {
			return null;
		}

		// 최근 선택된 아이템들의 카테고리와 태그 추출 (배치 크기만큼)
		int lookbackSize = Math.min(BATCH_SIZE, selected.size());
		Set<String> recentCategories = new HashSet<>();
		Set<Long> recentTagIds = new HashSet<>();

		for (int i = selected.size() - lookbackSize; i < selected.size(); i++) {
			if (i >= 0) {
				Long restaurantId = selected.get(i).restaurantId();
				RestaurantInfo info = restaurantInfoMap.get(restaurantId);
				if (info != null) {
					if (info.category1() != null)
						recentCategories.add(info.category1());
					if (info.category2() != null)
						recentCategories.add(info.category2());
					if (info.category3() != null)
						recentCategories.add(info.category3());
					recentTagIds.addAll(info.tagIds());
				}
			}
		}

		// 다양성 조건을 만족하는 아이템들 중 점수가 높은 것 우선 선택
		PersonalScoreResponse.ScoredItem bestDiverseItem = null;
		double bestDiverseScore = Double.NEGATIVE_INFINITY;

		for (PersonalScoreResponse.ScoredItem item : candidates) {
			RestaurantInfo info = restaurantInfoMap.get(item.restaurantId());
			if (info == null) {
				continue;
			}

			// 카테고리 겹침 확인
			boolean categoryOverlap = (info.category1() != null && recentCategories.contains(info.category1()))
				|| (info.category2() != null && recentCategories.contains(info.category2()))
				|| (info.category3() != null && recentCategories.contains(info.category3()));

			// 태그 겹침 확인 (최소 2개 이상 겹치면 제외)
			long tagOverlapCount = info.tagIds().stream()
				.filter(recentTagIds::contains)
				.count();
			boolean significantTagOverlap = tagOverlapCount >= 2;

			// 다양성 조건을 만족하고 점수가 더 높으면 선택
			if (!categoryOverlap && !significantTagOverlap) {
				if (item.score() > bestDiverseScore) {
					bestDiverseScore = item.score();
					bestDiverseItem = item;
				}
			}
		}

		// 다양성 조건을 만족하는 아이템이 있으면 반환
		if (bestDiverseItem != null) {
			return bestDiverseItem;
		}

		// 모두 겹치면 점수 높은 순으로 선택
		return candidates.get(0);
	}

	/**
	 * 식당 정보 (카테고리 및 태그)
	 */
	private record RestaurantInfo(
		String category1,
		String category2,
		String category3,
		Set<Long> tagIds
	) {
	}

	/**
	 * 개인화 점수 계산 결과를 조회합니다.
	 *
	 * 사용자 태그 선호도와 후보 식당을 기반으로 개인화 점수를 계산합니다.
	 *
	 * @param userId 사용자 ID
	 * @param top 상위 N개 식당 반환
	 * @param debug 디버그 정보 포함 여부
	 * @param ctx 컨텍스트 정보 (위치, 반경 등)
	 * @return 점수 계산 결과를 담은 응답 DTO
	 */
	@Override
	public PersonalScoreResponse getPersonalFeed(long userId, int top, boolean debug, Map<String, Object> ctx) {
		// UserTagPrefRepository의 TagStat을 TagPreference로 변환
		var userTagStats = userTagPrefRepository.getUserTagStats(userId);
		
		// user_tag_pref 확인 (문제가 있을 때만 경고)
		if (userTagStats == null || userTagStats.isEmpty()) {
			log.warn("[MainQueryService.getPersonalFeed] user_tag_pref is empty: userId={}", userId);
		}
		
		var userTagPref = userTagStats.entrySet().stream()
			.collect(Collectors.toMap(
				Map.Entry::getKey,
				e -> new PersonalScoreRequest.TagPreference(
					(float)e.getValue().score(),
					(float)e.getValue().confidence()
				)
			));
		var candidates = candidateRepository.getCandidates(userId, ctx);
		var req = PersonalScoreRequest.of(userId, userTagPref, candidates);
		// ML 모델 사용 (기본값: ml_v1)
		var res = scoreEngineHttpClient.score(req, "ml_v1");

		// 점수 높은 순으로 정렬 (내림차순)
		var sortedItems = res.items().stream()
			.sorted((a, b) -> Double.compare(b.score(), a.score()))
			.toList();

		// Top N 컷
		var finalItems = sortedItems.size() > top
			? sortedItems.subList(0, top)
			: sortedItems;

		return new PersonalScoreResponse(finalItems, res.debug());
	}

	@Override
	public com.jde.mainserver.main.web.dto.response.LastSelectedRestaurantResponse getLastSelectedRestaurant(
		Long userId) {
		// 최근 SELECT 액션으로 선택한 식당 상태 조회
		var stateOpt = userRestaurantStateRepository.findLastSelectedByUserId(userId);
		if (stateOpt.isEmpty()) {
			return null;
		}

		var state = stateOpt.get();

		// 방문 피드백을 처리한 경우(is_visited가 null이 아닌 경우) 최근 선택 식당으로 노출하지 않음
		if (state.getIsVisited() != null) {
			return null;
		}

		// 선택한지 하루(24시간) 이상 지났을 때만 반환
		if (state.getLastSwipeAt() != null) {
			var now = java.time.Instant.now();
			var oneDayAgo = now.minusSeconds(24 * 60 * 60); // 24시간 전
			if (state.getLastSwipeAt().isAfter(oneDayAgo)) {
				// 하루가 지나지 않았으면 null 반환
				return null;
			}
		}

		Long restaurantId = state.getId().getRestaurantId();

		// 식당 정보 조회
		var restaurantOpt = restaurantRepository.findById(restaurantId);
		if (restaurantOpt.isEmpty()) {
			return null;
		}

		var restaurant = restaurantOpt.get();

		return com.jde.mainserver.main.web.dto.response.LastSelectedRestaurantResponse.builder()
			.restaurantId(restaurantId)
			.name(restaurant.getName())
			.build();
	}

	/** 식당 ID와 메타정보 (거리, 영업 상태 등) - Redis 직렬화를 위해 일반 클래스로 정의 */
	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	public static class RestaurantWithMeta implements Serializable {
		private static final long serialVersionUID = 1L;
		private Long restaurantId;
		private Integer distanceM;
		private Boolean isOpen;
		private Map<String, Object> debug; // 점수 계산 상세 정보
	}

	/**
	 * 게스트/신규 사용자용 후보 확장: withInfo(평점>0 또는 리뷰수>0) 후보가 충분할 때까지 반경/수량 확장
	 */
	private List<PersonalScoreRequest.Candidate> expandCandidatesUntilSufficient(Long userId,
		Map<String, Object> baseCtx) {
		final int target = POOL_SIZE; // 목표 withInfo 수
		final int maxExpansions = 2;  // 최대 확장 횟수
		final double radiusMultiplier = 2.0; // 반경 배수
		final int maxCandidatesStep = 150;   // maxCandidates 증가분

		Map<String, Object> ctx = new HashMap<>(baseCtx == null ? Map.of() : baseCtx);
		ctx.putIfAbsent("maxCandidates", 100);
		ctx.putIfAbsent("radiusM", 5000.0);

		for (int i = 0; i <= maxExpansions; i++) {
			List<PersonalScoreRequest.Candidate> cands = candidateRepository.getCandidates(userId == null ? 0L : userId,
				ctx);
			int withInfoCount = countWithInfo(cands);
			if (withInfoCount >= target)
				return cands;

			// 확장: 반경/수량 증가
			int newMax = ((Number)ctx.get("maxCandidates")).intValue() + maxCandidatesStep;
			double newRadius = ((Number)ctx.get("radiusM")).doubleValue() * radiusMultiplier;
			ctx.put("maxCandidates", newMax);
			ctx.put("radiusM", newRadius);
		}
		// 확장 후에도 부족하면 마지막 결과 반환
		return candidateRepository.getCandidates(userId == null ? 0L : userId, ctx);
	}

	private int countWithInfo(List<PersonalScoreRequest.Candidate> candidates) {
		if (candidates == null || candidates.isEmpty())
			return 0;
		List<Long> ids = candidates.stream().map(PersonalScoreRequest.Candidate::restaurantId).toList();
		Map<Long, Restaurant> map = restaurantRepository.findAllByIdIn(ids).stream()
			.collect(Collectors.toMap(Restaurant::getId, r -> r));
		int cnt = 0;
		for (PersonalScoreRequest.Candidate c : candidates) {
			Restaurant r = map.get(c.restaurantId());
			if (r == null)
				continue;
			BigDecimal rating = r.getKakaoRating();
			Integer reviewCnt = r.getKakaoReviewCnt();
			if ((rating != null && rating.doubleValue() > 0.0) || (reviewCnt != null && reviewCnt > 0))
				cnt++;
		}
		return cnt;
	}

	@Override
	public double[] getCoordinates(Long userId) {
		Long regionId = getRegionId(userId);
		Region region = regionRepository.findById(regionId)
			.orElseThrow(() -> new RestaurantException(RestaurantErrorCode.NOT_FOUND_REGION));

		Point geom = region.getGeom();
		if (geom == null) {
			throw new RestaurantException(RestaurantErrorCode.NOT_FOUND_REGION);
		}

		return new double[]{geom.getX(), geom.getY()};
	}

	private Long getRegionId(Long userId) {
		if (userId == null) {
			return 1L;
		}

		return memberRepository.findById(userId)
			.map(member -> member.getRegion() != null ? member.getRegion().getId() : 1L)
			.orElse(1L);
	}
}

