package com.jde.mainserver.onboarding.controller;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.GeneralSuccessCode;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.onboarding.bingo.dto.BingoItemsResponse;
import com.jde.mainserver.onboarding.bingo.service.BingoQueryService;
import com.jde.mainserver.onboarding.mbti.dto.MbtiQuestionsResponse;
import com.jde.mainserver.onboarding.mbti.service.MbtiQueryService;
import com.jde.mainserver.onboarding.dto.OnboardingTypeResult;
import com.jde.mainserver.onboarding.service.OnboardingTypeQueryService;
import com.jde.mainserver.onboarding.dto.request.SubmitSurveyRequest;
import com.jde.mainserver.onboarding.dto.request.OnboardingImportRequest;
import com.jde.mainserver.onboarding.service.MbtiComputeResult;
import com.jde.mainserver.onboarding.service.MbtiComputeService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingSurveyStore store;
    private final ObjectMapper om;
    private final MbtiQueryService mbtiQueryService;
    private final BingoQueryService bingoQueryService;
	private final OnboardingTypeQueryService onboardingTypeQueryService;
	private final MbtiComputeService mbtiComputeService;
	private final com.jde.mainserver.onboarding.service.OnboardingTagPrefInitializer onboardingTagPrefInitializer;

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

	/**
	 * 온보딩 임포트: POST /onboarding/import (permitAll, RAW JSON)
	 * - 프론트에서 온보딩 종료 시 제출한 응답을 수집/계산하고 세션에 저장
	 * - 응답은 success:true 형태로 반환(공통 ApiResponse 사용하지 않음)
	 */
	@PostMapping("/import")
	public ObjectNode importOnboarding(@RequestBody OnboardingImportRequest req) {
		// 1) 먹BTI 계산
		MbtiComputeResult result = mbtiComputeService.compute(req.mukbtiAnswers());

		// 2) 타입 결과 조회(응답 본문 구성용)
		OnboardingTypeResult typeResult = onboardingTypeQueryService.getByCode(result.code())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown computed type: " + result.code()));

		// 3) 세션 저장: 기존 submit 구조를 따라 answers + updatedAt 저장
		ObjectNode toSave = om.createObjectNode();
		ObjectNode answers = om.createObjectNode();
		answers.set("mukbtiAnswers", om.valueToTree(req.mukbtiAnswers()));
		answers.set("bingoResponses", om.valueToTree(req.bingoResponses()));

		// 계산된 결과를 저장(코드 + 가중치)
		ObjectNode computed = om.createObjectNode();
		computed.put("code", result.code());
		computed.set("weights", om.valueToTree(result.weights()));
		answers.set("mukbtiResult", computed);

		toSave.set("answers", answers);
		toSave.put("updatedAt", Instant.now().toString());
		store.save(req.sessionId(), toSave.toString());

		// 4) 응답 본문 생성(success:true 포맷)
		ObjectNode res = om.createObjectNode();
		res.put("success", true);
		res.put("typeId", result.code());
		res.set("mukbtiResult", om.valueToTree(typeResult));
		// 태그 선호는 현재 빈 객체로 반환
		res.set("tagPrefs", om.createObjectNode());
		return res;
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

    /** 먹BTI 문항 조회: GET /api/onboarding/mbtis (permitAll) */
    @Operation(summary = "먹BTI 문항 조회", description = "DB의 test_question 계열 테이블에서 온보딩 테스트 문항을 조회합니다.")
    @GetMapping("/mbtis")
    public ApiResponse<MbtiQuestionsResponse> getMbtiQuestions() {
        MbtiQuestionsResponse body = mbtiQueryService.getQuestions();
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, body);
    }

    /** 빙고 메뉴 조회: GET /api/onboarding/bingo (permitAll, RAW JSON) */
    @Operation(summary = "빙고 메뉴 조회", description = "DB의 bingo_menu_master 에서 온보딩 빙고 메뉴를 조회합니다.")
    @GetMapping("/bingo")
    public BingoItemsResponse getBingo() {
        return bingoQueryService.getItems();
    }

	/** 타입 결과 조회: GET /api/onboarding/result/types/{typeId} (permitAll) */
	@Operation(summary = "온보딩 타입 결과 조회", description = "정의된 16가지 온보딩 타입 결과를 반환합니다. 이미지 경로는 /mbtis/{code}.png 입니다.")
	@GetMapping("/result/types/{typeId}")
	public ApiResponse<OnboardingTypeResult> getOnboardingType(@PathVariable String typeId) {
		return onboardingTypeQueryService.getByCode(typeId)
			.map(result -> ApiResponse.onSuccess(GeneralSuccessCode.OK, result))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown typeId: " + typeId));
	}

	/**
	 * 온보딩 기반 태그 선호 재적용: POST /onboarding/apply-tag-prefs (인증 필요)
	 * - 회원 키로 저장된 온보딩 JSON을 읽어 user_tag_pref를 초기화한다.
	 * - 세션ID는 사용하지 않으며, 저장된 사용자 키 데이터만 사용한다.
	 */
	@PostMapping("/apply-tag-prefs")
	public ApiResponse<Void> applyTagPrefs(Authentication authentication) {
		String sub = (authentication == null) ? null : authentication.getName();
		if (sub == null) return ApiResponse.onSuccess(GeneralSuccessCode.OK);
		long memberId;
		try { memberId = Long.parseLong(sub); }
		catch (NumberFormatException e) { return ApiResponse.onSuccess(GeneralSuccessCode.OK); }

		onboardingTagPrefInitializer.applyFromStore(memberId, null);
		return ApiResponse.onSuccess(GeneralSuccessCode.OK);
	}
}
