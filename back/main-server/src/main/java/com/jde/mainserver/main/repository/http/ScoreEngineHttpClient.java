/**
 * main/repository/http/ScoreEngineHttpClient.java
 * FastAPI 점수 엔진 HTTP 클라이언트 (외부 API 데이터 접근)
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.repository.http;

import com.jde.mainserver.main.converter.MainConverter;
import com.jde.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.jde.mainserver.main.web.dto.response.PersonalScoreResponse;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.netty.http.client.HttpClient;
import reactor.util.retry.Retry;
import io.netty.channel.ChannelOption;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ScoreEngineHttpClient {

	private static final String SCORE_ENDPOINT = "/score/personal";
	private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
	private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(10);
	private static final int MAX_RETRIES = 2;

	private final WebClient webClient;

	public ScoreEngineHttpClient(
		@Value("${score.api.base:http://localhost:8000}") String baseUrl
	) {
		HttpClient httpClient = HttpClient.create()
			.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, (int)CONNECT_TIMEOUT.toMillis())
			.responseTimeout(RESPONSE_TIMEOUT)
			.compress(true);

		this.webClient = WebClient.builder()
			.baseUrl(baseUrl)
			.clientConnector(new ReactorClientHttpConnector(httpClient))
			.build();
	}

	/**
	 * FastAPI 점수 엔진에 점수 계산 요청
	 *
	 * @param req 개인화 점수 계산 요청 (유저/후보 식당/태그 등 정보 포함)
	 * @return 점수 계산 결과 (식당별 점수 + 디버그 메타 정보)
	 */
	public PersonalScoreResponse score(PersonalScoreRequest req) {
		try {
			Map<String, Object> fastApiReq = MainConverter.convertToFastApiSchema(req);

			@SuppressWarnings("unchecked")
			Map<String, Object> response = webClient.post()
				.uri(SCORE_ENDPOINT)
				.bodyValue(fastApiReq)
				.retrieve()
				.bodyToMono(Map.class)
				.retryWhen(Retry.backoff(MAX_RETRIES, Duration.ofSeconds(1)))
				.timeout(RESPONSE_TIMEOUT)
				.block();

			if (response == null) {
				throw new RuntimeException("FastAPI 응답이 null입니다");
			}

			return convertResponse(response);

		} catch (Exception e) {
			log.error("FastAPI 점수 계산 실패: userId={}, error={}, message={}",
				req.userId(), e.getClass().getSimpleName(), e.getMessage(), e);
			throw new RuntimeException("FastAPI 점수 계산 실패: " + e.getMessage(), e);
		}
	}

	/**
	 * FastAPI 응답(Map)을 PersonalScoreResponse로 변환
	 *
	 * 응답 예시:
	 * {
	 *   "scores": [
	 *     { "restaurant_id": 1, "score": 0.87, "debug": { ... } },
	 *     ...
	 *   ],
	 *   "algo_version": "v1",
	 *   "elapsed_ms": 34
	 * }
	 */
	private PersonalScoreResponse convertResponse(Map<String, Object> response) {
		@SuppressWarnings("unchecked")
		List<Map<String, Object>> scores = (List<Map<String, Object>>)response.getOrDefault("scores", List.of());

		List<PersonalScoreResponse.ScoredItem> items = scores.stream()
			.map(scoreMap -> {
				Long restaurantId = ((Number)scoreMap.get("restaurant_id")).longValue();
				double score = ((Number)scoreMap.get("score")).doubleValue();

				Map<String, Object> reasons = extractDebug(scoreMap.get("debug"));

				return new PersonalScoreResponse.ScoredItem(restaurantId, score, reasons);
			})
			.toList();

		Map<String, Object> debug = Map.of(
			"algo_version", response.getOrDefault("algo_version", "unknown"),
			"elapsed_ms", response.getOrDefault("elapsed_ms", 0)
		);

		return new PersonalScoreResponse(items, debug);
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> extractDebug(Object debugObj) {
		if (debugObj instanceof Map<?, ?> debugMap && !debugMap.isEmpty()) {
			return (Map<String, Object>)debugMap;
		}
		return null;
	}
}

