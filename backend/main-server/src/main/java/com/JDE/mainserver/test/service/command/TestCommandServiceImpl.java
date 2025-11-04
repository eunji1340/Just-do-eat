package com.JDE.mainserver.test.service.command;

import com.JDE.mainserver.test.converter.TestConverter;
import com.JDE.mainserver.test.exception.TestErrorCode;
import com.JDE.mainserver.test.exception.TestException;
import com.JDE.mainserver.test.repository.TestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.JDE.mainserver.test.entity.Test;
import com.JDE.mainserver.web.dto.request.CreateTestRequest;
import com.JDE.mainserver.web.dto.request.UpdateTestRequest;
import com.JDE.mainserver.web.dto.response.TestInfoResponse;

import lombok.RequiredArgsConstructor;

/**
 * Test 엔티티의 명령(Command) 작업을 담당하는 서비스 구현체
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
@Service
@Transactional
@RequiredArgsConstructor
public class TestCommandServiceImpl implements TestCommandService {

    private final TestRepository testRepository;

    @Override
    public TestInfoResponse create(CreateTestRequest request) {
        Test entity = Test.builder()
                .text(request.getText())
                .category(request.getCategory())
                .build();
        Test saved = testRepository.save(entity);
        return TestConverter.toTestInfoResponse(saved);
    }

    @Override
    public TestInfoResponse update(Long id, UpdateTestRequest request) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new TestException(TestErrorCode.TEST_NOT_FOUND));
        test.update(request.getText(), request.getCategory());
        return TestConverter.toTestInfoResponse(test);
    }
}
