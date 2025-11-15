package com.jde.mainserver.room.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class RoomDetailResponse {

    private Long roomId;
    private String roomName;
    private List<MemberInfo> roomMemberList;
    private List<PlanInfo> planList;
}
