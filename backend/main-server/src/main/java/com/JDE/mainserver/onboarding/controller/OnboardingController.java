package com.JDE.mainserver.onboarding.controller;

import com.JDE.mainserver.global.api.ApiResponse;
import com.JDE.mainserver.global.exception.code.GeneralSuccessCode;
import com.JDE.mainserver.onboarding.OnboardingSurveyStore;
import com.JDE.mainserver.onboarding.dto.request.SubmitSurveyRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingSurveyStore store;
    private final ObjectMapper om;

    /** 세션 발급: POST /api/onboarding/session (permitAll) */
    @PostMapping("/session")
    public ApiResponse<ObjectNode> createSession() {
        String sessionId = UUID.randomUUID().toString();

        ObjectNode init = om.createObjectNode()
                .put("schema", "onb_v1")
                .putNull("answers")
                .put("createdAt", Instant.now().toString())
                .put("updatedAt", Instant.now().toString());

        store.save(sessionId, init.toString());

        ObjectNode res = om.createObjectNode().put("sessionId", sessionId);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, res);
    }

    /** 설문 저장: POST /api/onboarding/submit (permitAll) */
    @PostMapping("/submit")
    public ApiResponse<Void> submit(@RequestBody SubmitSurveyRequest req) {
        ObjectNode data = om.createObjectNode();
        data.set("answers", om.valueToTree(req.answers()));
        data.put("updatedAt", Instant.now().toString());

        store.save(req.sessionId(), data.toString());
        return ApiResponse.onSuccess(GeneralSuccessCode.OK);
    }

    /** 내 온보딩 보기: GET /api/onboarding/me (인증 필요) */
    @GetMapping("/me")
    public ApiResponse<JsonNode> myOnboarding(Authentication authentication) {
        String sub = (authentication == null) ? null : authentication.getName();
        if (sub == null) return ApiResponse.onSuccess(GeneralSuccessCode.OK, null);

        long memberId;
        try { memberId = Long.parseLong(sub); }
        catch (NumberFormatException e) {
            log.warn("[/onboarding/me] invalid subject: {}", sub);
            return ApiResponse.onSuccess(GeneralSuccessCode.OK, null);
        }

        try {
            return store.findByUser(memberId)
                    .map(json -> {
                        try { return om.readTree(json); }
                        catch (Exception parse) {
                            log.warn("[/onboarding/me] JSON parse error: {}", parse.getMessage());
                            return null;
                        }
                    })
                    .map(node -> ApiResponse.onSuccess(GeneralSuccessCode.OK, node))
                    .orElseGet(() -> ApiResponse.onSuccess(GeneralSuccessCode.OK, null));
        } catch (Exception e) {
            // Redis 연결 실패 등도 200 + null 로 처리(프론트 영향 최소화)
            log.error("[/onboarding/me] unexpected", e);
            return ApiResponse.onSuccess(GeneralSuccessCode.OK, null);
        }
    }
}
