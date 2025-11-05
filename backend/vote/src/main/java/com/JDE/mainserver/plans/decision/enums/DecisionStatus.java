package com.JDE.mainserver.plans.decision.enums;

public enum DecisionStatus {
    PENDING,   // 시작 전
    VOTING,    // 투표 진행 중
    CLOSED,    // 투표 종료(집계 확정)
    DECIDED    // 최종 식당 확정
}
