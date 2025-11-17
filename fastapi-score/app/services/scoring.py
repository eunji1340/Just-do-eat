# app/services/scoring.py
# 점수 엔진 핵심 로직 (개인/그룹 공용)
# Author: Jang
# Date: 2025-10-29

from typing import List, Dict, Optional, Tuple
import math

from app.schemas.features import CandidateFeature, UserPrefFeature, TagPreference

# 알고리즘/가중치 버전 (운영·로그용)
ALGO_VERSION = "cbf_v1.2"

# 가중치 상수 (개인 피드용 재밸런스)
ALPHA_TAG = 0.55   # 태그 비중
BETA_PREF = 0.45   # 개인 선호 비중
PREF_SCALE = 0.20  # pref_score 스케일링 계수 (기존 0.10 → 0.20)

# 콜드스타트 감쇠
COLD_START_DAMP = 0.85  # 상호작용 없는 식당에 적용할 감쇠 계수 (-15%)

# 그룹 점수 계산 파라미터
GROUP_SOFTMIN_TAU = 0.7  # softmin 온도 파라미터 (tau ↓ : 더 min에 민감 / tau ↑ : 평균에 가까워짐)
GROUP_MIN_THRESHOLD = -0.5  # min-clip 평균용 하한선
GROUP_PENALTY = 0.2  # 하한선 미달 시 패널티

# --- 내부 유틸 ----------------------------------------------------------------

def _clip(x: float, lo: float, hi: float) -> float:
    """값을 [lo, hi] 범위로 제한"""
    return max(lo, min(hi, x))

def _distance_decay(distance_m: float, lambda_per_km: float = 0.6) -> float:
    """
    거리 감쇠 계수(0~1). 700m 이하는 감쇠 없음, 700m 초과 시 1km 당 lambda를 적용한 지수 감쇠.
    """
    if distance_m <= 700.0:
        return 1.0
    km = (distance_m - 700.0) / 1000.0
    return math.exp(-lambda_per_km * km)

def _softmin(scores: List[float], tau: float = 0.7) -> float:
    """
    Softmin (로그-합-지수) 기반 평균
    - 음수 입력에 안전하고, 낮은 점수(불만)에 민감하게 반응
    - tau ↓ : 더 min에 민감 / tau ↑ : 평균에 가까워짐
    """
    if not scores:
        return 0.0
    n = len(scores)
    # 음수 안전: exp(-s/tau)는 모든 실수 s에 대해 안전
    return -tau * math.log(sum(math.exp(-s / tau) for s in scores) / n)

def _tag_similarity(
    user_tags: Dict[int, TagPreference],
    restaurant_tags: Dict[int, TagPreference]
) -> float:
    """
    Tag 매칭 점수 계산 (개선 버전)
    - 개별 항 기여값 캡 적용
    - 태그 수 정규화 적용
    - 대역 제한 Squash 적용
    """
    # 매칭 태그 수 카운트
    match_count = 0
    score_sum = 0.0
    
    for tag_id, user_pref in user_tags.items():
        if tag_id in restaurant_tags:
            rest_pref = restaurant_tags[tag_id]
            
            # 1. 개별 항 기여값 캡
            # user_val: [-3, +3] (이미 정책상 범위)
            user_val = _clip(user_pref.get_value(), -3.0, 3.0)
            
            # rest_val: [0, 6] 로 캡 (음수 가중치 제거, 최대 6으로 제한)
            rest_val = _clip(rest_pref.get_value(), 0.0, 6.0)
            
            # confidence: [0.2, 0.95] 로 바닥/천장 설정
            user_conf = _clip(user_pref.confidence, 0.2, 0.95)
            rest_conf = _clip(rest_pref.confidence, 0.2, 0.95)
            
            # 매칭 점수 계산
            match_score = user_val * user_conf * rest_val * rest_conf
            score_sum += match_score
            match_count += 1
    
    # 매칭 태그가 없으면 0 반환
    if match_count == 0:
        return 0.0
    
    # 2. 태그 수 정규화: w_tag_sum / sqrt(k)
    normalized_score = score_sum / math.sqrt(match_count)
    
    # 3. 대역 제한 Squash: A * tanh(w_tag_sum / T)
    # A(출력 스케일): 2.2, T(온도/민감도): 3.5 (고태그 후보의 상단 독주 완화)
    A = 2.2
    T = 3.5
    w_tag = A * math.tanh(normalized_score / T)
    
    return w_tag

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
    
    user_tags = user.tag_pref or {}
    
    # pref_score가 있는 식당 수 카운트 (문제가 있을 때만 로깅)
    pref_score_count = sum(1 for c in candidates if c.pref_score is not None)
    # pref_score는 선택적이므로 로깅하지 않음
    
    for c in candidates:
        rid = c.restaurant_id
        restaurant_tags = c.tag_pref or {}
        
        # 1) Tag 기반 유사도 계산 (ERD: User_tag_pref vs Restaurant_tag)
        w_tag = _tag_similarity(user_tags, restaurant_tags)
        
        # 2) 개인 선호 점수 (pref_score) 추출
        pref = c.pref_score
        
        # 3) 거리 감쇠
        decay = _distance_decay(c.distance_m) if c.distance_m is not None else 1.0
        
        # pref_score 기반 점수 가산
        # pref_score 범위: -10.0 ~ +10.0 → 점수 범위: -2.0 ~ +2.0으로 스케일링
        w_pref = 0.0
        if pref is not None:
            # pref_score를 직접 반영 (스케일링: 10.0 → 2.0)
            # 0.0도 포함하여 모든 값을 반영 (음수도 포함)
            w_pref = float(pref) * PREF_SCALE
        
        # 4) 행동 부스트 (최근 14일 내 행동에 대한 부스트, 상한 0.25)
        w_eng = 0.0
        if c.engagement_boost is not None:
            w_eng = min(float(c.engagement_boost), 0.25)  # 상한 0.25 적용
        
        # base 계산: 가중 합 + 행동 부스트 (태그 비중 0.55, 개인 선호 비중 0.45)
        base = ALPHA_TAG * w_tag + BETA_PREF * w_pref + w_eng
        
        # 완전 정보 없음일 때만 아주 작은 기본값 적용 (음수 신호는 유지)
        if w_tag == 0.0 and w_pref == 0.0 and w_eng == 0.0:
            base = 0.01  # 완전 정보 없음일 때만 미세한 기본값
        
        # 5) 콜드스타트 감쇠 (상호작용 없는 식당에 -15% 감쇠)
        if c.has_interaction_recent is False:
            base *= COLD_START_DAMP
        
        # 최종 점수: base * 거리감쇠
        score_val = base * decay
        
        # pref_score가 있는 식당은 debug 모드에서만 상세 로깅
        # (일반적으로는 로깅하지 않음)
        
        dbg = None
        if debug:
            cold_damp_applied = COLD_START_DAMP if (c.has_interaction_recent is False) else 1.0
            dbg = {
                "w_tag": round(w_tag, 4),
                "pref_score": pref if pref is not None else None,  # 원본 pref_score 값
                "w_pref": round(w_pref, 4),
                "w_eng": round(w_eng, 4),  # 행동 부스트
                "alpha_tag": ALPHA_TAG,
                "beta_pref": BETA_PREF,
                "w_tag_contribution": round(ALPHA_TAG * w_tag, 4),  # 태그 기여도
                "w_pref_contribution": round(BETA_PREF * w_pref, 4),  # 선호도 기여도
                "has_interaction_recent": c.has_interaction_recent,
                "cold_start_damp": round(cold_damp_applied, 4),
                "base": round(base, 4),
                "distance_decay": round(decay, 4),
                "final": round(score_val, 4),
            }
        
        out.append((rid, float(score_val), dbg))
    
    return out

# --- 그룹 점수 계산 ----------------------------------------------------------------


def score_group(
    members: List[UserPrefFeature],
    candidates: List[CandidateFeature],
    debug: bool = False,
):
    """
    그룹 점수 계산
    - 각 멤버의 개인 점수 계산 -> 후보별 평균
    반환: List[ (restaurant_id, per_user_scores{uid:score}, group_score, debug_dict) ]
    """
    results = []
    
    # 미리 개인별 점수 배열 계산
    per_member_scores: List[Tuple[int, List[Tuple[int, float, Optional[dict]]]]] = []
    for u in members:
        per_member_scores.append((u.user_id, score_personal(u, candidates, debug=debug)))
    
    for idx, cand in enumerate(candidates):
        per_user: Dict[int, float] = {}
        scores_list: List[float] = []
        
        # 후보 idx에 해당하는 개인 점수 수집
        for uid, arr in per_member_scores:
            rid_i, s_i, _dbg_i = arr[idx]
            if rid_i != cand.restaurant_id:
                for rid_j, s_j, _dbg_j in arr:
                    if rid_j == cand.restaurant_id:
                        s_i = s_j
                        break
            per_user[uid] = float(s_i)
            scores_list.append(float(s_i))
        
        cnt = len(scores_list)
        
        # 그룹 점수 계산: Softmin + min-clip 평균 하이브리드
        # Softmin은 낮은 점수(불만)에 민감하게 반응하며, 음수 입력에도 안전
        if cnt > 0:
            # 1) Softmin 계산 (불만에 민감하게 반응)
            softmin_val = _softmin(scores_list, tau=GROUP_SOFTMIN_TAU)
            
            # 2) 단순 평균 및 min-clip 체크
            simple_avg = sum(scores_list) / cnt
            has_low_score = any(s < GROUP_MIN_THRESHOLD for s in scores_list)
            
            if has_low_score:
                # 하한선 미달 유저가 있으면 패널티 적용
                group_score = simple_avg - GROUP_PENALTY
            else:
                # Softmin 사용 (낮은 점수에 민감하게 반응)
                group_score = softmin_val
        else:
            group_score = 0.0
        
        dbg = None
        if debug:
            simple_avg = sum(scores_list) / max(cnt, 1) if cnt > 0 else 0.0
            softmin_val = _softmin(scores_list, tau=GROUP_SOFTMIN_TAU) if cnt > 0 else 0.0
            has_low = any(s < GROUP_MIN_THRESHOLD for s in scores_list) if cnt > 0 else False
            dbg = {
                "member_count": cnt,
                "simple_avg": round(simple_avg, 4),
                "softmin": round(softmin_val, 4),
                "softmin_tau": GROUP_SOFTMIN_TAU,
                "has_low_score": has_low,
                "min_score": round(min(scores_list), 4) if scores_list else None,
                "final_group_score": round(group_score, 4),
            }
        
        results.append((cand.restaurant_id, per_user, float(group_score), dbg))
    
    return results
