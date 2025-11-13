package com.jde.mainserver.room.service.command;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.web.dto.request.CreateRoomRequest;
import com.jde.mainserver.room.web.dto.response.CreateRoomResponse;

public interface CreateRoomCommandService {
    CreateRoomResponse createRoom(CreateRoomRequest request, Long userId);
}
