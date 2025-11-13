package com.jde.mainserver.room.repository;

import com.jde.mainserver.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {


}
