package com.jde.mainserver.onboarding.mbti.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jde.mainserver.onboarding.mbti.dto.MbtiChoiceItem;
import com.jde.mainserver.onboarding.mbti.dto.MbtiQuestionItem;
import com.jde.mainserver.onboarding.mbti.dto.MbtiQuestionsResponse;
import com.jde.mainserver.onboarding.mbti.repository.TestQuestionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MbtiQueryService {

	private final TestQuestionRepository testQuestionRepository;
	private final ObjectMapper om;

	public MbtiQuestionsResponse getQuestions() {
		List<TestQuestionRepository.QuestionChoiceRow> rows = testQuestionRepository.findAllWithChoices();

		Map<Long, QuestionAggregate> agg = new LinkedHashMap<>();

		for (TestQuestionRepository.QuestionChoiceRow row : rows) {
			QuestionAggregate qa = agg.computeIfAbsent(row.getQId(), id -> new QuestionAggregate(row.getQText()));
			List<String> axes = parseAxes(row.getAxesJson());
			MbtiChoiceItem choice = new MbtiChoiceItem(row.getCCode(), row.getCText(), axes);
			qa.choices.add(choice);
		}

		List<MbtiQuestionItem> items = agg.entrySet().stream()
			.map(e -> new MbtiQuestionItem("q" + e.getKey(), e.getValue().text, e.getValue().choices))
			.collect(Collectors.toList());

		return new MbtiQuestionsResponse(items);
	}

	private List<String> parseAxes(String json) {
		if (json == null || json.isBlank()) return List.of();
		try {
			return om.readValue(json, new TypeReference<List<String>>() {});
		} catch (Exception e) {
			return List.of();
		}
	}

	private static class QuestionAggregate {
		private final String text;
		private final List<MbtiChoiceItem> choices = new ArrayList<>();

		private QuestionAggregate(String text) {
			this.text = text;
		}
	}
}


