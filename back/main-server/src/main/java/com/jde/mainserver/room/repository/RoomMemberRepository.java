package com.jde.mainserver.room.repository;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import org.apache.catalina.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

	Optional<RoomMember> findById(Long id);

    boolean existsByUser_UserIdAndRoom_RoomIdAndIsDelFalse(Long userId, Long roomId);
    default boolean activeUserRoom(Long userId, Long roomId) {
        return existsByUser_UserIdAndRoom_RoomIdAndIsDelFalse(userId, roomId);
    }

    @Query("""
        select rm
        from RoomMember rm
        join fetch rm.user u
        where rm.room.roomId = :roomId
          and rm.isDel = false
    """)
    List<RoomMember> findActiveMembersWithUserByRoomId(Long roomId);

    default List<RoomMember> activeUserInfo(Long roomId) {
        return findActiveMembersWithUserByRoomId(roomId);
    }

    Optional<RoomMember> findByRoom_RoomIdAndUser_UserId(Long roomId, Long userId);

	List<RoomMember> findByUserAndIsDel(Member user, boolean status);

	Long countByRoom_RoomIdAndIsDelFalse(Long roomId);
    // 같은 room에 같은 member가 이미 있는지 검사
//    boolean existsByRoomAndUserAndIsDel(Room room, User user, Boolean isDel);
//
//    // 소프트 삭제된 멤버가 있는지 확인하고 isDel을 바꾸고 싶을 때
//    Optional<RoomMember> findByRoomAndUser(Room room, User user);
}
