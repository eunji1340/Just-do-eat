package com.jde.mainserver.room.web.dto.response;

import lombok.Getter;

@Getter
public enum JoinStatus {
    JOIN("새로운 멤버"),
    REJOIN("재가입 멤버"),
    ALREADY("이미 가입 멤버");

    private final String joinStatus;

    JoinStatus(String joinStatus) { this.joinStatus = joinStatus; }
}
