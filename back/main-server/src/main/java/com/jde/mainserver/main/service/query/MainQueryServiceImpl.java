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

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.SerializationException;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MainQueryServiceImpl implements MainQueryService {
	private static final int POOL_SIZE = 100; // 점수 계산할 큰 풀
	private static final int BATCH_SIZE = 10; // 한 번에 전달할 배치 크기
	private static final int HIGH_SCORE_THRESHOLD_BATCHES = 2; // 처음 몇 배치는 높은 점수 위주
	private static final String REDIS_KEY_PREFIX = "feed:pool:user:";
	private static final Duration CACHE_TTL = Duration.ofHours(1); // 캐시 유지 시간

	private final UserTagPrefRepository userTagPrefRepository;
	private final CandidateRepository candidateRepository;
	private final ScoreEngineHttpClient scoreEngineHttpClient;
	private final RestaurantRepository restaurantRepository;
	private final RestaurantTagRepository restaurantTagRepository;
	private final RedisTemplate<String, Object> redisTemplate;
	private final UserRestaurantStateRepository userRestaurantStateRepository;

	public MainQueryServiceImpl(
		UserTagPrefRepository userTagPrefRepository,
		CandidateRepository candidateRepository,
		ScoreEngineHttpClient scoreEngineHttpClient,
		RestaurantRepository restaurantRepository,
		RestaurantTagRepository restaurantTagRepository,
		RedisTemplate<String, Object> redisTemplate,
		UserRestaurantStateRepository userRestaurantStateRepository
	) {
		this.userTagPrefRepository = userTagPrefRepository;
		this.candidateRepository = candidateRepository;
		this.scoreEngineHttpClient = scoreEngineHttpClient;
		this.restaurantRepository = restaurantRepository;
		this.restaurantTagRepository = restaurantTagRepository;
		this.redisTemplate = redisTemplate;
		this.userRestaurantStateRepository = userRestaurantStateRepository;
	}

	/** 피드 배치 조회 (cursor 없으면 첫 요청, 숫자면 해당 인덱스부터) */
	@Override
	public FeedResponse getFeedBatch(long userId, String cursor, Map<String, Object> ctx) {
		// Redis 키 생성 (사용자별)
		String redisKey = REDIS_KEY_PREFIX + userId;

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

		// 피드 진입 시마다 새로 갱신 (cursor가 null이거나 0일 때)
		// 또는 캐시가 없을 때만 새로 생성
		List<RestaurantWithMeta> pool;
		if (isFirstRequest) {
			// 첫 요청이면 새로 생성하고 Redis에 저장
			pool = preparePool(userId, ctx);
			redisTemplate.opsForValue().set(redisKey, pool, CACHE_TTL);
			log.debug("피드 풀 생성 및 Redis 저장: userId={}, poolSize={}", userId, pool.size());
		} else {
			// Redis에서 조회
			try {
				Object cachedObj = redisTemplate.opsForValue().get(redisKey);
				if (cachedObj == null) {
					// 캐시가 없으면 새로 생성
					pool = preparePool(userId, ctx);
					redisTemplate.opsForValue().set(redisKey, pool, CACHE_TTL);
					log.debug("피드 풀 재생성 및 Redis 저장: userId={}, poolSize={}", userId, pool.size());
				} else {
					// 타입 안전하게 변환
					try {
						@SuppressWarnings("unchecked")
						List<Map<String, Object>> cachedList = (List<Map<String, Object>>)cachedObj;
						pool = cachedList.stream()
							.map(map -> {
								Object restaurantIdObj = map.get("restaurantId");
								Object distanceMObj = map.get("distanceM");
								Object isOpenObj = map.get("isOpen");

								return new RestaurantWithMeta(
									restaurantIdObj != null ? ((Number)restaurantIdObj).longValue() : null,
									distanceMObj != null ? ((Number)distanceMObj).intValue() : null,
									isOpenObj != null ? (Boolean)isOpenObj : null
								);
							})
							.filter(meta -> meta.getRestaurantId() != null)
							.toList();
						log.debug("피드 풀 Redis에서 조회: userId={}, poolSize={}", userId, pool.size());
					} catch (ClassCastException | NullPointerException e) {
						// 캐시 형식이 맞지 않으면 삭제하고 재생성
						log.warn("Redis 캐시 형식 불일치, 재생성: userId={}, error={}", userId, e.getMessage());
						redisTemplate.delete(redisKey);
						pool = preparePool(userId, ctx);
						redisTemplate.opsForValue().set(redisKey, pool, CACHE_TTL);
						log.debug("피드 풀 재생성 및 Redis 저장: userId={}, poolSize={}", userId, pool.size());
					}
				}
			} catch (SerializationException e) {
				// 역직렬화 실패 시 캐시 삭제하고 재생성
				log.warn("Redis 역직렬화 실패, 캐시 삭제 후 재생성: userId={}, error={}", userId, e.getMessage());
				redisTemplate.delete(redisKey);
				pool = preparePool(userId, ctx);
				redisTemplate.opsForValue().set(redisKey, pool, CACHE_TTL);
				log.debug("피드 풀 재생성 및 Redis 저장: userId={}, poolSize={}", userId, pool.size());
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

		// 순서 유지하며 식당 정보 리스트 생성 (거리, 영업 상태 업데이트)
		List<FeedResponse.RestaurantItem> feedItems = batchRestaurants.stream()
			.map(meta -> {
				Restaurant restaurant = restaurantMap.get(meta.getRestaurantId());
				return MainConverter.toFeedItem(
					restaurant,
					meta.getDistanceM(),
					meta.getIsOpen()
				);
			})
			.filter(java.util.Objects::nonNull)
			.toList();

		// 다음 커서 생성: 다음 배치의 시작 인덱스 (숫자만)
		String nextCursor = endIdx < pool.size() ? String.valueOf(endIdx) : null;

		return new FeedResponse(feedItems, nextCursor);
	}

	private List<RestaurantWithMeta> preparePool(long userId, Map<String, Object> ctx) {
		// 1. 후보 생성
		// UserTagPrefRepository의 TagStat을 TagPreference로 변환
		var userTagStats = userTagPrefRepository.getUserTagStats(userId);
		var userTagPref = userTagStats.entrySet().stream()
			.collect(Collectors.toMap(
				Map.Entry::getKey,
				e -> new PersonalScoreRequest.TagPreference(
					(float)e.getValue().score(),
					(float)e.getValue().confidence()
				)
			));
		var candidates = candidateRepository.getCandidates(userId, ctx);

		// Candidate를 Map으로 변환 (식당 ID -> Candidate)
		Map<Long, PersonalScoreRequest.Candidate> candidateMap = candidates.stream()
			.collect(Collectors.toMap(
				PersonalScoreRequest.Candidate::restaurantId,
				c -> c
			));

		// 2. 점수 계산
		var req = PersonalScoreRequest.of(userId, userTagPref, candidates);
		var res = scoreEngineHttpClient.score(req);

		// 3. 점수순 정렬
		var sortedItems = res.items().stream()
			.sorted((a, b) -> Double.compare(b.score(), a.score()))
			.collect(Collectors.toList());

		// 4. 풀 크기 제한
		var limitedPool = sortedItems.size() > POOL_SIZE
			? sortedItems.subList(0, POOL_SIZE)
			: sortedItems;

		// 5. 다양성 고려 재배치 (카테고리 및 태그 기반)
		var reorderedItems = applyDiversity(limitedPool, candidateMap);

		// 6. 식당 ID와 메타정보 추출
		return reorderedItems.stream()
			.map(item -> {
				PersonalScoreRequest.Candidate candidate = candidateMap.get(item.restaurantId());
				if (candidate == null) {
					return new RestaurantWithMeta(
						item.restaurantId(),
						0,
						false
					);
				}
				return new RestaurantWithMeta(
					item.restaurantId(),
					candidate.distanceM() != null ? candidate.distanceM().intValue() : null,
					candidate.isOpen()
				);
			})
			.toList();
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

		// 겹치지 않는 아이템 우선 선택
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

			// 겹치지 않으면 우선 선택
			if (!categoryOverlap && !significantTagOverlap) {
				return item;
			}
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
		var userTagPref = userTagStats.entrySet().stream()
			.collect(java.util.stream.Collectors.toMap(
				java.util.Map.Entry::getKey,
				e -> new PersonalScoreRequest.TagPreference(
					(float)e.getValue().score(),
					(float)e.getValue().confidence()
				)
			));
		var candidates = candidateRepository.getCandidates(userId, ctx);
		var req = PersonalScoreRequest.of(userId, userTagPref, candidates);
		var res = scoreEngineHttpClient.score(req);

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
	public com.jde.mainserver.main.web.dto.response.LastSelectedRestaurantResponse getLastSelectedRestaurant(Long userId) {
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
	}
}

