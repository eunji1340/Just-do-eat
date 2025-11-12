package com.jde.mainserver.main.service.query;

import com.jde.mainserver.main.web.dto.response.MainRegionRecommendResponse;

public interface MainRegionRecommendQueryService {
    MainRegionRecommendResponse overview(Long memberId);
    MainRegionRecommendResponse recommendations(Long memberId);
}
