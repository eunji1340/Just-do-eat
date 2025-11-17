package com.jde.mainserver.onboarding.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jde.mainserver.global.annotation.resolver.AuthUserArgumentResolver;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.onboarding.bingo.service.BingoQueryService;
import com.jde.mainserver.onboarding.mbti.service.MbtiQueryService;
import com.jde.mainserver.onboarding.service.MbtiComputeService;
import com.jde.mainserver.onboarding.service.OnboardingTagPrefInitializer;
import com.jde.mainserver.onboarding.service.OnboardingTypeQueryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OnboardingController.class)
@AutoConfigureMockMvc(addFilters = false)
class OnboardingControllerApplyTagPrefsTest {

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
	OnboardingTagPrefInitializer onboardingTagPrefInitializer;
	@MockBean
	JpaMetamodelMappingContext jpaMetamodelMappingContext;

	@Test
	@DisplayName("POST /onboarding/apply-tag-prefs calls initializer with authenticated userId")
	void apply_calls_initializer() throws Exception {
		var auth = new TestingAuthenticationToken("123", null);

		mockMvc.perform(
				post("/onboarding/apply-tag-prefs")
					.principal(auth)
					.contentType(MediaType.APPLICATION_JSON)
			)
			.andExpect(status().isOk());

		verify(onboardingTagPrefInitializer, times(1)).applyFromStore(eq(123L), eq(null));
	}
}


