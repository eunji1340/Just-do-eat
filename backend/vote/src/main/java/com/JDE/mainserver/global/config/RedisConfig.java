package com.JDE.mainserver.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;

@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String host;

    @Value("${spring.data.redis.port:6379}")
    private int port;

    @Value("${spring.data.redis.timeout:2000}")
    private int timeoutMs;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration server = new RedisStandaloneConfiguration(host, port);
        LettuceClientConfiguration client = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofMillis(timeoutMs))
                .shutdownTimeout(Duration.ofMillis(100))
                .build();
        return new LettuceConnectionFactory(server, client);
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(LettuceConnectionFactory cf) {
        return new StringRedisTemplate(cf);
    }
}
