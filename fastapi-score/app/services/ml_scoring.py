# app/services/ml_scoring.py
# ML 모델 기반 스코어링 서비스
# Author: Auto-generated
# Date: 2025-01-XX

import os
import pickle
import json
import logging
import hashlib
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from time import perf_counter
import numpy as np
import pandas as pd

from app.schemas.features import UserPrefFeature, CandidateFeature, TagPreference
from app.services.scoring import score_personal

# 로거 설정
logger = logging.getLogger(__name__)

# ML 모델 로드
# 환경변수로 모델 경로 설정 가능, 없으면 기본 경로 사용
MODEL_PATH_ENV = os.getenv("ML_MODEL_PATH", None)
if MODEL_PATH_ENV:
    MODEL_PATH = Path(MODEL_PATH_ENV)
    MODEL_DIR = MODEL_PATH.parent
else:
    # 도커 컨테이너 내부 경로 우선 시도, 없으면 상대 경로
    docker_model_dir = Path("/app/models")
    local_model_dir = Path(__file__).parent.parent.parent / "models"
    
    if docker_model_dir.exists() and (docker_model_dir / "lgbm_ml_v1.pkl").exists():
        MODEL_DIR = docker_model_dir
    elif local_model_dir.exists():
        MODEL_DIR = local_model_dir
    else:
        MODEL_DIR = docker_model_dir  # 기본값 (에러는 나중에 발생)
    
    MODEL_PATH = MODEL_DIR / "lgbm_ml_v1.pkl"

FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.json"

# 규칙 점수와 ML 점수 결합 가중치 (환경변수로 설정 가능)
# ML_LAMBDA: ML 점수 가중치 (0.15~0.25 권장, 기본 0.2)
# final_score = base_score * (1 - ML_LAMBDA) + ml_prob * ML_LAMBDA
ML_LAMBDA = float(os.getenv("ML_LAMBDA", "0.2"))  # ML 점수 가중치 (기본 0.2)
ML_PROB_CLIP_MIN = float(os.getenv("ML_PROB_CLIP_MIN", "0.05"))  # ml_prob 최소값
ML_PROB_CLIP_MAX = float(os.getenv("ML_PROB_CLIP_MAX", "0.95"))  # ml_prob 최대값

# 전역 모델 변수
_ml_model = None
_ml_feature_cols = None


def load_ml_model():
    """ML 모델 로드 (앱 시작 시 한 번만)"""
    global _ml_model, _ml_feature_cols
    
    if _ml_model is not None:
        return
    
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"ML 모델 파일을 찾을 수 없습니다: {MODEL_PATH}")
    
    try:
        # 피처 이름 로드 (JSON 파일 우선)
        if FEATURE_NAMES_PATH.exists():
            with open(FEATURE_NAMES_PATH, "r", encoding="utf-8") as f:
                feature_names_from_json = json.load(f)
        else:
            feature_names_from_json = None
            logger.warning(f"[ML Scoring] 피처 이름 파일 없음: {FEATURE_NAMES_PATH}")
        
        # 모델 로드 (joblib 사용)
        try:
            import joblib
            model_data = joblib.load(MODEL_PATH)
        except ImportError:
            # joblib이 없으면 pickle 사용
            with open(MODEL_PATH, "rb") as f:
                model_data = pickle.load(f)
        
        _ml_model = model_data["model"]
        _ml_feature_cols = model_data.get("feature_cols")
        
        # JSON 파일이 있으면 우선 사용 (순서 보장)
        if feature_names_from_json:
            _ml_feature_cols = feature_names_from_json
        elif _ml_feature_cols is None:
            raise ValueError("feature_cols를 찾을 수 없습니다")
        
        # 트리 개수 확인
        num_trees = _ml_model.num_trees()
        if num_trees == 0:
            logger.error(f"[ML Scoring] ❌ 트리 개수가 0입니다! 모델이 학습되지 않았습니다.")
            raise ValueError("모델 트리 개수가 0입니다")
        
        # feature_names 해시 계산
        feature_names_str = ",".join(_ml_feature_cols)
        feature_names_hash = hashlib.sha1(feature_names_str.encode()).hexdigest()[:8]
        
        logger.info(f"[ML Scoring] ✅ 모델 로드 완료: {len(_ml_feature_cols)}개 피처, {num_trees}개 트리")
        if num_trees <= 1:
            logger.error(f"[ML Scoring] ⚠️ 경고: 트리 개수가 {num_trees}개입니다. 모델이 제대로 학습되지 않았을 수 있습니다!")
        
        # Warm-up 예측 (지연 완화)
        _warmup_predict()
        
    except Exception as e:
        logger.error(f"[ML Scoring] ❌ 모델 로드 실패: {e}")
        raise


def _warmup_predict():
    """Warm-up 예측 실행 (지연 완화)"""
    global _ml_model, _ml_feature_cols
    
    try:
        # 더미 피처 벡터 생성 (평균값 사용)
        dummy_features = np.zeros((1, len(_ml_feature_cols)))
        best_iter = getattr(_ml_model, 'best_iteration', None)
        if best_iter is not None:
            _ml_model.predict(dummy_features, num_iteration=best_iter)
        else:
            _ml_model.predict(dummy_features)
        logger.info(f"[ML Scoring] Warm-up 예측 완료")
    except Exception as e:
        logger.warning(f"[ML Scoring] Warm-up 예측 실패: {e}")


def extract_features_for_ml(
    user: UserPrefFeature,
    candidate: CandidateFeature,
    rule_score: float
) -> Dict[str, float]:
    """
    ML 모델 입력용 피처 추출
    
    Returns:
        피처 딕셔너리 (feature_cols와 동일한 순서)
    """
    # User features
    user_tag_scores = [tp.score for tp in user.tag_pref.values() if tp.score is not None]
    user_tag_confidences = [tp.confidence for tp in user.tag_pref.values()]
    
    # Restaurant features
    restaurant_tag_weights = [tp.weight for tp in candidate.tag_pref.values() if tp.weight is not None]
    restaurant_tag_confidences = [tp.confidence for tp in candidate.tag_pref.values()]
    
    # 태그 유사도
    tag_sim_dot = 0.0
    tag_sim_cosine = 0.0
    if user.tag_pref and candidate.tag_pref:
        # 내적 유사도
        for tag_id, user_pref in user.tag_pref.items():
            if tag_id in candidate.tag_pref:
                rest_pref = candidate.tag_pref[tag_id]
                tag_sim_dot += user_pref.get_value() * rest_pref.get_value() * user_pref.confidence * rest_pref.confidence
        
        # 코사인 유사도
        common_tags = set(user.tag_pref.keys()) & set(candidate.tag_pref.keys())
        if common_tags:
            dot_product = 0.0
            user_norm = 0.0
            rest_norm = 0.0
            
            for tag_id in common_tags:
                user_val = user.tag_pref[tag_id].get_value() * user.tag_pref[tag_id].confidence
                rest_val = candidate.tag_pref[tag_id].get_value() * candidate.tag_pref[tag_id].confidence
                
                dot_product += user_val * rest_val
                user_norm += user_val * user_val
                rest_norm += rest_val * rest_val
            
            if user_norm > 0.0 and rest_norm > 0.0:
                tag_sim_cosine = dot_product / (np.sqrt(user_norm) * np.sqrt(rest_norm))
    
    # Restaurant tag weight 표준편차
    restaurant_tag_weight_std = np.std(restaurant_tag_weights) if restaurant_tag_weights else 0.0
    
    # 피처 딕셔너리 생성
    features = {
        "user_num_tags": len(user.tag_pref),
        "user_tag_avg_score": np.mean(user_tag_scores) if user_tag_scores else 0.0,
        "user_tag_avg_confidence": np.mean(user_tag_confidences) if user_tag_confidences else 0.0,
        "restaurant_num_tags": len(candidate.tag_pref),
        "restaurant_tag_avg_weight": np.mean(restaurant_tag_weights) if restaurant_tag_weights else 0.0,
        "restaurant_tag_avg_confidence": np.mean(restaurant_tag_confidences) if restaurant_tag_confidences else 0.0,
        "restaurant_tag_weight_std": restaurant_tag_weight_std,
        "tag_similarity_dot": tag_sim_dot,
        "tag_similarity_cosine": tag_sim_cosine,
        "distance_m": candidate.distance_m if candidate.distance_m is not None else 0.0,
        "distance_m_log": np.log1p(candidate.distance_m) if candidate.distance_m is not None else 0.0,
        # pref_score와 engagement_boost는 제외 (action_count_select와 강한 상관관계)
        # action_count_select는 제외 (y와 완벽한 상관관계가 있어서 학습 시 제외됨)
        "has_interaction_recent": 1 if candidate.has_interaction_recent else 0,
        "action_count_save": 0,  # 실시간 예측 시에는 0 (학습 시에는 action log 기반)
        "action_count_share": 0,
        "action_count_view": 0,
        "action_count_total": 0,
    }
    
    # 상수 피처 체크 (DEBUG_FEATURES 환경변수가 true일 때만, 일반적으로는 로깅하지 않음)
    # 필요시 DEBUG_FEATURES=true로 활성화
    
    return features


def score_personal_ml(
    user: UserPrefFeature,
    candidates: List[CandidateFeature],
    debug: bool = False,
) -> List[Tuple[int, float, Optional[dict]]]:
    """
    ML 모델을 사용한 개인 점수 계산 (규칙 점수와 결합)
    
    Returns:
        (restaurant_id, final_score, debug_dict)
    """
    global _ml_model, _ml_feature_cols
    
    total_start = perf_counter()
    
    if _ml_model is None:
        load_ml_model()
    
    num_candidates = len(candidates)
    user_id = user.user_id if hasattr(user, 'user_id') else None
    
    # 1. 규칙 점수 계산
    rule_start = perf_counter()
    rule_results = score_personal(user, candidates, debug=False)
    rule_scores = {rid: score for rid, score, _ in rule_results}
    rule_elapsed = (perf_counter() - rule_start) * 1000
    
    # 2. ML 예측 (벡터화 배치 처리)
    ml_start = perf_counter()
    feature_extract_time = 0.0
    predict_time = 0.0
    
    # 모든 후보의 피처를 한 번에 추출 (DataFrame으로)
    feature_dicts = []
    first_candidate_dumped = False
    first_with_tags_dumped = False
    
    for idx, candidate in enumerate(candidates):
        # 피처 추출
        feat_start = perf_counter()
        features = extract_features_for_ml(user, candidate, rule_scores.get(candidate.restaurant_id, 0.0))
        feature_extract_time += (perf_counter() - feat_start) * 1000
        feature_dicts.append(features)
        
        # 첫 번째 후보와 태그가 있는 첫 번째 후보 확인 (문제가 있을 때만 로깅)
        if idx == 0:
            first_candidate_dumped = True
            if not candidate.tag_pref or len(candidate.tag_pref) == 0:
                logger.debug(f"ML_FEATURE: 첫 번째 후보 태그 없음: restaurant_id={candidate.restaurant_id}")
        
        if candidate.tag_pref and len(candidate.tag_pref) > 0:
            if not first_with_tags_dumped:
                first_with_tags_dumped = True
                # 태그가 있는데 유사도가 0이면 경고
                if features.get('tag_similarity_dot', 0.0) == 0.0 and features.get('tag_similarity_cosine', 0.0) == 0.0:
                    logger.debug(f"ML_FEATURE: 태그 있으나 유사도 0: restaurant_id={candidate.restaurant_id}, tag_count={len(candidate.tag_pref)}")
    
    # DataFrame 생성 및 피처 정렬 강제
    feature_df = pd.DataFrame(feature_dicts)
    
    # 피처 순서 확인 및 재정렬
    extracted_cols = set(feature_df.columns)
    expected_cols = set(_ml_feature_cols)
    missing_cols = expected_cols - extracted_cols
    extra_cols = extracted_cols - expected_cols
    
    if missing_cols:
        logger.error(f"ML_FEATURE_MISSING: {len(missing_cols)}개 피처가 누락되었습니다: {list(missing_cols)}")
    if extra_cols:
        logger.warning(f"ML_FEATURE_EXTRA: {len(extra_cols)}개 피처가 추가되었습니다: {list(extra_cols)[:10]}...")
    
    # 학습 시 사용한 피처 이름 순서로 재정렬 (순서 보장, 누락 컬럼은 0.0으로 채움)
    feature_df = feature_df.reindex(columns=_ml_feature_cols, fill_value=0.0)
    feature_df = feature_df.astype(np.float32)  # float32로 변환 (메모리/성능 최적화)
    
    # 피처 순서 확인 (에러가 있을 때만 로깅)
    if list(feature_df.columns) != list(_ml_feature_cols):
        logger.error(f"ML_FEATURE_ORDER_MISMATCH: 피처 순서가 일치하지 않습니다!")
        logger.error(f"ML_FEATURE_ORDER_MISMATCH: expected={_ml_feature_cols[:5]}..., actual={list(feature_df.columns)[:5]}...")
    
    # 피처 상수 여부 체크 (핵심 피처만 확인)
    feature_stds = feature_df.std().astype(float)
    const_cols = [c for c, v in feature_stds.items() if v == 0.0]
    
    # 후보별로 변해야 하는 핵심 컬럼 확인
    critical_cols = ["distance_m", "distance_m_log", "tag_similarity_dot", 
                    "tag_similarity_cosine", "restaurant_num_tags", "restaurant_tag_avg_weight"]
    critical_const = [c for c in critical_cols if c in const_cols]
    
    if critical_const:
        logger.warning(f"ML_FEATURE_CONST: 핵심 피처가 상수입니다: {critical_const}")
        # 핵심 피처의 실제 값 샘플 확인
        for col in critical_const[:2]:  # 최대 2개만
            sample_values = feature_df[col].head(3).tolist()
            logger.warning(f"ML_FEATURE_CONST: {col} 샘플 값={sample_values}")
    
    # 배치 예측 (벡터화) - DataFrame.values 사용
    pred_start = perf_counter()
    # LightGBM Booster는 predict()를 사용 (binary classification의 경우 확률 반환)
    try:
        # best_iteration이 있으면 사용, 없으면 None (전체 트리 사용)
        best_iter = getattr(_ml_model, 'best_iteration', None)
        if best_iter is not None:
            ml_probs_batch = _ml_model.predict(
                feature_df.values.astype(np.float32),
                num_iteration=best_iter
            )
        else:
            ml_probs_batch = _ml_model.predict(
                feature_df.values.astype(np.float32)
            )
    except Exception as e:
        logger.error(f"ML_PREDICT_ERROR: 예측 실패: {e}")
        # 폴백: 전체 트리 사용
        ml_probs_batch = _ml_model.predict(feature_df.values.astype(np.float32))
    predict_time = (perf_counter() - pred_start) * 1000
    
    # ml_prob 상수 여부 체크 및 검증 (결과 검증)
    ml_probs_std = float(np.std(ml_probs_batch))
    ml_probs_min = float(np.min(ml_probs_batch))
    ml_probs_max = float(np.max(ml_probs_batch))
    ml_probs_mean = float(np.mean(ml_probs_batch))
    
    if ml_probs_std < 1e-4:
        logger.error(f"ML_PROB_CONST: ml_prob 표준편차가 너무 낮습니다: std={ml_probs_std:.2e}, min={ml_probs_min:.6f}, max={ml_probs_max:.6f}, mean={ml_probs_mean:.6f}")
        logger.error(f"ML_PROB_CONST: 피처 순서/누락 확인 필요. feature_cols={len(_ml_feature_cols)}, feature_df.shape={feature_df.shape}")
        logger.error(f"ML_PROB_CONST: feature_df.columns={list(feature_df.columns)[:10]}...")  # 처음 10개만
        # assert 대신 경고만 남김 (서비스 중단 방지)
    else:
        logger.debug(f"ML_PROB_STD: {ml_probs_std:.6f} (OK: std > 1e-4), min={ml_probs_min:.6f}, max={ml_probs_max:.6f}, mean={ml_probs_mean:.6f}")
    
    # ml_prob clip 적용 (승자독식 완화)
    ml_probs_batch_clipped = np.clip(ml_probs_batch, ML_PROB_CLIP_MIN, ML_PROB_CLIP_MAX)
    
    # 딕셔너리로 변환
    ml_scores = {candidate.restaurant_id: float(prob) 
                 for candidate, prob in zip(candidates, ml_probs_batch_clipped)}
    
    ml_elapsed = (perf_counter() - ml_start) * 1000
    
    # 3. 규칙 점수와 ML 점수 결합
    combine_start = perf_counter()
    rule_scores_list = list(rule_scores.values())
    
    results = []
    final_scores = []
    ml_probs = []
    rule_scores_list_for_log = []
    
    for candidate in candidates:
        rid = candidate.restaurant_id
        rule_score = rule_scores.get(rid, 0.0)  # base_score (규칙 점수)
        ml_prob = ml_scores.get(rid, 0.0)  # 이미 clipped된 값
        
        # 결합: final = base_score * (1 - λ) + ml_prob * λ
        # base_score는 이미 정규화된 규칙 점수 (0~1 범위로 정규화 필요)
        # rule_score를 0~1 범위로 정규화
        if rule_scores_list:
            rule_min = min(rule_scores_list)
            rule_max = max(rule_scores_list)
            rule_range = rule_max - rule_min if rule_max > rule_min else 1.0
            base_score_norm = (rule_score - rule_min) / rule_range if rule_range > 0 else 0.0
        else:
            base_score_norm = 0.0
        
        # 최종 점수 계산: base_score * (1 - λ) + ml_prob * λ
        final_score = base_score_norm * (1 - ML_LAMBDA) + ml_prob * ML_LAMBDA
        
        # base_score 최소 가중 보장 (ML이 과도하게 높아도 base_score를 무시하지 않게)
        # base_score_norm이 0.1 이상이면 최소 0.2 가중치 보장
        if base_score_norm >= 0.1:
            min_base_weight = 0.2  # 0.1 → 0.2로 증가
            final_score = max(final_score, base_score_norm * min_base_weight + ml_prob * (1 - min_base_weight))
        
        # ML 점수 상한 제한 (ml_prob가 높아도 final_score가 과도하게 올라가지 않도록)
        # ml_prob가 0.9 이상이면 final_score 상한을 더 엄격하게 제한
        if ml_prob >= 0.9:
            # base_score_norm이 높아도 최대 0.85로 제한 (ml_prob 0.95 + base 1.0이어도)
            max_final_score = min(0.85, base_score_norm * 0.4 + 0.6)  # base 40% + 최대 60%, 상한 0.85
            final_score = min(final_score, max_final_score)
        elif ml_prob >= 0.7:
            # ml_prob가 0.7 이상이면 최대 0.75로 제한
            max_final_score = min(0.75, base_score_norm * 0.5 + 0.5)
            final_score = min(final_score, max_final_score)
        
        final_scores.append(final_score)
        ml_probs.append(ml_prob)
        rule_scores_list_for_log.append(rule_score)
        
        dbg = None
        if debug:
            dbg = {
                "rule_score": round(rule_score, 4),
                "base_score_norm": round(base_score_norm, 4),
                "ml_prob": round(ml_prob, 4),
                "ml_prob_clipped": round(ml_prob, 4),  # 이미 clipped됨
                "lambda": ML_LAMBDA,
                "final_score": round(final_score, 4),
            }
        
        results.append((rid, float(final_score), dbg))
    
    combine_elapsed = (perf_counter() - combine_start) * 1000
    total_elapsed = (perf_counter() - total_start) * 1000
    
    # 통계 계산
    ml_probs_array = np.array(ml_probs)
    final_scores_array = np.array(final_scores)
    rule_scores_array = np.array(rule_scores_list_for_log)
    
    # 상위 8개 점수
    top8_indices = np.argsort(final_scores_array)[-8:][::-1]
    top8_scores = final_scores_array[top8_indices]
    top8_ml_probs = ml_probs_array[top8_indices]
    
    # 성능 경고 (60ms 초과 시만)
    if total_elapsed > 60:
        logger.warning(f"ML_SCORING_SLOW: total_ms={total_elapsed:.2f} > 60ms, num_candidates={num_candidates}")
    
    # ML 점수 분포 문제 경고 (std가 너무 낮으면)
    if ml_probs_std < 1e-4:
        logger.warning(f"ML_PROB_DISTRIBUTION: ml_prob std={ml_probs_std:.6f} (너무 낮음, 승자독식 가능성)")
    
    # 결합 일관성 체크 (에러가 있을 때만)
    log_final_scores = [float(s) for s in final_scores_array]
    response_scores = [float(s) for _, s, _ in results]
    log_final_scores_sorted = sorted(log_final_scores, reverse=True)
    response_scores_sorted = sorted(response_scores, reverse=True)
    
    if not np.allclose(log_final_scores_sorted, response_scores_sorted, rtol=1e-5):
        logger.error(f"ML_SCORING_INCONSISTENT: 로그와 응답 불일치")
        logger.error(f"  로그: {log_final_scores_sorted[:5]}")
        logger.error(f"  응답: {response_scores_sorted[:5]}")
    
    return results

