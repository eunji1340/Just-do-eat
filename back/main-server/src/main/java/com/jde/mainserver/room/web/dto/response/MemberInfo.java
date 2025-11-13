package com.jde.mainserver.room.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberInfo {

    private Long roomMemberId;
    private Long userId;
    private boolean isDel;
    private String userName;
    private String imageUrl;
}
