// restaurants/entity/Bookmark.java
package com.JDE.mainserver.restaurants.entity;

import com.JDE.mainserver.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="restaurant_bookmark",
        uniqueConstraints = @UniqueConstraint(columnNames = {"member_id","restaurant_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Bookmark {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="member_id", nullable=false)
    private Member member;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="restaurant_id", nullable=false)
    private Restaurant restaurant;
}
