package com.jde.mainserver.room.service.command;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.web.dto.response.LeftRoomResponse;

public interface LeftRoomCommandService {

    LeftRoomResponse leftRoom(Member user, Long roomId);
}
