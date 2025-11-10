package com.jde.mainserver.plan.entity.enums;

import lombok.Getter;

@Getter
public enum PlanRole {

    MANAGER("약속 장"),
    PARTICIPANTS("약속 참여자");

    private final String planRole;

    PlanRole(String planRole) { this.planRole = planRole; }
}
