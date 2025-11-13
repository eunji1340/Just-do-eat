/**
 * main/converter/MainConverter.java
 * main 패키지의 엔티티와 DTO 간 변환을 담당하는 Converter 클래스
 * Author: Jang
 * Date: 2025-11-09
 */

package com.jde.mainserver.main.converter;

import com.jde.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.restaurants.entity.RestaurantHour;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainConverter {

	/**
	 * Restaurant 엔티티를 FeedResponse.RestaurantItem으로 변환
	 *
	 * @param restaurant 식당 엔티티
	 * @param distanceM 거리(미터)
	 * @param isOpen 영업 중 여부
	 * @param debug 점수 계산 상세 정보 (선택)
	 * @return FeedResponse.RestaurantItem
	 */
	public static FeedResponse.RestaurantItem toFeedItem(
		Restaurant restaurant,
		Integer distanceM,
		Boolean isOpen,
		Map<String, Object> debug
	) {
		if (restaurant == null) {
			return null;
		}

		// 영업시간 변환
		List<FeedResponse.RestaurantItem.HourItem> hourItems = null;
		if (restaurant.getHours() != null && !restaurant.getHours().isEmpty()) {
			hourItems = restaurant.getHours().stream()
				.map(MainConverter::toHourItem)
				.toList();
		}

		return new FeedResponse.RestaurantItem(
			restaurant.getId(),
			restaurant.getKakaoId(),
			restaurant.getName(),
			restaurant.getAddress(),
			restaurant.getAddressLot(),
			restaurant.getPhone(),
			restaurant.getKakaoSummary(), // 전체 JSONB 객체
			restaurant.getCategory1(),
			restaurant.getCategory2(),
			restaurant.getCategory3(),
			restaurant.getKakaoUrl(),
			restaurant.getKakaoRating() != null ? restaurant.getKakaoRating().floatValue() : null,
			restaurant.getKakaoReviewCnt(),
			restaurant.getBlogReviewCnt(),
			restaurant.getPriceRange() != null ? restaurant.getPriceRange().name() : null,
			restaurant.getImage(), // JSONB List<String>
			restaurant.getMenu(), // JSONB
			restaurant.getIsParking(),
			restaurant.getIsReservation(),
			hourItems,
			distanceM,
			isOpen,
			debug
		);
	}

	/**
	 * RestaurantHour 엔티티를 FeedResponse.RestaurantItem.HourItem으로 변환
	 *
	 * @param hour 영업시간 엔티티
	 * @return FeedResponse.RestaurantItem.HourItem
	 */
	private static FeedResponse.RestaurantItem.HourItem toHourItem(RestaurantHour hour) {
		return new FeedResponse.RestaurantItem.HourItem(
			hour.getDow(),
			hour.getOpen() != null ? hour.getOpen().toString() : null,
			hour.getClose() != null ? hour.getClose().toString() : null,
			hour.getBreakOpen() != null ? hour.getBreakOpen().toString() : null,
			hour.getBreakClose() != null ? hour.getBreakClose().toString() : null,
			hour.getIsHoliday()
		);
	}

	/**
	 * PersonalScoreRequest를 FastAPI 스키마로 변환
	 *
	 * FastAPI 요청 예시:
	 * {
	 *   "user": {
	 *     "user_id": 1,
	 *     "tag_pref": {
	 *       10: { "score": 0.8, "confidence": 0.9 }
	 *     }
	 *   },
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
	public static Map<String, Object> convertToFastApiSchema(PersonalScoreRequest req) {
		if (req.candidates() == null || req.candidates().isEmpty()) {
			throw new IllegalArgumentException("candidates는 최소 1개 이상 필요합니다");
		}

		Map<String, Object> fastApiReq = new HashMap<>();

		// user 객체 구성
		Map<String, Object> user = new HashMap<>();
		user.put("user_id", req.userId());

		// user_tag_pref: Map<Long, TagPreference> -> Map<Integer, Map<String, Float>>
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

		// candidates 변환
		List<Map<String, Object>> candidates = req.candidates().stream()
			.map(cand -> {
				Map<String, Object> candMap = new HashMap<>();
				candMap.put("restaurant_id", cand.restaurantId());
				// distance_m이 null이면 기본값 0.0 사용 (FastAPI는 float 필수)
				candMap.put("distance_m", cand.distanceM() != null ? cand.distanceM() : 0.0f);

				// 식당 태그 정보: Map<Long, TagPreference> -> Map<Integer, Map<String, Float>>
				Map<Integer, Map<String, Float>> candTagPref = new HashMap<>();
				if (cand.tagPref() != null) {
					cand.tagPref().forEach((tagId, pref) -> {
						Map<String, Float> prefMap = new HashMap<>();
						prefMap.put("weight", pref.score() != null ? pref.score() : 0.0f);
						prefMap.put("confidence", pref.confidence() != null ? pref.confidence() : 0.0f);
						candTagPref.put(tagId.intValue(), prefMap);
					});
				}
				candMap.put("tag_pref", candTagPref);

				// user_restaurant_state.pref_score
				if (cand.prefScore() != null) {
					candMap.put("pref_score", cand.prefScore());
				} else {
					// pref_score가 null인 경우 명시적으로 null 전달 (FastAPI에서 처리)
					candMap.put("pref_score", null);
				}

				return candMap;
			})
			.toList();

		fastApiReq.put("user", user);
		fastApiReq.put("candidates", candidates);
		fastApiReq.put("debug", true);

		return fastApiReq;
	}
}

