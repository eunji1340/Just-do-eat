package com.jde.mainserver.onboarding.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jde.mainserver.onboarding.dto.request.MukbtiAnswer;
import com.jde.mainserver.onboarding.mbti.repository.TestQuestionRepository;

import lombok.RequiredArgsConstructor;

/**
 * 먹BTI 계산 서비스.
 * - DB에 정의된 문항/선택지의 축 매핑을 조회하여, 사용자의 응답에 기반해 최종 4글자 코드를 계산
 * - 축 쌍: (M,N), (P,Q), (S,T), (D,A) 순서로 코드 생성
 * - 동률 발생 시(이론상 없도록 출제했으나 예외 대비) 앞 글자 우선 선택
 */
@Service
@RequiredArgsConstructor
public class MbtiComputeService {

	private final TestQuestionRepository testQuestionRepository;
	private final ObjectMapper om;

	/**
	 * 사용자의 문항 응답을 기반으로 먹BTI 코드를 계산한다.
	 * @param answers 사용자가 제출한 문항 응답 리스트
	 * @return 최종 코드와 가중치 맵
	 */
	public MbtiComputeResult compute(List<MukbtiAnswer> answers) {
		// qid("q{숫자}")와 choice("A"/"B") 기준으로 축 배열을 조회할 수 있도록 맵 구성
		Map<String, Map<String, List<String>>> qChoiceToAxes = buildChoiceAxesMap();

		// 각 축의 카운트 맵 초기화
		Map<String, Integer> axisCounts = new HashMap<>();

		if (answers != null) {
			for (MukbtiAnswer a : answers) {
				if (a == null || isBlank(a.qid()) || isBlank(a.choiceId())) continue;
				Map<String, List<String>> byChoice = qChoiceToAxes.get(a.qid());
				if (byChoice == null) continue;
				List<String> axes = byChoice.get(a.choiceId());
				if (axes == null) continue;
				for (String axis : axes) {
					if (isBlank(axis)) continue;
					// 단순 누적(merge 사용 시 제네릭 경고가 발생할 수 있어 명시적 합산 사용)
					axisCounts.put(axis, axisCounts.getOrDefault(axis, 0) + 1);
				}
			}
		}

		// 축 쌍별 우세 측과 차이를 계산하여 코드와 가중치 생성
		PairResult mn = decide(axisCounts, "M", "N"); // 1번째 자리
		PairResult pq = decide(axisCounts, "P", "Q"); // 2번째 자리
		PairResult st = decide(axisCounts, "S", "A"); // 3번째 자리
		PairResult da = decide(axisCounts, "T", "D"); // 4번째 자리

		String code = "" + mn.winner + pq.winner + st.winner + da.winner;

		Map<String, Integer> weights = new HashMap<>();
		weights.put(String.valueOf(mn.winner), mn.diff);
		weights.put(String.valueOf(pq.winner), pq.diff);
		weights.put(String.valueOf(st.winner), st.diff);
		weights.put(String.valueOf(da.winner), da.diff);

		return new MbtiComputeResult(code, weights);
	}

	private Map<String, Map<String, List<String>>> buildChoiceAxesMap() {
		Map<String, Map<String, List<String>>> map = new HashMap<>();
		List<TestQuestionRepository.QuestionChoiceRow> rows = testQuestionRepository.findAllWithChoices();
		for (TestQuestionRepository.QuestionChoiceRow row : rows) {
			String qid = "q" + row.getQId();
			map.computeIfAbsent(qid, k -> new HashMap<>())
				.put(row.getCCode(), parseAxes(row.getAxesJson()));
		}
		return map;
	}

	private List<String> parseAxes(String json) {
		if (json == null || json.isBlank()) return List.of();
		try {
			return om.readValue(json, new TypeReference<List<String>>() {});
		} catch (Exception e) {
			return List.of();
		}
	}

	private PairResult decide(Map<String, Integer> counts, String left, String right) {
		int l = counts.getOrDefault(left, 0);
		int r = counts.getOrDefault(right, 0);
		if (l > r) return new PairResult(left.charAt(0), l - r);
		if (r > l) return new PairResult(right.charAt(0), r - l);
		// 동률 시 앞 글자 우선
		return new PairResult(left.charAt(0), 0);
	}

	private boolean isBlank(String s) {
		return s == null || s.trim().isEmpty();
	}

	private record PairResult(char winner, int diff) {}
}


