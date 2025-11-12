package com.jde.mainserver.member.entity;

/**
 * member/entity/Member.java
 * Author: kimheejin
 */

import com.jde.mainserver.member.entity.enums.AgeGroup;
import com.jde.mainserver.member.entity.enums.Gender;
import com.jde.mainserver.member.entity.enums.Role;
import com.jde.mainserver.region.entity.Region;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false)
    private String password;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "age_group", nullable = false)
    private AgeGroup ageGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // 회원가입용 생성자
    public Member(String name, String password, String imageUrl, Role role,
                  AgeGroup ageGroup, Gender gender, Region region) {
        this.name = name;
        this.password = password;
        this.imageUrl = imageUrl;
        this.role = role;
        this.ageGroup = ageGroup;
        this.gender = gender;
        this.region = region;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void clearRegion() {
        this.region = null;
    }

    public void changeRegion(Region newRegion) {
        this.region = newRegion;
    }
}
