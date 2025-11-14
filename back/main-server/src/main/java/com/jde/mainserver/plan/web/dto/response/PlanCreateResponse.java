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

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PlanCreateResponse {
	private Long planId;
	private Long roomId;

	private String planName;
	private Integer radiusM;
	private LocalDateTime startsAt;

	private List<PlanPriceRange> priceRanges;

	private List<String> dislikeCategories;

	private PlanDecisionTool decisionTool;

	private PlanStatus status;

	// 후보 식당 Top N (나중)
	// private List<PlanCandidateResponse> candidates;
	// private String nextCursor;
}
