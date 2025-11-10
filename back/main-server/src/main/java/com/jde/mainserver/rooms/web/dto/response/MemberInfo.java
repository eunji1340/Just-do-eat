package com.jde.mainserver.rooms.web.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberInfo {

    private Long roomMemberId;
    private Long memberId;
    private boolean isDel;
    private String userName;
    private String imageUrl;
}
