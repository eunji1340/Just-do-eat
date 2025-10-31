package com.JDE.mainserver.test.service.command;

import com.JDE.mainserver.web.dto.request.CreateTestRequest;
import com.JDE.mainserver.web.dto.request.UpdateTestRequest;
import com.JDE.mainserver.web.dto.response.TestInfoResponse;

/**
 * Test 엔티티의 명령(Command) 작업을 담당하는 서비스 인터페이스
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
public interface TestCommandService {

    /**
     * 새로운 Test를 생성합니다.
     *
     * @param request Test 생성 요청 DTO
     * @return 생성된 Test의 정보를 담은 응답 DTO
     */
    TestInfoResponse create(CreateTestRequest request);

    /**
     * Test를 수정합니다.
     *
     * @param id 수정할 Test의 ID
     * @param request Test 수정 요청 DTO
     * @return 수정된 Test의 정보를 담은 응답 DTO
     * @throws com.jjogae.mainserver.test.exception.TestException Test를 찾을 수 없는 경우
     */
    TestInfoResponse update(Long id, UpdateTestRequest request);
}
