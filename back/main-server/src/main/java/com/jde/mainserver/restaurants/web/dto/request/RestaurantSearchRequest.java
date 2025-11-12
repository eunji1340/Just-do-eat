package com.jde.mainserver.restaurants.web.dto.request;

import com.jde.mainserver.restaurants.entity.enums.OpenStatus;
import com.jde.mainserver.restaurants.entity.enums.PriceRange;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "식당 검색 요청")
public record RestaurantSearchRequest(
        @Schema(description = "검색어(이름/주소/카테고리 부분일치)")
        String query,

        @Schema(description = "위도")
        Double lat,

        @Schema(description = "경도")
        Double lng,

        @Schema(description = "검색 반경(미터)")
        Double meters,

        @Schema(description = "가격대 필터")
        PriceRange priceRange,

        @Schema(description = "영업 상태 필터")
        OpenStatus openStatus,

        @Schema(description = "태그 포함(부분일치)")
        String tag
) {}