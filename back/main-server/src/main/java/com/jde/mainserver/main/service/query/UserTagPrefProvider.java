package com.jde.mainserver.main.service.query;

/**
 * main/service/query/UserTagPrefProvider.java
 * 사용자 태그 선호도 조회 인터페이스
 * Author: Jang
 * Date: 2025-11-03
 */

import java.util.Map;

public interface UserTagPrefProvider {
    Map<Long, TagStat> getUserTagStats(Long userId);

    /** 태그 점수/확신도 (score: -3.00~+3.00, confidence: 0.0~1.0) */
    record TagStat(double score, double confidence) {}
}

