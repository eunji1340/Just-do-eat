package com.jde.mainserver.room.service.query;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.web.dto.response.GetMyRoomResponse;

public interface GetMyRoomQueryService {

    GetMyRoomResponse getMyRoom(Member user);
}
