# app/services/scoring.py
# 점수 엔진 핵심 로직 (개인/그룹 공용)
# Author: Jang
# Date: 2025-10-29

from typing import List, Dict, Optional, Tuple
import math

from app.schemas.features import CandidateFeature, UserPrefFeature, TagPreference
from app.schemas.group_score import AppointmentConstraints

# 알고리즘/가중치 버전 (운영·로그용)
ALGO_VERSION = "cbf_v1.0"

# --- 내부 유틸 ----------------------------------------------------------------

def _clip(x: float, lo: float, hi: float) -> float:
    """값을 [lo, hi] 범위로 제한"""
    return max(lo, min(hi, x))

def _distance_decay(distance_m: float, lambda_per_km: float = 0.6) -> float:
    """
    거리 감쇠 계수(0~1). 1km 당 lambda를 적용한 지수 감쇠.
    """
    km = max(0.0, distance_m) / 1000.0
    return math.exp(-lambda_per_km * km)

def _tag_similarity(
    user_tags: Dict[int, TagPreference],
    restaurant_tags: Dict[int, TagPreference]
) -> float:
    """
    Tag 매칭 점수 계산
    - User_tag_pref와 Restaurant_tag의 공통 tag_id를 기준으로
    - User_tag_pref.score * confidence와 Restaurant_tag.weight * confidence를 곱해 가중합 계산
    """
    score = 0.0
    
    for tag_id, user_pref in user_tags.items():
        if tag_id in restaurant_tags:
            rest_pref = restaurant_tags[tag_id]
            # 사용자 선호도 점수 (user_tag_pref.score)와 식당 태그 가중치 (restaurant_tag.weight)의 곱
            # confidence를 곱해 확신도 높은 태그에 더 큰 가중치
            user_val = user_pref.get_value()  # user_tag_pref.score
            rest_val = rest_pref.get_value()  # restaurant_tag.weight
            match_score = user_val * user_pref.confidence * rest_val * rest_pref.confidence
            score += match_score
    
    return score

# --- 개인 점수 계산 ----------------------------------------------------------------

def score_personal(
    user: UserPrefFeature,
    candidates: List[CandidateFeature],
    debug: bool = False,
) -> List[Tuple[int, float, Optional[dict]]]:
    """
    개인 점수 계산
    - User_tag_pref와 Restaurant_tag를 Tag 기반으로 매칭
    반환: (restaurant_id, score, debug)
    """
    out: List[Tuple[int, float, Optional[dict]]] = []
    
    saved_set = set(user.saved)
    user_tags = user.tag_pref or {}
    rest_bias = user.rest_bias or {}
    
    for c in candidates:
        rid = c.restaurant_id
        restaurant_tags = c.tag_pref or {}
        
        # 1) Tag 기반 유사도 계산 (ERD: User_tag_pref vs Restaurant_tag)
        w_tag = _tag_similarity(user_tags, restaurant_tags)
        
        # 2) 북마크 가산 (비감쇠)
        w_saved = 0.5 if rid in saved_set else 0.0
        
        # 3) 식당별 바이어스 (ERD: User_Restaurant_State.pref_score 기반)
        w_bias = rest_bias.get(rid, 0.0)
        
        # 4) 거리 감쇠
        decay = _distance_decay(c.distance_m)
        
        base = w_tag + w_saved + w_bias
        score_val = base * decay
        
        dbg = None
        if debug:
            dbg = {
                "w_tag": round(w_tag, 4),
                "w_saved": round(w_saved, 4),
                "w_bias": round(w_bias, 4),
                "distance_decay": round(decay, 4),
                "final": round(score_val, 4),
            }
        
        out.append((rid, float(score_val), dbg))
    
    return out

# --- 그룹 점수 계산 ----------------------------------------------------------------

def _soft_constraint_adjustment(
    cand: CandidateFeature,
    constraints: Optional[AppointmentConstraints],
    debug: bool,
) -> Tuple[float, Optional[dict]]:
    """
    약속 제약을 소프트 가감으로 반영
    """
    if not constraints:
        return 0.0, None
    
    penalties = {}
    adj = 0.0
    
    # 반경 초과 감점
    try:
        if cand.distance_m is not None and constraints.radius_m is not None:
            over = cand.distance_m - constraints.radius_m
            if over > 0:
                p = -0.1 * (over / 300.0)
                p = _clip(p, -0.6, 0.0)
                adj += p
                penalties["distance_over_m"] = int(over)
    except Exception:
        pass
    
    # 가격대 선호 불일치
    try:
        if constraints.price_bucket is not None:
            if cand.price_bucket.value != int(constraints.price_bucket):
                adj += -0.15
                penalties["price_mismatch"] = 1
    except Exception:
        pass
    
    dbg = {"penalties": penalties, "soft_adj": round(adj, 4)} if debug and penalties else ({"soft_adj": round(adj, 4)} if debug and adj != 0 else None)
    return adj, dbg

def score_group(
    members: List[UserPrefFeature],
    candidates: List[CandidateFeature],
    constraints: Optional[AppointmentConstraints],
    debug: bool = False,
):
    """
    그룹 점수 계산
    - 각 멤버의 개인 점수 계산 -> 후보별 평균
    - 약속 제약은 소프트 가감으로만 반영
    반환: List[ (restaurant_id, per_user_scores{uid:score}, group_score, debug_dict) ]
    """
    results = []
    
    # 미리 개인별 점수 배열 계산
    per_member_scores: List[Tuple[int, List[Tuple[int, float, Optional[dict]]]]] = []
    for u in members:
        per_member_scores.append((u.user_id, score_personal(u, candidates, debug=debug)))
    
    for idx, cand in enumerate(candidates):
        per_user: Dict[int, float] = {}
        acc = 0.0
        cnt = 0
        
        # 후보 idx에 해당하는 개인 점수 수집
        for uid, arr in per_member_scores:
            rid_i, s_i, _dbg_i = arr[idx]
            if rid_i != cand.restaurant_id:
                for rid_j, s_j, _dbg_j in arr:
                    if rid_j == cand.restaurant_id:
                        s_i = s_j
                        break
            per_user[uid] = float(s_i)
            acc += s_i
            cnt += 1
        
        group_score = acc / max(cnt, 1)
        
        # 제약 소프트 가감
        soft_adj, dbg_pen = _soft_constraint_adjustment(cand, constraints, debug)
        group_score += soft_adj
        
        dbg = None
        if debug:
            dbg = {"avg_of": cnt}
            if dbg_pen:
                dbg.update(dbg_pen)
        
        results.append((cand.restaurant_id, per_user, float(group_score), dbg))
    
    return results
