package com.jde.mainserver.room.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class JoinRoomResponse {

    private Long roomId;
    private JoinStatus joinStatus;
}
