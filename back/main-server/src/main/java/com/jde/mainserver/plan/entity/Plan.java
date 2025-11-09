package com.jde.mainserver.plan.entity;

import com.jde.mainserver.global.common.BaseEntity;
import com.jde.mainserver.groups.entity.Group;
import com.jde.mainserver.plan.entity.enums.PlanDecisionTool;
import com.jde.mainserver.plan.entity.enums.PlanPriceRange;
import com.jde.mainserver.plan.entity.enums.PlanStatus;
import com.jde.mainserver.restaurants.entity.Restaurant;

// JPA (Jakarta Persistence)  관련, 엔티티와 DB 매핑할 때 사용하는 어노테이션
import jakarta.persistence.Column; // 필드를 DB 칼럼과 매핑하면서 세부 옵션 지정 (길이, not null ...)
import jakarta.persistence.Entity; // "DB 테이블과 매핑되는 JPA 엔티티임"
import jakarta.persistence.Enumerated; // ENUM 사용
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue; // PK 값을 자동 생성 (auto increment, sequence 등)
import jakarta.persistence.GenerationType; // Identity, sequence, auto 등 PK 생성 전략 설정
import jakarta.persistence.Id; // 엔티티 기본 키 (PK) 필드 표시
import jakarta.persistence.Table; // 매핑될 DB 테이블 이름 지정

import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Lombok 관련, 반복 코드(Getter, 생성자, Builder 등)를 자동으로 생성해주는 라이브러리
import lombok.Getter; // 모든 필드의 getter 메서드 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 생성자 자동 생성
import lombok.AllArgsConstructor; // 모든 필드를 받는 생성자 자동 생성
import lombok.AccessLevel; // 생성자 접근 수준 지정할 때 사용
import lombok.Builder; // 빌더 패턴 자동 생성

import java.util.List;

@Entity
@Table(name = "plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Plan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long planId;

    @NotBlank
    @Size(max = 10)
    @Column(name = "plan_name", length = 10, nullable = false)
    private String planName;

    // Kakao local API에서 String으로 받음
    @NotBlank
    @Column(name = "center_lat", nullable = false)
    private String centerLat;

    @NotBlank
    @Column(name = "center_lng", nullable = false)
    private String centerLng;

    @NotBlank
    @Column(name = "radius_m", nullable = false)
    private String radiusM;

    // DateTime? LocalDateTime?
    @Column(name = "starts_at", nullable = true)
    private String startsAt;

    // @ElementCollection
    @Column(name = "dislike_categories", nullable = true)
    private List<String> dislikeCategories;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_range", nullable = true)
    private PlanPriceRange privceRange;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PlanStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_tool", nullable = true)
    private PlanDecisionTool decisionTool;

    // 참조는 대문자로 하는 것이 낫지 않을까?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group Group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant Restaurant;

//    @OneToOne(fetch = FetchType.EAGER, mappedBy = "planParticipantId")
//    private User hostUser;
}
