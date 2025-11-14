package com.jde.mainserver.onboarding.controller;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import com.jde.mainserver.global.annotation.resolver.AuthUserArgumentResolver;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.onboarding.mbti.dto.MbtiChoiceItem;
import com.jde.mainserver.onboarding.mbti.dto.MbtiQuestionItem;
import com.jde.mainserver.onboarding.mbti.dto.MbtiQuestionsResponse;
import com.jde.mainserver.onboarding.mbti.service.MbtiQueryService;

import static org.mockito.Mockito.when;

@WebMvcTest(controllers = OnboardingController.class)
@AutoConfigureMockMvc(addFilters = false)
class OnboardingControllerTest {

	@Autowired
	MockMvc mockMvc;

	@MockBean
	MbtiQueryService mbtiQueryService;

	@MockBean
	OnboardingSurveyStore onboardingSurveyStore;

	@MockBean
	AuthUserArgumentResolver authUserArgumentResolver;

	@MockBean
	JpaMetamodelMappingContext jpaMetamodelMappingContext;

	private MbtiQuestionsResponse sampleResponse() {
		return new MbtiQuestionsResponse(List.of(
			new MbtiQuestionItem("q1", "아침/저녁 약속을 잡으려 합니다. 친구가 \"오늘 뭐 먹을래?\" 묻는데?",
				List.of(
					new MbtiChoiceItem("A", "그때 가서 분위기 봐서 정하자~", List.of("M", "P")),
					new MbtiChoiceItem("B", "어제 미리 찾아둔 맛집 리스트 보낼게.", List.of("N", "Q"))
				)
			),
			new MbtiQuestionItem("q2", "벌써 점심 시간! 메뉴를 고르는데, 두 후보가 있습니다.",
				List.of(
					new MbtiChoiceItem("A", "직장 근처 7천원 백반집", List.of("P", "T")),
					new MbtiChoiceItem("B", "조금 멀지만 리뷰 좋은 만원대 맛집", List.of("Q", "D"))
				)
			),
			new MbtiQuestionItem("q3", "식당에 들어섰는데 낯선 향이 확 풍겨옵니다.",
				List.of(
					new MbtiChoiceItem("A", "이게 그 유명한 신메뉴인가? 한 번 먹어볼까?", List.of("A")),
					new MbtiChoiceItem("B", "이상한 냄새나는데… 다른 메뉴로 바꿔야겠다.", List.of("S"))
				)
			),
			new MbtiQuestionItem("q4", "점심시간이 40분밖에 남지 않았습니다.",
				List.of(
					new MbtiChoiceItem("A", "그냥 빠른 메뉴로 먹자.", List.of("T")),
					new MbtiChoiceItem("B", "그래도 천천히 먹을래. 시간은 맞출 수 있어.", List.of("D"))
				)
			),
			new MbtiQuestionItem("q5", "음식이 나왔습니다.",
				List.of(
					new MbtiChoiceItem("A", "일단 사진부터 찍어야지", List.of("M", "D")),
					new MbtiChoiceItem("B", "식어버리니까 빨리 먹자!", List.of("N", "T"))
				)
			),
			new MbtiQuestionItem("q6", "저녁이 되어 친구가 '퇴근하고 고깃집 갈래?' 묻습니다.",
				List.of(
					new MbtiChoiceItem("A", "좋지! 새로 생긴 곳 한번 가보자.", List.of("A")),
					new MbtiChoiceItem("B", "지난번 갔던 곳이 낫지 않아?", List.of("S"))
				)
			),
			new MbtiQuestionItem("q7", "고깃집에 도착했는데 대기 손님이 많습니다.",
				List.of(
					new MbtiChoiceItem("A", "기다리기 싫은데... 다른 데 가자.", List.of("T")),
					new MbtiChoiceItem("B", "이 집 고기가 진짜라는데 좀 기다리자!", List.of("D"))
				)
			),
			new MbtiQuestionItem("q8", "친구가 제안합니다. '온두라스 음식점 찾았는데, 다음에 한번 가볼래?'",
				List.of(
					new MbtiChoiceItem("A", "잘 모르지만 재밌겠는데? 좋아!", List.of("A")),
					new MbtiChoiceItem("B", "음… 적당히 무난한 곳은 어때?", List.of("S"))
				)
			),
			new MbtiQuestionItem("q9", "집에 돌아가는 길, 오늘 하루를 떠올리며…",
				List.of(
					new MbtiChoiceItem("A", "분위기도 좋고 음식도 색달랐어. 행복하네😌", List.of("M", "D", "Q")),
					new MbtiChoiceItem("B", "시간·가격 모두 효율적이었어. 만족스럽다💼", List.of("N", "T", "P"))
				)
			)
		));
	}

	@Test
	@DisplayName("GET /onboarding/mbtis returns exact MBTI questions sample structure")
	void getMbtiQuestions_shouldReturnSample() throws Exception {
		when(mbtiQueryService.getQuestions()).thenReturn(sampleResponse());

		mockMvc.perform(get("/onboarding/mbtis"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.code").value("200"))
			.andExpect(jsonPath("$.data.items", hasSize(9)))

			// q1
			.andExpect(jsonPath("$.data.items[0].id").value("q1"))
			.andExpect(jsonPath("$.data.items[0].choices", hasSize(2)))
			.andExpect(jsonPath("$.data.items[0].choices[0].id").value("A"))
			.andExpect(jsonPath("$.data.items[0].choices[0].axes", contains("M","P")))
			.andExpect(jsonPath("$.data.items[0].choices[1].id").value("B"))
			.andExpect(jsonPath("$.data.items[0].choices[1].axes", contains("N","Q")))

			// q5 spot-check
			.andExpect(jsonPath("$.data.items[4].id").value("q5"))
			.andExpect(jsonPath("$.data.items[4].choices[0].axes", contains("M","D")))
			.andExpect(jsonPath("$.data.items[4].choices[1].axes", contains("N","T")))

			// q9 spot-check
			.andExpect(jsonPath("$.data.items[8].id").value("q9"))
			.andExpect(jsonPath("$.data.items[8].choices[0].axes", contains("M","D","Q")))
			.andExpect(jsonPath("$.data.items[8].choices[1].axes", contains("N","T","P")));
	}
}


