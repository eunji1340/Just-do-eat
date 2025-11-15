package com.jde.mainserver.onboarding.controller;

import com.jde.mainserver.global.annotation.resolver.AuthUserArgumentResolver;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.onboarding.bingo.service.BingoQueryService;
import com.jde.mainserver.onboarding.dto.OnboardingTypeMatch;
import com.jde.mainserver.onboarding.dto.OnboardingTypeResult;
import com.jde.mainserver.onboarding.mbti.service.MbtiQueryService;
import com.jde.mainserver.onboarding.service.OnboardingTypeQueryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OnboardingController.class)
@AutoConfigureMockMvc(addFilters = false)
class OnboardingTypeControllerTest {

	@Autowired
	MockMvc mockMvc;

	@MockBean
	OnboardingTypeQueryService onboardingTypeQueryService;

	@MockBean
	MbtiQueryService mbtiQueryService;

	@MockBean
	BingoQueryService bingoQueryService;

	@MockBean
	OnboardingSurveyStore onboardingSurveyStore;

	@MockBean
	AuthUserArgumentResolver authUserArgumentResolver;

	@MockBean
	JpaMetamodelMappingContext jpaMetamodelMappingContext;

	private OnboardingTypeResult sample() {
		return new OnboardingTypeResult(
				"MPST",
				"현실파 점심헌터",
				"현실파 점심헌터",
				List.of("가성비", "한정식", "빨리먹고간다"),
				"식사를 연료처럼 생각하며 익숙하고 빠르게 먹을 수 있는 메뉴를 선호합니다.",
				List.of(new OnboardingTypeMatch("NPSD", "현실형 실속러", "/mbtis/NPSD.png")),
				List.of(new OnboardingTypeMatch("MQAD", "느긋한 탐미가", "/mbtis/MQAD.png")),
				"/mbtis/MPST.png"
		);
	}

	@Test
	@DisplayName("GET /onboarding/result/types/MPST returns MPST result")
	void typeResult_success() throws Exception {
		when(onboardingTypeQueryService.getByCode("MPST")).thenReturn(Optional.of(sample()));

		mockMvc.perform(get("/onboarding/result/types/MPST"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value("200"))
				.andExpect(jsonPath("$.data.code").value("MPST"))
				.andExpect(jsonPath("$.data.label").value("현실파 점심헌터"))
				.andExpect(jsonPath("$.data.nickname").value("현실파 점심헌터"))
				.andExpect(jsonPath("$.data.keywords[0]").value("가성비"))
				.andExpect(jsonPath("$.data.goodMatch[0].type").value("NPSD"))
				.andExpect(jsonPath("$.data.goodMatch[0].imagePath").value("/mbtis/NPSD.png"))
				.andExpect(jsonPath("$.data.badMatch[0].type").value("MQAD"))
				.andExpect(jsonPath("$.data.badMatch[0].imagePath").value("/mbtis/MQAD.png"))
				.andExpect(jsonPath("$.data.imagePath").value("/mbtis/MPST.png"));
	}

	@Test
	@DisplayName("GET /onboarding/result/types/UNKNOWN returns 404")
	void typeResult_notFound() throws Exception {
		when(onboardingTypeQueryService.getByCode("UNKNOWN")).thenReturn(Optional.empty());

		mockMvc.perform(get("/onboarding/result/types/UNKNOWN"))
				.andExpect(status().isNotFound());
	}
}


