package com.jde.mainserver.room.service.query;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.web.dto.response.RoomDetailResponse;

public interface RoomDetailQueryService {

    RoomDetailResponse roomDetail(Member user, Long roomId);
}
