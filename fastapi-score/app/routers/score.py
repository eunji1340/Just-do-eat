# app/routers/score.py
# 점수 엔진 라우터 (personal/group)
# Author: Jang
# Date: 2025-10-29

import logging
import json
from fastapi import APIRouter, Query
from time import perf_counter
from typing import Dict, Any, List, Optional

from app.schemas.personal_score import PersonalScoreRequest, PersonalScoreResponse
from app.schemas.group_score import GroupScoreRequest, GroupScoreResponse, PerCandidateGroupScore
from app.services.scoring import score_personal, score_group, ALGO_VERSION
from app.services.ml_scoring import score_personal_ml, load_ml_model

# 로거 설정
logger = logging.getLogger(__name__)

router = APIRouter(tags=["score"])

# ML 모델 사용 가능 여부 (지연 로드)
ML_AVAILABLE = None

def _check_ml_available():
    """ML 모델 사용 가능 여부 확인 (지연 로드)"""
    global ML_AVAILABLE
    if ML_AVAILABLE is None:
        try:
            load_ml_model()
            ML_AVAILABLE = True
        except Exception as e:
            logger.warning(f"ML 모델 로드 실패 (규칙 엔진으로 폴백): {e}")
            ML_AVAILABLE = False
    return ML_AVAILABLE

@router.post("/score/personal", response_model=None)  # response_model 제거 (성능 개선)
def personal_score(
    req: PersonalScoreRequest,
    algo: Optional[str] = Query("cbf_v1.2", description="알고리즘 버전: cbf_v1.2 (규칙) 또는 ml_v1 (ML 결합)")
) -> Dict[str, Any]:
    t0 = perf_counter()
    
    user_id = req.user.user_id if hasattr(req.user, 'user_id') else None
    num_candidates = len(req.candidates)
    
    # 데이터 확인 (문제가 있을 때만 경고)
    user_tag_pref_size = len(req.user.tag_pref) if req.user.tag_pref else 0
    if user_tag_pref_size == 0:
        logger.warning(f"API_USER_TAG_PREF_EMPTY: user_id={user_id}")
    
    candidates_with_tags = [c for c in req.candidates if c.tag_pref and len(c.tag_pref) > 0]
    if not candidates_with_tags:
        logger.warning(f"API_CANDIDATE_TAGS_EMPTY: 태그가 있는 후보가 없음 (total={num_candidates})")
    
    # 알고리즘 선택
    if algo == "ml_v1" and _check_ml_available():
        scored = score_personal_ml(req.user, req.candidates, debug=req.debug)
        algo_version = "ml_v1"
    else:
        scored = score_personal(req.user, req.candidates, debug=req.debug)
        algo_version = ALGO_VERSION
    
    elapsed = int((perf_counter() - t0) * 1000)
    
    # API 레벨 로깅 (불필요한 대형 dict 로그 축소, 성능 최적화)
    if elapsed > 100:  # 성능 경고만 자세히 로깅
        logger.warning(f"API_SCORE_SLOW: elapsed_ms={elapsed} > 100ms, algo={algo_version}, num_candidates={num_candidates}, top5_scores={[float(s) for _, s, _ in scored[:5]]}")
    else:
        # 정상 응답은 간단히만 로깅 (DEBUG 레벨로 변경하여 INFO 레벨에서 대용량 로그 방지)
        logger.debug(f"API_SCORE: algo={algo_version}, num_candidates={num_candidates}, elapsed_ms={elapsed}")

    return {
        "scores": [
            {"restaurant_id": rid, "score": float(s), "debug": dbg}
            for rid, s, dbg in scored
        ],
        "algo_version": algo_version,
        "elapsed_ms": elapsed,
    }

@router.post("/score/group", response_model=GroupScoreResponse)
def group_score(req: GroupScoreRequest) -> Dict[str, Any]:
    t0 = perf_counter()
    results = score_group(req.members, req.candidates, debug=req.debug)
    elapsed = int((perf_counter() - t0) * 1000)

    return {
        "results": [
            PerCandidateGroupScore(
                restaurant_id=rid,
                per_user=per_user,
                group_score=float(gscore),
                debug=dbg,
            )
        for rid, per_user, gscore, dbg in results
        ],
        "algo_version": ALGO_VERSION,
        "elapsed_ms": elapsed,
    }
