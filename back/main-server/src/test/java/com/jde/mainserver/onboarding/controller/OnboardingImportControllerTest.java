package com.jde.mainserver.onboarding.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jde.mainserver.global.annotation.resolver.AuthUserArgumentResolver;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.onboarding.dto.OnboardingTypeMatch;
import com.jde.mainserver.onboarding.dto.OnboardingTypeResult;
import com.jde.mainserver.onboarding.dto.request.BingoVote;
import com.jde.mainserver.onboarding.dto.request.MukbtiAnswer;
import com.jde.mainserver.onboarding.dto.request.OnboardingImportRequest;
import com.jde.mainserver.onboarding.service.MbtiComputeResult;
import com.jde.mainserver.onboarding.service.MbtiComputeService;
import com.jde.mainserver.onboarding.service.OnboardingTypeQueryService;
import com.jde.mainserver.onboarding.mbti.service.MbtiQueryService;
import com.jde.mainserver.onboarding.bingo.service.BingoQueryService;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

@WebMvcTest(controllers = OnboardingController.class)
@AutoConfigureMockMvc(addFilters = false)
class OnboardingImportControllerTest {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	ObjectMapper objectMapper;

	@MockBean
	MbtiComputeService mbtiComputeService;

	@MockBean
	OnboardingTypeQueryService onboardingTypeQueryService;

	@MockBean
	OnboardingSurveyStore onboardingSurveyStore;

	@MockBean
	AuthUserArgumentResolver authUserArgumentResolver;

	@MockBean
	MbtiQueryService mbtiQueryService;

	@MockBean
	BingoQueryService bingoQueryService;

	@MockBean
	JpaMetamodelMappingContext jpaMetamodelMappingContext;

	@Test
	@DisplayName("POST /onboarding/import returns success:true and type payload")
	void import_success() throws Exception {
		// given
		var req = new OnboardingImportRequest(
			List.of(new MukbtiAnswer("q1","A"), new MukbtiAnswer("q2","B")),
			List.of(new BingoVote("pineapple_pizza", 1)),
			"sid-123"
		);

		when(mbtiComputeService.compute(any())).thenReturn(
			new MbtiComputeResult("MPST", Map.of("M", 1, "P", 1, "S", 1, "D", 1))
		);
		var type = new OnboardingTypeResult(
			"MPST",
			"현실파 점심헌터",
			"현실파 점심헌터",
			List.of("가성비","한정식","빨리먹고간다"),
			"설명",
			List.of(new OnboardingTypeMatch("NPSD","현실형 실속러","/mbtis/NPSD.png")),
			List.of(new OnboardingTypeMatch("MQAD","느긋한 탐미가","/mbtis/MQAD.png")),
			"/mbtis/MPST.png"
		);
		when(onboardingTypeQueryService.getByCode("MPST")).thenReturn(java.util.Optional.of(type));

		// expect
		mockMvc.perform(post("/onboarding/import")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.typeId").value("MPST"))
			.andExpect(jsonPath("$.mukbtiResult.code").value("MPST"))
			.andExpect(jsonPath("$.mukbtiResult.imagePath").value("/mbtis/MPST.png"))
			.andExpect(jsonPath("$.tagPrefs").exists());
	}
}


