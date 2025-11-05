# app/routers/score.py
# 점수 엔진 라우터 (personal/group)
# Author: Jang
# Date: 2025-10-29

from fastapi import APIRouter
from time import perf_counter
from typing import Dict, Any, List

from app.schemas.personal_score import PersonalScoreRequest, PersonalScoreResponse
from app.schemas.group_score import GroupScoreRequest, GroupScoreResponse, PerCandidateGroupScore
from app.services.scoring import score_personal, score_group, ALGO_VERSION

router = APIRouter(tags=["score"])

@router.post("/score/personal", response_model=PersonalScoreResponse)
def personal_score(req: PersonalScoreRequest) -> Dict[str, Any]:
    t0 = perf_counter()
    scored = score_personal(req.user, req.candidates, debug=req.debug)
    elapsed = int((perf_counter() - t0) * 1000)

    return {
        "scores": [
            {"restaurant_id": rid, "score": float(s), "debug": dbg}
            for rid, s, dbg in scored
        ],
        "algo_version": ALGO_VERSION,
        "elapsed_ms": elapsed,
    }

@router.post("/score/group", response_model=GroupScoreResponse)
def group_score(req: GroupScoreRequest) -> Dict[str, Any]:
    t0 = perf_counter()
    results = score_group(req.members, req.candidates, req.appointment_constraints, debug=req.debug)
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
