package com.jde.mainserver.rooms.repository;

import com.jde.mainserver.rooms.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {


}
