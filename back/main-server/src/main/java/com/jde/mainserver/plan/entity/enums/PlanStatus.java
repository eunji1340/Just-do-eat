package com.jde.mainserver.plan.entity.enums;

import lombok.Getter;

@Getter
public enum PlanStatus {

    OPEN("결정 도구를 아직 고르지 않은 상태"),
    VOTING("결정 도구를 이용하여 결정 중인 상태"),
    DECIDED("결정 도구를 이용하여 결정한 상태"),
    CANCELLED("결정 도구를 이용하여 결정하였지만 취소한 상태");


    private final String status;

    PlanStatus(String status) { this.status = status; }
}
