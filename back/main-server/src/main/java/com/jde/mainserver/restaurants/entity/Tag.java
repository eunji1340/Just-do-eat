/**
 * restaurants/entity/Tag.java
 * 태그 엔티티
 * Author: Jang
 * Date: 2025-11-03
 */

package com.jde.mainserver.restaurants.entity;

import com.jde.mainserver.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tag", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"type", "name"})
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tag extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long id;

    /** 태그명 */
    @Column(nullable = false, length = 100)
    private String name;

    /** 태그 유형(분류) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TagType type;

    public enum TagType {
        FLAVOR,        // 맛(달달한/고급진)
        INGREDIENT,    // 재료
        METHOD,        // 조리법
        TEXTURE,       // 식감
        TEMPERATURE,   // 온도
        BASE,          // 기본
        AMBIENCE,      // 분위기(고급스러운/귀여운)
        SITUATION,       // 상황
        PRICE_AMENITY, // 가격/편의
        PURPOSE,       // 방문 목적(기념일/데이트)
        COMPANION,     // 동반인(친구·지인/가족)
        TBC            // 분류 대기
    }
}