package com.jde.mainserver.test.service;

// src/main/java/com/jde/mainserver/global/test/TestService.java


import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class TestService {

    private final RedisTemplate<String, Object> redisTemplate;

    // RedisTemplate Bean은 RedisConfig.java에서 정의되어야 합니다.
    public TestService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /** Redis에 데이터 저장 (TTL 5분) */
    public boolean setTestData(String key, String value) {
        try {
            redisTemplate.opsForValue().set(key, value, Duration.ofMinutes(5));
            return true;
        } catch (Exception e) {
            // 연결 거부 등의 오류 발생 시 예외 처리
            e.printStackTrace();
            return false;
        }
    }

    /** Redis에서 데이터 조회 */
    public Object getTestData(String key) {
        return redisTemplate.opsForValue().get(key);
    }
}