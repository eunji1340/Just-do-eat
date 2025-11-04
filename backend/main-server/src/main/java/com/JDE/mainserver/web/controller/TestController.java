package com.JDE.mainserver.web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.JDE.mainserver.global.api.ApiResponse;
import com.JDE.mainserver.test.service.command.TestCommandService;
import com.JDE.mainserver.test.service.query.TestQueryService;
import com.JDE.mainserver.web.dto.request.CreateTestRequest;
import com.JDE.mainserver.web.dto.request.UpdateTestRequest;
import com.JDE.mainserver.web.dto.response.TestInfoListResponse;
import com.JDE.mainserver.web.dto.response.TestInfoResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Test 관련 REST API를 제공하는 컨트롤러
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
@Slf4j
@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
@Tag(name = "User", description = "테스트용 API")
public class TestController {

    private final TestCommandService testCommandService;
    private final TestQueryService testQueryService;

    @PostMapping("/sending")
    public void create() {
        testProducer.create();
    }

    @PostMapping
    @Operation(summary = "Test 정보 추가", description = "Test 정보를 추가합니다")
    public ApiResponse<?> createTest(@Valid @RequestBody CreateTestRequest createTestRequest) {
        return ApiResponse.onSuccess(testCommandService.create(createTestRequest));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Test 정보 수정", description = "Test 정보를 수정합니다")
    public ApiResponse<TestInfoResponse> updateTest(@PathVariable("id") Long id, @Valid @RequestBody UpdateTestRequest updateTestRequest) {
        return ApiResponse.onSuccess(testCommandService.update(id, updateTestRequest));
    }

//    @GetMapping("/{id}")
//    @Operation(summary = "ID로 Test 조회")
//    public ApiResponse<TestInfoResponse> getById(@PathVariable("id") Long id) {
//        TestInfoResponse test = testQueryService.findById(id);
//        return ApiResponse.onSuccess(test);
//    }
//
//    @GetMapping
//    @Operation(summary = "텍스트 포함으로 Test 목록 조회")
//    public ApiResponse<?> getByText(@RequestParam("text") String text) {
//        TestInfoListResponse testInfoList = testQueryService.findByTextContaining(text);
//        return ApiResponse.onSuccess(testInfoList);
//    }
}

