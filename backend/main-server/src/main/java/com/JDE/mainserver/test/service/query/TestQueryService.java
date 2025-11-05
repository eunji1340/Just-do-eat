package com.JDE.mainserver.test.service.query;

import com.jjogae.mainserver.test.web.dto.response.TestInfoListResponse;
import com.jjogae.mainserver.test.web.dto.response.TestInfoResponse;

/**
 * Test 엔티티의 조회(Query) 작업을 담당하는 서비스 인터페이스
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
public interface TestQueryService {

    /**
     * ID로 Test를 조회합니다.
     *
     * @param id 조회할 Test의 ID
     * @return 조회된 Test의 정보를 담은 응답 DTO
     * @throws com.jjogae.mainserver.test.exception.TestException Test를 찾을 수 없는 경우
     */
    TestInfoResponse findById(Long id);

    /**
     * 텍스트를 포함하는 Test 목록을 조회합니다.
     *
     * @param text 검색할 텍스트
     * @return 텍스트를 포함하는 Test 목록을 담은 응답 DTO
     */
    TestInfoListResponse findByTextContaining(String text);
}

