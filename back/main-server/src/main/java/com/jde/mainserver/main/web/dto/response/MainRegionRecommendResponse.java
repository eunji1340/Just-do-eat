package com.jde.mainserver.main.web.dto.response;

import com.jde.mainserver.member.dto.response.MemberRegionResponse;
import java.util.List;

/** 메인 - 지역상권 추천 응답 */
public record MainRegionRecommendResponse(
        boolean hasRegion,
        MemberRegionResponse region,
        List<RestaurantItem> restaurants // TODO: 실제 스키마로 교체
) {
    /** 임시 식당 요약 아이템 */
    public record RestaurantItem(Long id, String name) {}
}
