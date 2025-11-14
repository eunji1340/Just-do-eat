/**
 * plan/web/dto/request/GroupScoreRequest.java
 * 그룹 추천 점수 요청 DTO
 * Author: Jang
 * Date: 2025-11-14
 */

package com.jde.mainserver.plan.web.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Schema(description = "그룹 추천 점수 요청")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupScoreReqeust {
	@Schema(description = "참여자들의 태그 선호도 목록")
	private List<UserPrefFeature> members;

	@Schema(description = "후보 식당 Feature 목록")
	private List<CandidateFeature> candidates;

	@Schema(description = "디버그 정보 포함 여부", example = "true")
	private Boolean debug;

	@Schema(description = "사용자 선호 Feature")
	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public static class UserPrefFeature {
		@Schema(description = "사용자 ID", example = "1")
		private Long userId;

		@Schema(
			description = "태그 선호도 맵 {tagId: TagPreference}",
			example = """
				{
					"10" : {"score": 0.8, "confidence": 0.9},
					"12" : {"score": 0.3, "confidence": 0.6} 
				}
				"""
		)
		private Map<Long, TagPreference> tagPref;
	}

	@Schema(description = "후보 식당 Feature")
	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public static class CandidateFeature {
		@Schema(description = "식당 ID", example = "379")
		private Long restaurantId;

		@Schema(description = "약속 중심으로부터 거리(미터)", example = "350.0")
		private Float distanceM;

		@Schema(
			description = "식당 태그 Feature {tagId: TagPreference}",
			example = """
				{
				  "10": {"weight": 1.0, "confidence": 1.0},
				  "15": {"weight": 0.5, "confidence": 0.8}
				}
				"""
		)
		private Map<Long, TagPreference> tagPref;

		@Schema(description = "개인 선호 점수(pref_score) (없으면 null 가능)", example = "0.7")
		private Float prefScore;
	}

	@Schema(description = "태그 선호도 정보")
	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public static class TagPreference {
		@Schema(description = "태그 점수 (user_tag_pref.score, 사용자 태그용)", example = "0.8")
		private Float score;

		@Schema(description = "태그 가중치 (restaurant_tag.weight, 식당 태그용)", example = "1.0")
		private Float weight;

		@Schema(description = "신뢰도 (confidence, 0~1)", example = "0.9")
		private Float confidence;
	}
}
