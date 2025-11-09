package com.jde.mainserver.plan.entity.enums;

import lombok.Getter;

import javax.swing.text.Highlighter;

@Getter
public enum PlanDecisionTool {

    DIRECT("사다리 타기"),
    VOTE("투표"),
    RANDOM("룰렛"),
    TOURNEY("토너먼트");

    private final String decisionTool;

    PlanDecisionTool(String decisionTool) { this.decisionTool = decisionTool; }
}
