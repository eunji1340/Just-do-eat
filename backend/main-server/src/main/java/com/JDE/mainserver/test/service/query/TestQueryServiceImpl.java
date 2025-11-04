package com.JDE.mainserver.test.service.query;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jjogae.mainserver.test.converter.TestConverter;
import com.jjogae.mainserver.test.entity.Test;
import com.jjogae.mainserver.test.exception.TestErrorCode;
import com.jjogae.mainserver.test.exception.TestException;
import com.jjogae.mainserver.test.repository.TestRepository;
import com.jjogae.mainserver.test.web.dto.response.TestInfoListResponse;
import com.jjogae.mainserver.test.web.dto.response.TestInfoResponse;

import lombok.RequiredArgsConstructor;

/**
 * Test 엔티티의 조회(Query) 작업을 담당하는 서비스 구현체
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TestQueryServiceImpl implements TestQueryService {

    private final TestRepository testRepository;

    @Override
    public TestInfoResponse findById(Long id) {
        Test test = testRepository.findById(id).orElseThrow(
                () -> new TestException(TestErrorCode.TEST_NOT_FOUND)
        );
        return TestConverter.toTestInfoResponse(test);
    }

    @Override
    public TestInfoListResponse findByTextContaining(String text) {
        List<Test> list = testRepository.findByTextContaining(text);
        return TestConverter.toTestInfoListResponse(list);
    }
}

