package com.jde.mainserver.onboarding.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.main.repository.UserTagPrefRepository;
import com.jde.mainserver.restaurants.entity.Tag;
import com.jde.mainserver.restaurants.entity.Tag.TagType;
import com.jde.mainserver.restaurants.repository.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * OnboardingTagPrefInitializer에 대한 단위 테스트.
 * - 축/메뉴 매핑 계산과 클램프/신뢰도 계산을 검증한다.
 */
class OnboardingTagPrefInitializerTest {

	private OnboardingSurveyStore store;
	private TagRepository tagRepository;
	private UserTagPrefRepository userTagPrefRepository;
	private ObjectMapper objectMapper;
	private OnboardingTagPrefInitializer sut;

	@BeforeEach
	void setUp() {
		store = mock(OnboardingSurveyStore.class);
		tagRepository = mock(TagRepository.class);
		userTagPrefRepository = mock(UserTagPrefRepository.class);
		objectMapper = new ObjectMapper();
		sut = new OnboardingTagPrefInitializer(store, tagRepository, userTagPrefRepository, objectMapper);
	}

	@Test
	@DisplayName("HappyPath: M=2, pineapple_pizza=+1 → FLAVOR/새콤달콤한 = 2.0, conf≈0.667")
	void applyFromStore_happy() {
		// given: 온보딩 JSON (answers.mukbtiResult.weights + bingoResponses)
		long userId = 10L;
		String json = """
			{
			  "answers": {
			    "mukbtiResult": { "code": "MPST", "weights": { "M": 2 } },
			    "bingoResponses": [ {"id":"pineapple_pizza", "vote": 1} ]
			  }
			}
			""";
		when(store.findByUser(userId)).thenReturn(Optional.of(json));

		// 매핑 대상 중 검증할 태그 1개만 스텁: (FLAVOR, "새콤달콤한")
		Tag t = mock(Tag.class);
		when(t.getId()).thenReturn(111L);
		when(tagRepository.findByTypeAndName(TagType.FLAVOR, "새콤달콤한"))
			.thenReturn(Optional.of(t));

		// when
		sut.applyFromStore(userId, null);

		// then: deleteByUserId 호출 및 upsertIncrement 인자 검증
		verify(userTagPrefRepository, times(1)).deleteByUserId(userId);

		ArgumentCaptor<BigDecimal> initScore = ArgumentCaptor.forClass(BigDecimal.class);
		ArgumentCaptor<BigDecimal> initConf = ArgumentCaptor.forClass(BigDecimal.class);
		verify(userTagPrefRepository, atLeastOnce()).upsertIncrement(
			eq(userId),
			eq(111L),
			initScore.capture(),
			initConf.capture(),
			any(BigDecimal.class),
			any(BigDecimal.class)
		);
		double score = initScore.getValue().doubleValue();
		double conf = initConf.getValue().doubleValue();
		// pineapple_pizza(새콤달콤한 weight=2) * vote(1) = 2.0
		assertThat(score).isCloseTo(2.0, within(1e-6));
		// conf = |score|/3 = 0.666...
		assertThat(conf).isCloseTo(2.0 / 3.0, within(1e-6));
	}

	@Test
	@DisplayName("Clamp: A=3 + pineapple_pizza(+1) → FLAVOR/이국적인 >= 5 → 3.0으로 클램프, conf=1.0")
	void applyFromStore_clamp() {
		// given
		long userId = 20L;
		String json = """
			{
			  "answers": {
			    "mukbtiResult": { "code": "MQAD", "weights": { "A": 3 } },
			    "bingoResponses": [ {"id":"pineapple_pizza", "vote": 1} ]
			  }
			}
			""";
		when(store.findByUser(userId)).thenReturn(Optional.of(json));

		// (FLAVOR, "이국적인") 매핑 존재: A(이국적인 weight=3)*norm(3/3=1)=3 + pineapple(이국적인 weight=2)*1=2 → 5 → 3으로 클램프
		Tag t = mock(Tag.class);
		when(t.getId()).thenReturn(222L);
		when(tagRepository.findByTypeAndName(TagType.FLAVOR, "이국적인"))
			.thenReturn(Optional.of(t));

		// when
		sut.applyFromStore(userId, null);

		// then
		verify(userTagPrefRepository, times(1)).deleteByUserId(userId);
		ArgumentCaptor<BigDecimal> initScore = ArgumentCaptor.forClass(BigDecimal.class);
		ArgumentCaptor<BigDecimal> initConf = ArgumentCaptor.forClass(BigDecimal.class);
		verify(userTagPrefRepository, atLeastOnce()).upsertIncrement(
			eq(userId),
			eq(222L),
			initScore.capture(),
			initConf.capture(),
			any(BigDecimal.class),
			any(BigDecimal.class)
		);
		assertThat(initScore.getValue().doubleValue()).isCloseTo(3.0, within(1e-6));
		assertThat(initConf.getValue().doubleValue()).isCloseTo(1.0, within(1e-6));
	}
}


