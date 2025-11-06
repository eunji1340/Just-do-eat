package com.jde.mainserver.restaurants.entity;

/**
 * restaurants/entity/Tag.java
 * 태그 엔티티
 * Author: Jang
 * Date: 2025-11-03
 */

import com.jde.mainserver.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tag")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tag extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long id;

    /** 태그명 (유니크) */
    @Column(nullable = false, length = 50, unique = true)
    private String name;

    /** 태그 유형(분류) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TagType type;

    public enum TagType {
        /** 맛(매운맛/달달함 등) */          FLAVOR,
        /** 재료(소고기/문어 등) */          INGREDIENT,
        /** 조리법(튀김/구이 등) */          METHOD,
        /** 식감(바삭함/촉촉함 등) */        TEXTURE,
        /** 온도(냉/온 등) */               TEMPERATURE,
        /** 베이스(국물/비빔 등) */          BASE,
        /** 분위기(캐주얼/모던 등) */        AMBIENCE,
        /** 상황/목적(회식/데이트 등) */     SITUATION_PURPOSE,
        /** 가격/편의(가성비/주차 등) */     PRICE_AMENITY
    }
}