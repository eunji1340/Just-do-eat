package com.JDE.mainserver.test.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.JDE.mainserver.test.entity.Test;

/**
 * Test 엔티티의 데이터 접근을 담당하는 Repository 인터페이스
 *
 * @author 2jh627
 * @version 1.0
 * @since 2025-09-09
 */
public interface TestRepository extends JpaRepository<Test, Long> {

    List<Test> findByTextContaining(String text);
}
