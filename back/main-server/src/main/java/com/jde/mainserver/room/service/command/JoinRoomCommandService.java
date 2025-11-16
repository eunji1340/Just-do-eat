package com.jde.mainserver.room.service.command;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.web.dto.response.JoinRoomResponse;

public interface JoinRoomCommandService {

    JoinRoomResponse joinRoom(String token, Member user);
}
