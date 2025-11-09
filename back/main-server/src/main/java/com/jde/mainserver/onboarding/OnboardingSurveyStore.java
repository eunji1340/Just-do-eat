package com.jde.mainserver.onboarding;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OnboardingSurveyStore {

    private final StringRedisTemplate redis;

    private static final Duration TTL = Duration.ofDays(7); // 임시 세션 TTL
    private static final String SESSION_PREFIX = "onboarding:survey:";   // 세션 키
    private static final String USER_PREFIX   = "user:onboarding:";      // 유저 키(영구/길게 보관)

    private String sessionKey(String sessionId) { return SESSION_PREFIX + sessionId; }
    private String userKey(Long userId)        { return USER_PREFIX + userId; }

    /** 세션ID 기준 저장/조회/삭제 (비회원 단계) */
    public void save(String sessionId, String json) {
        redis.opsForValue().set(sessionKey(sessionId), json, TTL);
    }
    public Optional<String> find(String sessionId) {
        return Optional.ofNullable(redis.opsForValue().get(sessionKey(sessionId)));
    }
    public void delete(String sessionId) {
        redis.delete(sessionKey(sessionId));
    }

    /** 회원 기준 저장/조회 (가입 이후 조회용) */
    public void saveForUser(Long userId, String json) {
        // TTL 없이 두고 싶다면 아래 set에 expire를 주지 않으면 됨
        redis.opsForValue().set(userKey(userId), json);
    }
    public Optional<String> findByUser(Long userId) {
        return Optional.ofNullable(redis.opsForValue().get(userKey(userId)));
    }

    /** 세션 → 유저로 이관 */
    public void migrateSessionToUser(String sessionId, Long userId) {
        find(sessionId).ifPresent(json -> {
            saveForUser(userId, json);
            delete(sessionId);
        });
    }
}
