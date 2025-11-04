/**
 * main/converter/FastApiConverter.java
 * 백엔드 PersonalScoreRequest를 FastAPI 스키마로 변환
 * Author: Jang
 * Date: 2025-11-04
 */

package com.JDE.mainserver.main.converter;

import com.JDE.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 백엔드 DTO와 FastAPI 스키마 간 변환을 담당하는 컨버터
 * FastAPI 스키마:
 * {
 *   "user": { "user_id": ..., "tag_pref": {...}, "saved": [...], "rest_bias": {...} },
 *   "candidates": [...],
 *   "debug": true/false
 * }
 */
@Component
public class FastApiConverter {
	
	private final ObjectMapper objectMapper;
	
	public FastApiConverter(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public Map<String, Object> convertToFastApiSchema(PersonalScoreRequest req) {
		if (req.candidates() == null || req.candidates().isEmpty()) {
			throw new IllegalArgumentException("candidates는 최소 1개 이상 필요합니다");
		}
		
		Map<String, Object> fastApiReq = new HashMap<>();
		
		// user 객체 구성
		Map<String, Object> user = new HashMap<>();
		user.put("user_id", req.userId());
		
		// tag_pref 변환: Map<Long, TagPreference> -> Map<Integer, Map<String, Float>>
		Map<Integer, Map<String, Float>> tagPref = new HashMap<>();
		if (req.userTagPref() != null) {
			req.userTagPref().forEach((tagId, pref) -> {
				Map<String, Float> prefMap = new HashMap<>();
				// score가 null이면 기본값 0.0 사용
				prefMap.put("score", pref.score() != null ? pref.score() : 0.0f);
				// confidence가 null이면 기본값 0.0 사용
				prefMap.put("confidence", pref.confidence() != null ? pref.confidence() : 0.0f);
				tagPref.put(tagId.intValue(), prefMap);
			});
		}
		user.put("tag_pref", tagPref);
		user.put("saved", List.of());  // TODO: User_Restaurant_State에서 조회
		user.put("rest_bias", Map.of());  // TODO: 확장
		
		// candidates 변환
		List<Map<String, Object>> candidates = req.candidates().stream()
			.map(cand -> {
				Map<String, Object> candMap = new HashMap<>();
				candMap.put("restaurant_id", cand.restaurantId());
				// distance_m이 null이면 기본값 0.0 사용 (FastAPI는 float 필수)
				candMap.put("distance_m", cand.distanceM() != null ? cand.distanceM() : 0.0f);
				candMap.put("is_open", cand.isOpen() != null ? cand.isOpen() : false);
				// price_bucket은 Integer를 그대로 전송 (FastAPI가 자동으로 Enum 변환)
				candMap.put("price_bucket", cand.priceRange() != null ? cand.priceRange() : 0);
				
				// tag_pref 변환 (식당 태그는 ERD: restaurant_tag.weight 사용)
				Map<Integer, Map<String, Float>> candTagPref = new HashMap<>();
				if (cand.tagPref() != null) {
					cand.tagPref().forEach((tagId, pref) -> {
						Map<String, Float> prefMap = new HashMap<>();
						// 식당 태그는 weight 필드로 변환 (ERD: restaurant_tag.weight)
						prefMap.put("weight", pref.score());
						prefMap.put("confidence", pref.confidence());
						candTagPref.put(tagId.intValue(), prefMap);
					});
				}
				candMap.put("tag_pref", candTagPref);
				
				return candMap;
			})
			.toList();
		
		fastApiReq.put("user", user);
		fastApiReq.put("candidates", candidates);
		fastApiReq.put("debug", false); // 현재는 debug 미지원
		
		return fastApiReq;
	}
}

