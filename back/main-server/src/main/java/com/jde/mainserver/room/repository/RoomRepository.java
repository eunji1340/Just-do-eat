package com.jde.mainserver.room.repository;

import com.jde.mainserver.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomId(Long roomId);
    // RoomRepository
    @Query("""
        select distinct r
        from Room r
        join r.roomMemberList rm
        join rm.user u
        left join fetch r.planList p
        left join fetch p.restaurant rest
        where u.userId = :userId
    """)
    List<Room> findRoomWithRelationsByUserId(Long userId);

}
