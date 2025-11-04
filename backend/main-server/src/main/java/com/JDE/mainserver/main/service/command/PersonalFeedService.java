/**
 * main/service/command/PersonalFeedService.java
 * 후보→유저/식당 벡터→FastAPI 점수 호출→Top N 컷
 * Author: Jang
 * Date: 2025-10-31
 */
package com.JDE.mainserver.main.service.command;

import com.JDE.mainserver.main.service.query.CandidateRetrievalService;
import com.JDE.mainserver.main.service.query.ScoreEngineClient;
import com.JDE.mainserver.main.service.query.UserTagPrefProvider;
import com.JDE.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.JDE.mainserver.main.web.dto.response.PersonalScoreResponse;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class PersonalFeedService {
	private final UserTagPrefProvider userTagPrefProvider;
	private final CandidateRetrievalService cands;
	private final ScoreEngineClient scorer;

	public PersonalFeedService(UserTagPrefProvider userTagPrefProvider, CandidateRetrievalService cands, ScoreEngineClient scorer) {
		this.userTagPrefProvider = userTagPrefProvider;
		this.cands = cands;
		this.scorer = scorer;
	}

	public PersonalScoreResponse get(long userId, int top, boolean debug, Map<String, Object> ctx) {
		// UserTagPrefProvider의 TagStat을 TagPreference로 변환
		var userTagStats = userTagPrefProvider.getUserTagStats(userId);
		var userTagPref = userTagStats.entrySet().stream()
			.collect(java.util.stream.Collectors.toMap(
				java.util.Map.Entry::getKey,
				e -> new PersonalScoreRequest.TagPreference(
					(float) e.getValue().score(),
					(float) e.getValue().confidence()
				)
			));
		var candidates = cands.getCandidates(userId, ctx);
		var req = PersonalScoreRequest.of(userId, userTagPref, candidates);
		var res = scorer.score(req);

		// 점수 높은 순으로 정렬 (내림차순)
		var sortedItems = res.items().stream()
			.sorted((a, b) -> Double.compare(b.score(), a.score()))
			.toList();

		// Top N 컷
		var finalItems = sortedItems.size() > top 
			? sortedItems.subList(0, top)
			: sortedItems;

		return new PersonalScoreResponse(finalItems, res.debug());
	}
}