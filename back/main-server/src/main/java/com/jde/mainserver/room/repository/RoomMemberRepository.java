package com.jde.mainserver.room.repository;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

	/**
	 * 특정 room에 특정 member가 속해있는지 확인 (삭제되지 않은 멤버만)
	 */
	boolean existsByRoomAndUserAndIsDelFalse(Room room, Member user);

	/**
	 * 특정 room에 속한 모든 멤버 조회 (삭제되지 않은 멤버만)
	 */
	List<RoomMember> findByRoomAndIsDelFalse(Room room);

	/**
	 * 특정 room과 member로 RoomMember 조회
	 */
	Optional<RoomMember> findByRoomAndUser(Room room, Member user);
}
