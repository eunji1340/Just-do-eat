/**
 * member/entity/Member.java
 * Author: kimheejin
 */
package com.JDE.mainserver.member.entity;

import com.JDE.mainserver.member.entity.enums.AgeGroup;
import com.JDE.mainserver.member.entity.enums.Gender;
import com.JDE.mainserver.member.entity.enums.Role;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "members")
public class Member {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true, length = 64)
    private String userId;

    @Column(nullable = false)
    private String password; // BCrypt

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "age_group", nullable = false, length = 16)
    private AgeGroup ageGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Gender gender;

    public Member(String userId, String password, String imageUrl, Role role, AgeGroup ageGroup, Gender gender) {
        this.userId = userId;
        this.password = password;
        this.imageUrl = imageUrl;
        this.role = role;
        this.ageGroup = ageGroup;
        this.gender = gender;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
