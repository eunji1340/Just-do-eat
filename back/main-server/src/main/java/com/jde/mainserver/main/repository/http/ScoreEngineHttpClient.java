package com.jde.mainserver.main.repository.http;

/**
 * main/repository/http/ScoreEngineHttpClient.java
 * FastAPI 점수 엔진 HTTP 클라이언트
 * Author: Jang
 * Date: 2025-11-04
 */


import com.jde.mainserver.main.converter.FastApiConverter;
import com.jde.mainserver.main.service.query.ScoreEngineClient;
import com.jde.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.jde.mainserver.main.web.dto.response.PersonalScoreResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;


@Slf4j
@Component
public class ScoreEngineHttpClient implements ScoreEngineClient {

    private final WebClient webClient;
    private final FastApiConverter converter;
    private final String baseUrl;
    private static final String SCORE_ENDPOINT = "/score/personal";

    public ScoreEngineHttpClient(
            @Value("${score.api.base:http://localhost:8000}") String baseUrl,
            FastApiConverter converter
    ) {
        this.baseUrl = baseUrl;
        this.converter = converter;
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    /**
     * FastAPI 점수 엔진에 점수 계산 요청
     * @param req 개인화 점수 계산 요청
     * @return 점수 계산 결과
     * @throws RuntimeException FastAPI 호출 실패 시
     */
    @Override
    public PersonalScoreResponse score(PersonalScoreRequest req) {
        try {
            log.debug("FastAPI 점수 계산 요청: userId={}, candidateCount={}",
                    req.userId(), req.candidates().size());

            // 1. 백엔드 DTO를 FastAPI 스키마로 변환
            Map<String, Object> fastApiReq = converter.convertToFastApiSchema(req);

            // 2. FastAPI 호출
            Map<String, Object> response = webClient.post()
                    .uri(SCORE_ENDPOINT)
                    .bodyValue(fastApiReq)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .retryWhen(Retry.backoff(2, Duration.ofSeconds(1)))
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (response == null) {
                throw new RuntimeException("FastAPI 응답이 null입니다");
            }

            // 3. FastAPI 응답을 PersonalScoreResponse로 변환
            PersonalScoreResponse result = convertResponse(response);

            // 디버깅: 점수 확인 (첫 3개만)
            log.debug("FastAPI 점수 계산 완료: userId={}, top3 scores:", req.userId());
            result.items().stream()
                    .limit(3)
                    .forEach(item -> log.debug("  Restaurant {}: {}", item.restaurantId(), item.score()));

            return result;

        } catch (Exception e) {
            log.error("FastAPI 점수 계산 실패: userId={}, error={}", req.userId(), e.getMessage(), e);
            throw new RuntimeException("FastAPI 점수 계산 실패: " + e.getMessage(), e);
        }
    }

    /**
     * FastAPI 응답을 PersonalScoreResponse로 변환
     * FastAPI 응답 형식:
     * {
     *   "scores": [{"restaurant_id": ..., "score": ..., "debug": {...}}],
     *   "algo_version": "...",
     *   "elapsed_ms": ...
     * }
     * @param response FastAPI 응답 Map
     * @return PersonalScoreResponse
     */
    @SuppressWarnings("unchecked")
    private PersonalScoreResponse convertResponse(Map<String, Object> response) {
        List<Map<String, Object>> scores = (List<Map<String, Object>>) response.getOrDefault("scores", List.of());

        List<PersonalScoreResponse.ScoredItem> items = scores.stream()
                .map(scoreMap -> {
                    Long restaurantId = ((Number) scoreMap.get("restaurant_id")).longValue();
                    double score = ((Number) scoreMap.get("score")).doubleValue();
                    Map<String, Object> reasons = (Map<String, Object>) scoreMap.getOrDefault("debug", Map.of());

                    return new PersonalScoreResponse.ScoredItem(
                            restaurantId,
                            score,
                            reasons
                    );
                })
                .toList();

        // debug 정보 (전체 메타데이터)
        Map<String, Object> debug = Map.of(
                "algo_version", response.getOrDefault("algo_version", "unknown"),
                "elapsed_ms", response.getOrDefault("elapsed_ms", 0)
        );

        return new PersonalScoreResponse(items, debug);
    }
}

