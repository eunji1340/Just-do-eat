package com.jde.mainserver.test.web.controller;

// src/main/java/com/jde/mainserver/global/test/TestController.java


import com.jde.mainserver.test.service.TestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "✅ 연결 테스트 API", description = "Redis 연결 상태를 확인합니다.")
@RestController
@RequestMapping("/api/test")
public class sTestController {

    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    @Operation(
            summary = "Redis 연결 및 Read/Write 테스트",
            description = "제공된 key로 데이터를 저장하고 즉시 조회하여 Redis 통신 상태를 확인합니다.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Redis 연결 성공",
                            content = @Content(mediaType = "application/json",
                                    examples = @ExampleObject(value = "{\"setSuccess\":true,\"key\":\"testKey\",\"retrievedValue\":\"TestValue-...\",\"match\":true,\"message\":\"🎉 Redis 연결 및 Read/Write 성공!\"}"))),
                    @ApiResponse(responseCode = "500", description = "Redis 연결 실패",
                            content = @Content(mediaType = "application/json",
                                    examples = @ExampleObject(value = "{\"setSuccess\":false,\"message\":\"🚨 Redis 연결 또는 저장 실패\"}")))
            }
    )
    @GetMapping("/redis/{key}")
    public ResponseEntity<Map<String, Object>> testRedis(
            @Parameter(description = "Redis에 저장할 Key (예: myTestKey)", example = "myTestKey")
            @PathVariable String key) {

        String testValue = "TestValue-" + System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();

        // 1. 저장 테스트 (Service 호출)
        boolean setSuccess = testService.setTestData(key, testValue);
        response.put("setSuccess", setSuccess);

        if (!setSuccess) {
            response.put("message", "🚨 Redis 연결 또는 저장 실패");
            return ResponseEntity.internalServerError().body(response);
        }

        // 2. 조회 테스트 (Service 호출)
        Object retrievedValue = testService.getTestData(key);

        response.put("key", key);
        response.put("storedValue", testValue);
        response.put("retrievedValue", retrievedValue);
        response.put("match", testValue.equals(retrievedValue));

        response.put("message", "🎉 Redis 연결 및 Read/Write 성공!");
        return ResponseEntity.ok(response);
    }
}