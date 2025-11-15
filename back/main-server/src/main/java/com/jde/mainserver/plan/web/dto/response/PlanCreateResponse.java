/**
 * plan/web/dto/response/PlanCreateResponse.java
 * 약속 생성 응답 DTO
 * Author: Jang
 * Date: 2025-11-13
 */

package com.jde.mainserver.plan.web.dto.response;

import com.jde.mainserver.plan.entity.enums.PlanDecisionTool;
import com.jde.mainserver.plan.entity.enums.PlanPriceRange;
import com.jde.mainserver.plan.entity.enums.PlanStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PlanCreateResponse {

	@Schema(description = "약속 ID", example = "1")
	private Long planId;

	@Schema(description = "약속 참여자 ID 목록", example = "[1, 2, 3, 4")
	private List<Long> participantIds;

	@Schema(description = "모임 방 ID", example = "1")
	private Long roomId;

	@Schema(description = "약속 이름", example = "강남 저녁 회식")
	private String planName;

	@Schema(description = "검색 반경(미터)", example = "1000")
	private Integer radiusM;

	@Schema(description = "약속 시작 시간")
	private LocalDateTime startsAt;

	@Schema(description = "비선호 카테고리 목록")
	private List<String> dislikeCategories;

	@Schema(description = "선호 가격대 목록")
	private List<PlanPriceRange> priceRanges;

	@Schema(description = "결정 방식")
	private PlanDecisionTool decisionTool;

	@Schema(description = "약속 상태")
	private PlanStatus status;

	@Schema(description = "추천 후보 식당 목록 (상위 8개)")
	private List<PlanCandidateResponse> candidates;
}
