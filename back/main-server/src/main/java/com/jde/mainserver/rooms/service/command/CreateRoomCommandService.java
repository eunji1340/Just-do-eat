package com.jde.mainserver.rooms.service.command;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.rooms.web.dto.request.CreateRoomRequest;
import com.jde.mainserver.rooms.web.dto.response.CreateRoomResponse;

public interface CreateRoomCommandService {

    CreateRoomResponse createRoom(CreateRoomRequest request, Member user);
}
