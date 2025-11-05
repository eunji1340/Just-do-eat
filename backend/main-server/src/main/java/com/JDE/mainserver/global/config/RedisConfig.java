package com.JDE.mainserver.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * 통합된 Redis 설정 클래스입니다.
 * - Redis 연결 설정 (host, port, timeout)
 * - RedisTemplate (Java 객체 저장을 위한 JSON 직렬화 설정)
 * - StringRedisTemplate (일반 문자열 저장을 위한 기본 설정)
 */
@Configuration
public class RedisConfig {

    // File 2에서 가져온 Redis 연결 정보 (application.properties/yml에서 설정)
    @Value("${spring.data.redis.host:localhost}")
    private String host;

    @Value("${spring.data.redis.port:6379}")
    private int port;

    @Value("${spring.data.redis.timeout:2000}")
    private int timeoutMs;

    /**
     * Redis 연결을 위한 Connection Factory 빈 등록 (File 2의 설정)
     * Lettuce Client Configuration을 사용하여 타임아웃을 설정합니다.
     */
    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        // 1. Standalone Redis Configuration (host, port 설정)
        RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration(host, port);

        // 2. Lettuce Client Configuration (timeout 설정)
        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofMillis(timeoutMs))
                .shutdownTimeout(Duration.ofMillis(100))
                .build();

        return new LettuceConnectionFactory(serverConfig, clientConfig);
    }

    /**
     * Java Object 저장을 위한 RedisTemplate 설정 (File 1의 설정)
     * - Key는 StringSerializer, Value는 JSONSerializer를 사용하여 객체 직렬화를 지원합니다.
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Key 직렬화: String
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Value 직렬화: JSON (Jackson)
        // 복잡한 Java 객체를 JSON 형태로 Redis에 저장할 때 사용합니다.
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());

        template.afterPropertiesSet();
        return template;
    }

    /**
     * String 값 저장을 위한 StringRedisTemplate 설정 (File 2의 설정)
     * - Key와 Value 모두 기본 StringSerializer를 사용합니다.
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        // StringRedisTemplate은 기본적으로 StringSerializer를 사용하므로 별도의 직렬화 설정이 필요 없습니다.
        return new StringRedisTemplate(connectionFactory);
    }
}