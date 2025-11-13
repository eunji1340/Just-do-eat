package com.jde.mainserver.room.web.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberInfo {

    private Long roomMemberId;
    private Long userId;
    private boolean isDel;
    private String userName;
    private String imageUrl;
}
