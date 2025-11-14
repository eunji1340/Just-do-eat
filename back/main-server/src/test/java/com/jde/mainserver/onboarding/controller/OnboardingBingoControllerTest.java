package com.jde.mainserver.onboarding.controller;

import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.onboarding.bingo.dto.BingoItem;
import com.jde.mainserver.onboarding.bingo.dto.BingoItemsResponse;
import com.jde.mainserver.onboarding.bingo.service.BingoQueryService;
import com.jde.mainserver.onboarding.mbti.service.MbtiQueryService;
import com.jde.mainserver.global.annotation.resolver.AuthUserArgumentResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OnboardingController.class)
@AutoConfigureMockMvc(addFilters = false)
class OnboardingBingoControllerTest {

	@Autowired
	MockMvc mockMvc;

	@MockBean
	BingoQueryService bingoQueryService;

	@MockBean
	MbtiQueryService mbtiQueryService;

	@MockBean
	OnboardingSurveyStore onboardingSurveyStore;

	@MockBean
	AuthUserArgumentResolver authUserArgumentResolver;

	@MockBean
	JpaMetamodelMappingContext jpaMetamodelMappingContext;

	private BingoItemsResponse sample() {
		return new BingoItemsResponse(List.of(
				new BingoItem("pineapple_pizza", "파인애플 피자"),
				new BingoItem("cilantro", "고수"),
				new BingoItem("blue_cheese", "블루치즈"),
				new BingoItem("durian", "두리안"),
				new BingoItem("natto", "낫토"),
				new BingoItem("mala_spicy_numbing", "마라(화자/저림)"),
				new BingoItem("offal_gopchang", "내장·곱창"),
				new BingoItem("anchovy", "앤초비"),
				new BingoItem("olive", "올리브"),
				new BingoItem("kimchi_strong", "김치·강발효"),
				new BingoItem("sashimi", "생선회(사시미)"),
				new BingoItem("yukhoe", "육회"),
				new BingoItem("pyeongyang_naengmyeon", "평양냉면"),
				new BingoItem("tteokbokki", "떡볶이"),
				new BingoItem("salad", "샐러드"),
				new BingoItem("lamb_mutton", "양고기(머튼)"),
				new BingoItem("truffle_oil", "트러플 오일"),
				new BingoItem("cheonggukjang", "청국장"),
				new BingoItem("uni", "성게알(우니)"),
				new BingoItem("mint_chocolate", "민트초코"),
				new BingoItem("jajangmyeon", "자장면"),
				new BingoItem("jokbal", "족발"),
				new BingoItem("yangnyeom_chicken", "양념치킨(달콤매콤)"),
				new BingoItem("sundae", "순대"),
				new BingoItem("smoke_barbecue", "스모크/바비큐")
		));
	}

	@Test
	@DisplayName("GET /onboarding/bingo returns raw items array ordered by display_order")
	void getBingo_shouldReturnRawList() throws Exception {
		when(bingoQueryService.getItems()).thenReturn(sample());

		mockMvc.perform(get("/onboarding/bingo"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", org.hamcrest.Matchers.hasSize(25)))

				// first two
				.andExpect(jsonPath("$.items[0].id").value("pineapple_pizza"))
				.andExpect(jsonPath("$.items[0].label").value("파인애플 피자"))
				.andExpect(jsonPath("$.items[1].id").value("cilantro"))
				.andExpect(jsonPath("$.items[1].label").value("고수"))

				// last one
				.andExpect(jsonPath("$.items[24].id").value("smoke_barbecue"))
				.andExpect(jsonPath("$.items[24].label").value("스모크/바비큐"));
	}
}


