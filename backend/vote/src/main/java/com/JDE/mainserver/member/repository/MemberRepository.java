/**
 * member/repository/MemberRepository.java
 * 회원 JPA 리포지토리
 * Author: kimheejin
 * Date: 2025-10-28
 */
package com.JDE.mainserver.member.repository;

import com.JDE.mainserver.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByUserId(String userId);
    boolean existsByUserId(String userId);
}
