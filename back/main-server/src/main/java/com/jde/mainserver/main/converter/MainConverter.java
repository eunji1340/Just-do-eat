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

	// ==================== FastAPI 변환 ====================

	/**
	 * PersonalScoreRequest를 FastAPI 스키마로 변환
	 * FastAPI 스키마:
	 * {
	 *   "user": { "user_id": ..., "tag_pref": {...}, "saved": [...], "rest_bias": {...} },
	 *   "candidates": [...],
	 *   "debug": true/false
	 * }
	 *
	 * @param req 개인화 점수 계산 요청 DTO
	 * @param savedRestaurantIds 북마크된 식당 ID 리스트
	 * @return FastAPI 요청 스키마 (Map)
	 * @throws IllegalArgumentException candidates가 비어있는 경우
	 */
	public static Map<String, Object> convertToFastApiSchema(PersonalScoreRequest req, List<Long> savedRestaurantIds) {
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
		// 북마크된 식당 ID 리스트 (Integer 리스트로 변환)
		List<Integer> savedIds = (savedRestaurantIds != null) 
			? savedRestaurantIds.stream().map(Long::intValue).toList()
			: List.of();
		user.put("saved", savedIds);
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

				// pref_score 포함 (User_Restaurant_State.pref_score)
				if (cand.prefScore() != null) {
					candMap.put("pref_score", cand.prefScore());
				}

				return candMap;
			})
			.toList();

		fastApiReq.put("user", user);
		fastApiReq.put("candidates", candidates);
		fastApiReq.put("debug", true); // debug 정보 포함

		return fastApiReq;
	}
}

