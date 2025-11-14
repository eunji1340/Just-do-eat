/**
 * plan/web/dto/request/PlanCreateRequest.java
 * 약속 생성 요청 DTO
 * Author: Jang
 * Date: 2025-11-13
 */

package com.jde.mainserver.plan.web.dto.request;

import com.jde.mainserver.plan.entity.enums.PlanDecisionTool;
import com.jde.mainserver.plan.entity.enums.PlanPriceRange;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Schema(
	description = "약속 생성 요청",
	example = """
		{
			"participantIds": [2, 3, 4],
			"planName": "강남 저녁 회식",
			"centerLat": 37.500901,
			"centerLon": 127.028639,
			"radiusM": 1000,
			"startsAt": "2025-12-31T19:00:00",
			"dislikeCategories": ["일식", "중식"],
			"priceRanges": ["LOW", "MEDIUM"]
		}
		"""
)
@Getter
@NoArgsConstructor
public class PlanCreateRequest {
	@Schema(description = "약속 이름 (최대 10자)", example = "강남 저녁 회식")
	@NotBlank
	@Size(max = 10)
	private String planName;

	@Schema(description = "약속 참여자 ID 목록", example = "[2, 3, 4]")
	private List<Long> participantIds;

	@Schema(description = "약속 중심 위도", example = "37.500901")
	@NotNull
	private Double centerLat;

	@Schema(description = "약속 중심 경도", example = "127.028639")
	@NotNull
	private Double centerLon;

	@Schema(description = "검색 반경 (미터 단위)", example = "1000")
	@NotNull
	@Positive
	private Integer radiusM;

	@Schema(description = "약속 시작 시간 (ISO 8601)", example = "2025-12-31T19:00:00")
	private LocalDateTime startsAt;

	@Schema(description = "비선호 카테고리 목록", example = "[\"일식\", \"양식\"]")
	private List<String> dislikeCategories;

	@Schema(description = "선호 가격대 목록 (LOW, MEDIUM, HIGH, PREMIUM)", example = "[\"MEDIUM\", \"HIGH\"]")
	private List<PlanPriceRange> priceRanges;
}
