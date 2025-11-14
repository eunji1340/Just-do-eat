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
import com.jde.mainserver.plan.web.dto.request.GroupScoreReqeust;
import com.jde.mainserver.plan.web.dto.response.GroupScoreResponse;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.netty.http.client.HttpClient;
import reactor.util.retry.Retry;
import io.netty.channel.ChannelOption;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ScoreEngineHttpClient {

	private static final String SCORE_ENDPOINT_PERSONAL = "/score/personal";
	private static final String SCORE_ENDPOINT_GROUP = "/score/group";
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
				.uri(SCORE_ENDPOINT_PERSONAL)
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

	/**
	 * FastAPI 그룹 점수 엔진에 점수 계산 요청
	 *
	 * @param req 그룹 점수 계산 요청 (참여자들/후보 식당/태그 등 정보 포함)
	 * @return 점수 계산 결과 (식당별 그룹 점수 맵)
	 */
	public GroupScoreResponse groupScore(GroupScoreReqeust req) {
		try {
			Map<String, Object> fastApiReq = convertGroupScoreToFastApiSchema(req);

			@SuppressWarnings("unchecked")
			Map<String, Object> response = webClient.post()
				.uri(SCORE_ENDPOINT_GROUP)
				.bodyValue(fastApiReq)
				.retrieve()
				.bodyToMono(Map.class)
				.retryWhen(Retry.backoff(MAX_RETRIES, Duration.ofSeconds(1)))
				.timeout(RESPONSE_TIMEOUT)
				.block();

			if (response == null) {
				throw new RuntimeException("FastAPI 응답이 null입니다");
			}

			return convertGroupScoreResponse(response);

		} catch (Exception e) {
			log.error("FastAPI 그룹 점수 계산 실패: planId={}, error={}, message={}",
				req, e.getClass().getSimpleName(), e.getMessage(), e);
			throw new RuntimeException("FastAPI 그룹 점수 계산 실패: " + e.getMessage(), e);
		}
	}

	/**
	 * GroupScoreRequest를 FastAPI 스키마로 변환
	 *
	 * FastAPI 요청 예시:
	 * {
	 *   "members": [
	 *     {
	 *       "user_id": 1,
	 *       "tag_pref": {
	 *         10: { "score": 0.8, "confidence": 0.9 }
	 *       }
	 *     }
	 *   ],
	 *   "candidates": [
	 *     {
	 *       "restaurant_id": 1001,
	 *       "distance_m": 420.0,
	 *       "tag_pref": {
	 *         10: { "weight": 0.9, "confidence": 0.8 }
	 *       },
	 *       "pref_score": 0.7
	 *     }
	 *   ],
	 *   "debug": true
	 * }
	 */
	private Map<String, Object> convertGroupScoreToFastApiSchema(GroupScoreReqeust req) {
		if (req.getMembers() == null || req.getMembers().isEmpty()) {
			throw new IllegalArgumentException("members는 최소 1개 이상 필요합니다");
		}
		if (req.getCandidates() == null || req.getCandidates().isEmpty()) {
			throw new IllegalArgumentException("candidates는 최소 1개 이상 필요합니다");
		}

		Map<String, Object> fastApiReq = new HashMap<>();

		// members 변환
		List<Map<String, Object>> members = req.getMembers().stream()
			.map(member -> {
				Map<String, Object> memberMap = new HashMap<>();
				memberMap.put("user_id", member.getUserId());

				// user_tag_pref: Map<Long, TagPreference> -> Map<Integer, Map<String, Float>>
				Map<Integer, Map<String, Float>> tagPref = new HashMap<>();
				if (member.getTagPref() != null) {
					member.getTagPref().forEach((tagId, pref) -> {
						Map<String, Float> prefMap = new HashMap<>();
						prefMap.put("score", pref.getScore() != null ? pref.getScore() : 0.0f);
						prefMap.put("confidence", pref.getConfidence() != null ? pref.getConfidence() : 0.0f);
						tagPref.put(tagId.intValue(), prefMap);
					});
				}
				memberMap.put("tag_pref", tagPref);

				return memberMap;
			})
			.collect(Collectors.toList());

		// candidates 변환
		List<Map<String, Object>> candidates = req.getCandidates().stream()
			.map(cand -> {
				Map<String, Object> candMap = new HashMap<>();
				candMap.put("restaurant_id", cand.getRestaurantId());
				candMap.put("distance_m", cand.getDistanceM() != null ? cand.getDistanceM() : 0.0f);

				// 식당 태그 정보: Map<Long, TagPreference> -> Map<Integer, Map<String, Float>>
				Map<Integer, Map<String, Float>> candTagPref = new HashMap<>();
				if (cand.getTagPref() != null) {
					cand.getTagPref().forEach((tagId, pref) -> {
						Map<String, Float> prefMap = new HashMap<>();
						prefMap.put("weight", pref.getWeight() != null ? pref.getWeight() : 0.0f);
						prefMap.put("confidence", pref.getConfidence() != null ? pref.getConfidence() : 0.0f);
						candTagPref.put(tagId.intValue(), prefMap);
					});
				}
				candMap.put("tag_pref", candTagPref);

				// pref_score
				if (cand.getPrefScore() != null) {
					candMap.put("pref_score", cand.getPrefScore());
				} else {
					candMap.put("pref_score", null);
				}

				return candMap;
			})
			.collect(Collectors.toList());

		fastApiReq.put("members", members);
		fastApiReq.put("candidates", candidates);
		fastApiReq.put("debug", req.getDebug() != null ? req.getDebug() : false);

		return fastApiReq;
	}

	/**
	 * FastAPI 그룹 점수 응답을 GroupScoreResponse로 변환
	 *
	 * 응답 예시:
	 * {
	 *   "results": [
	 *     { "restaurant_id": 1, "per_user": {1: 0.87, 2: 0.82}, "group_score": 0.845, "debug": {...} },
	 *     ...
	 *   ],
	 *   "algo_version": "v1",
	 *   "elapsed_ms": 34
	 * }
	 *
	 * 변환 후:
	 * {
	 *   "scores": {
	 *     1: 0.845,
	 *     2: 0.78,
	 *     ...
	 *   }
	 * }
	 */
	@SuppressWarnings("unchecked")
	private GroupScoreResponse convertGroupScoreResponse(Map<String, Object> response) {
		List<Map<String, Object>> results = (List<Map<String, Object>>)response.getOrDefault("results", List.of());

		Map<Long, Float> scores = results.stream()
			.collect(Collectors.toMap(
				result -> ((Number)result.get("restaurant_id")).longValue(),
				result -> ((Number)result.get("group_score")).floatValue()
			));

		return GroupScoreResponse.builder()
			.scores(scores)
			.build();
	}
}

