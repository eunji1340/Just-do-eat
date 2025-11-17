package com.jde.mainserver.member.repository;

/**
 * member/repository/MemberRepository.java
 * 회원 JPA 리포지토리
 * Author: kimheejin
 * Date: 2025-10-28
 */
import com.jde.mainserver.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByUserId(Long name);
    Optional<Member> findByName(String name);
    boolean existsByName(String name);

    Member findNameByUserId(Long userId);
}
