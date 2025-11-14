package com.jde.mainserver.room.repository;

import com.jde.mainserver.room.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    Optional<RoomMember> findById(Long id);

    // 같은 room에 같은 member가 이미 있는지 검사
//    boolean existsByRoomAndUserAndIsDel(Room room, User user, Boolean isDel);
//
//    // 소프트 삭제된 멤버가 있는지 확인하고 isDel을 바꾸고 싶을 때
//    Optional<RoomMember> findByRoomAndUser(Room room, User user);
}
