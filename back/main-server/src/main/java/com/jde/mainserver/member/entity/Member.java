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
import static jakarta.persistence.FetchType.LAZY;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;

    public Region getRegion() { return region; }

    /** 기본 상권 변경 */
    public void changeRegion(Region region) { this.region = region; }

    /** 기본 상권 해제 */
    public void clearRegion() { this.region = null; }


    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ")
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private Instant updatedAt;

    public Member(String userId,
                  String password,
                  String imageUrl,
                  Role role,
                  AgeGroup ageGroup,
                  Gender gender,
                  Region region) {
        this.userId = userId;
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
}
