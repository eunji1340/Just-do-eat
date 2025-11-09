package com.jde.mainserver.plan.entity;

import com.jde.mainserver.groups.entity.Group;

// JPA (Jakarta Persistence)  관련, 엔티티와 DB 매핑할 때 사용하는 어노테이션
import jakarta.persistence.Entity; // "DB 테이블과 매핑되는 JPA 엔티티임"
import jakarta.persistence.GeneratedValue; // PK 값을 자동 생성 (auto increment, sequence 등)
import jakarta.persistence.GenerationType; // Identity, sequence, auto 등 PK 생성 전략 설정
import jakarta.persistence.Id; // 엔티티 기본 키 (PK) 필드 표시
import jakarta.persistence.Table; // 매핑될 DB 테이블 이름 지정

import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;

// Lombok 관련, 반복 코드(Getter, 생성자, Builder 등)를 자동으로 생성해주는 라이브러리
import lombok.Getter; // 모든 필드의 getter 메서드 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 생성자 자동 생성
import lombok.AllArgsConstructor; // 모든 필드를 받는 생성자 자동 생성
import lombok.AccessLevel; // 생성자 접근 수준 지정할 때 사용
import lombok.Builder; // 빌더 패턴 자동 생성


@Entity
@Table(name = "plan_participant")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PlanParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long planParticipantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group groupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan planId;
}
