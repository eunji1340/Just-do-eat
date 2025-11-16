package com.jde.mainserver.onboarding.mbti.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.jde.mainserver.onboarding.mbti.entity.TestQuestion;

@Repository
public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

	interface QuestionChoiceRow {
		Long getQId();
		String getQText();
		String getCCode();
		String getCText();
		String getAxesJson();
	}

	@Query(value = """
		SELECT
			q.id AS qId,
			q.text AS qText,
			c.code AS cCode,
			c.text AS cText,
			to_json(COALESCE(array_agg(a.axis) FILTER (WHERE a.axis IS NOT NULL), ARRAY[]::text[])) AS axesJson
		FROM test_question q
		JOIN test_choice c ON c.question_id = q.id
		LEFT JOIN test_choice_axis a ON a.choice_id = c.id
		GROUP BY q.id, q.text, c.code, c.text
		ORDER BY q.id ASC, c.code ASC
		""", nativeQuery = true)
	List<QuestionChoiceRow> findAllWithChoices();
}


