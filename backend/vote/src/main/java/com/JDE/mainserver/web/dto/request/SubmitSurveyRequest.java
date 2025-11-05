package com.JDE.mainserver.web.dto.request;

import java.util.Map;

public record SubmitSurveyRequest(
        String sessionId,
        Map<String, Object> answers
        // result 같은 추가 필드는 규칙 정해지면 확장
) {}
