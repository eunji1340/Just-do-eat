/**
 * main/service/query/CandidateRetrievalService.java
 * 후보 식당 조회 인터페이스
 * Author: Jang
 * Date: 2025-10-31
 */

package com.JDE.mainserver.main.service.query;

import com.JDE.mainserver.main.web.dto.request.PersonalScoreRequest.Candidate;
import java.util.List;
import java.util.Map;

public interface CandidateRetrievalService {
	List<Candidate> getCandidates(long userId, Map<String, Object> context);
}