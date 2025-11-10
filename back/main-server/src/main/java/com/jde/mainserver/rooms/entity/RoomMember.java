package com.jde.mainserver.rooms.entity;

import com.jde.mainserver.global.common.BaseEntity;

// JPA (Jakarta Persistence)  관련, 엔티티와 DB 매핑할 때 사용하는 어노테이션
import com.jde.mainserver.member.entity.Member;
import jakarta.persistence.*;

// Lombok 관련, 반복 코드(Getter, 생성자, Builder 등)를 자동으로 생성해주는 라이브러리
import lombok.Getter; // 모든 필드의 getter 메서드 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 생성자 자동 생성
import lombok.AllArgsConstructor; // 모든 필드를 받는 생성자 자동 생성
import lombok.AccessLevel; // 생성자 접근 수준 지정할 때 사용
import lombok.Builder; // 빌더 패턴 자동 생성

@Entity
@Table(name = "room_member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class RoomMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roomMemberId;

    @Column(name = "is_del")
    private boolean isDel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    // 연관 관계 편의 메서드
    // Room과의 관계를 DB에서도 맞추기 위해 어느 room에 속해 있는지를 설정하는 메서드
    public void setRoom(Room room) {
        this.room = room;
    }
    public void setUser(Member user) { this.user = user; }
    public void softDelete() {
        this.isDel = true;
    }
    public void revive() { this.isDel = false; }
}
