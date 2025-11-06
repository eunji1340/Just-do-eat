package com.jde.mainserver.main.service.query;

/**
 * main/service/query/FeedService.java
 * 피드 무한 스크롤 서비스
 * Author: Jang
 * Date: 2025-11-04
 */


import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.main.web.dto.response.PersonalScoreResponse;
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

/** 피드 무한 스크롤 조회 서비스 */
@Slf4j
@Service
public class FeedService {
    private static final int POOL_SIZE = 100; // 점수 계산할 큰 풀
    private static final int BATCH_SIZE = 10; // 한 번에 전달할 배치 크기
    private static final int HIGH_SCORE_THRESHOLD_BATCHES = 2; // 처음 몇 배치는 높은 점수 위주
    private static final String REDIS_KEY_PREFIX = "feed:pool:user:";
    private static final Duration CACHE_TTL = Duration.ofHours(1); // 캐시 유지 시간

    private final UserTagPrefProvider userTagPrefProvider;
    private final CandidateRetrievalService cands;
    private final ScoreEngineClient scorer;
    private final RestaurantRepository restaurantRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public FeedService(
            UserTagPrefProvider userTagPrefProvider,
            CandidateRetrievalService cands,
            ScoreEngineClient scorer,
            RestaurantRepository restaurantRepository,
            RedisTemplate<String, Object> redisTemplate
    ) {
        this.userTagPrefProvider = userTagPrefProvider;
        this.cands = cands;
        this.scorer = scorer;
        this.restaurantRepository = restaurantRepository;
        this.redisTemplate = redisTemplate;
    }

    /** 피드 배치 조회 (cursor 없으면 첫 요청, 숫자면 해당 인덱스부터) */
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
                        List<Map<String, Object>> cachedList = (List<Map<String, Object>>) cachedObj;
                        pool = cachedList.stream()
                                .map(map -> {
                                    Object restaurantIdObj = map.get("restaurantId");
                                    Object distanceMObj = map.get("distanceM");
                                    Object isOpenObj = map.get("isOpen");

                                    return new RestaurantWithMeta(
                                            restaurantIdObj != null ? ((Number) restaurantIdObj).longValue() : null,
                                            distanceMObj != null ? ((Number) distanceMObj).intValue() : null,
                                            isOpenObj != null ? (Boolean) isOpenObj : null
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
            // 더 이상 데이터 없음
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
                    if (restaurant == null) return null;

                    // Entity를 FeedResponse.RestaurantItem으로 변환
                    return new FeedResponse.RestaurantItem(
                            restaurant.getId(),
                            restaurant.getName(),
                            restaurant.getAddress(),
                            restaurant.getPhone(),
                            restaurant.getSummary(),
                            restaurant.getImages(), // JSONB
                            restaurant.getCategory(),
                            restaurant.getRating() != null ? restaurant.getRating().floatValue() : null,
                            restaurant.getPriceRange() != null ? restaurant.getPriceRange().name() : null,
                            restaurant.getWebsiteUrl(),
                            restaurant.getMenu(), // JSONB
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
        // 1. 후보 생성 (더 많은 후보 필요 시 CandidateRetrievalService 확장)
        // UserTagPrefProvider의 TagStat을 TagPreference로 변환
        var userTagStats = userTagPrefProvider.getUserTagStats(userId);
        var userTagPref = userTagStats.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> new PersonalScoreRequest.TagPreference(
                                (float) e.getValue().score(),
                                (float) e.getValue().confidence()
                        )
                ));
        var candidates = cands.getCandidates(userId, ctx);

        // Candidate를 Map으로 변환 (식당 ID -> Candidate)
        Map<Long, PersonalScoreRequest.Candidate> candidateMap = candidates.stream()
                .collect(Collectors.toMap(
                        PersonalScoreRequest.Candidate::restaurantId,
                        c -> c
                ));

        // 2. 점수 계산
        var req = PersonalScoreRequest.of(userId, userTagPref, candidates);
        var res = scorer.score(req);

        // 3. 점수순 정렬
        var sortedItems = res.items().stream()
                .sorted((a, b) -> Double.compare(b.score(), a.score()))
                .collect(Collectors.toList());

        // 4. 풀 크기 제한
        var limitedPool = sortedItems.size() > POOL_SIZE
                ? sortedItems.subList(0, POOL_SIZE)
                : sortedItems;

        // 5. 다양성 고려 재배치
        var reorderedItems = applyDiversity(limitedPool);

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

    private List<PersonalScoreResponse.ScoredItem> applyDiversity(
            List<PersonalScoreResponse.ScoredItem> sortedItems
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

        // 나머지는 점수순 유지 (실제로는 태그/카테고리 다양성을 고려할 수 있음)
        // TODO: 향후 태그 다양성, 카테고리 분산 등을 고려한 재배치 로직 추가 가능
        List<PersonalScoreResponse.ScoredItem> remainingItems = new ArrayList<>(
                sortedItems.subList(highScoreEnd, sortedItems.size())
        );

        // 합치기
        highScoreItems.addAll(remainingItems);
        return highScoreItems;
    }

    /** 캐시 초기화 */
    public void clearPoolCache(long userId) {
        String redisKey = REDIS_KEY_PREFIX + userId;
        Boolean deleted = redisTemplate.delete(redisKey);
        log.debug("피드 풀 캐시 삭제: userId={}, deleted={}", userId, deleted);
    }

    /** 캐시 전체 초기화 */
    public void clearAllCache() {
        Set<String> keys = redisTemplate.keys(REDIS_KEY_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            Long deleted = redisTemplate.delete(keys);
            log.info("피드 풀 캐시 전체 삭제: {}개 키 삭제됨", deleted);
        }
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

