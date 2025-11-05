package com.jde.mainserver.main.service.query;

/**
 * main/service/query/ScoreEngineClient.java
 * FastAPI 점수 엔진 클라이언트 인터페이스
 * Author: Jang
 * Date: 2025-10-31
 */


import com.jde.mainserver.main.web.dto.request.PersonalScoreRequest;
import com.jde.mainserver.main.web.dto.response.PersonalScoreResponse;

public interface ScoreEngineClient {
    PersonalScoreResponse score(PersonalScoreRequest req);
}