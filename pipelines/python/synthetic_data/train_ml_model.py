"""
LightGBM 모델 학습 스크립트
목적: objective=binary, metric=auc

입력: train.parquet, valid.parquet
출력: lgbm_ml_v1.pkl

Author: Auto-generated
Date: 2025-01-XX
"""

import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np
import pickle

try:
    import lightgbm as lgb
    from sklearn.metrics import roc_auc_score
    import joblib
except ImportError:
    print("lightgbm과 scikit-learn이 필요합니다. pip install lightgbm scikit-learn")
    sys.exit(1)

# 경로 설정
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
MODEL_DIR = OUTPUT_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

TRAIN_PARQUET = OUTPUT_DIR / "train.parquet"
VALID_PARQUET = OUTPUT_DIR / "valid.parquet"

# 모델 버전 고정 (타임스탬프 포함)
from datetime import datetime
MODEL_VERSION = datetime.now().strftime("%Y%m%d")
MODEL_PATH = MODEL_DIR / f"lgbm_ml_v1_{MODEL_VERSION}.pkl"
# 최신 모델 심볼릭 링크 (FastAPI에서 사용)
MODEL_PATH_LATEST = MODEL_DIR / "lgbm_ml_v1.pkl"

# ==================== 데이터 로드 ====================

print("=" * 60)
print("LightGBM 모델 학습")
print("=" * 60)
print()

print(f"[1] 데이터 로드 중...")
df_train = pd.read_parquet(TRAIN_PARQUET)
df_valid = pd.read_parquet(VALID_PARQUET)

print(f"  - Train: {len(df_train)}개 행")
print(f"  - Valid: {len(df_valid)}개 행")
print()

# ==================== 피처 준비 ====================

print(f"[2] 피처 준비 중...")

# ID 및 라벨 제외
# action_count_select는 y와 직접적인 관계가 있으므로 제외 (y = action_count_select > 0)
# pref_score와 engagement_boost도 action_count_select와 강한 상관관계가 있어 제외
# (pref_score: SELECT가 있으면 최소 +5.0, engagement_boost: SELECT가 있으면 +0.20)
exclude_cols = ["user_id", "restaurant_id", "score", "y", "timestamp", "action_count_select", "pref_score", "engagement_boost"]
feature_cols = [col for col in df_train.columns if col not in exclude_cols]

print(f"  - 피처 수: {len(feature_cols)}")
print(f"  - 피처 목록: {feature_cols[:10]}..." if len(feature_cols) > 10 else f"  - 피처 목록: {feature_cols}")

# Train/Valid 분리
X_train = df_train[feature_cols]
y_train = df_train["y"]
X_valid = df_valid[feature_cols]
y_valid = df_valid["y"]

# 클래스 밸런스 확인
pos_ratio_train = y_train.mean()
pos_ratio_valid = y_valid.mean()
print(f"  - Train Positive 비율: {pos_ratio_train:.2%}")
print(f"  - Valid Positive 비율: {pos_ratio_valid:.2%}")
print(f"  - Train 샘플 수: {len(y_train)} (positive: {y_train.sum()}, negative: {len(y_train) - y_train.sum()})")
print(f"  - Valid 샘플 수: {len(y_valid)} (positive: {y_valid.sum()}, negative: {len(y_valid) - y_valid.sum()})")
print()

# ==================== 모델 학습 ====================

print(f"[3] LightGBM 모델 학습 중...")

# LightGBM 파라미터
params = {
    "objective": "binary",
    "metric": "auc",
    "boosting_type": "gbdt",
    "num_leaves": 64,
    "learning_rate": 0.05,
    "feature_fraction": 0.8,
    "bagging_fraction": 0.8,
    "bagging_freq": 5,
    "verbose": -1,
    "seed": 42,
}

# 클래스 불균형이 심하면 class_weight 사용
if pos_ratio_train < 0.1:
    # 언더샘플링된 경우 class_weight 적용
    pos_weight = (1 - pos_ratio_train) / pos_ratio_train
    params["scale_pos_weight"] = pos_weight
    print(f"  - 클래스 불균형 감지: scale_pos_weight={pos_weight:.2f} 적용")

# 데이터셋 생성 (init_model 사용을 위해 free_raw_data=False 설정)
train_data = lgb.Dataset(X_train, label=y_train, free_raw_data=False)
valid_data = lgb.Dataset(X_valid, label=y_valid, reference=train_data, free_raw_data=False)

# 학습 (검증 세트 필수)
# AUC가 1.0이면 early stopping이 너무 빨리 발생할 수 있으므로 최소 iteration 보장
print(f"  - 학습 시작: num_boost_round=1000, early_stopping=50, min_data_in_leaf=20")
# 최소 데이터 포인트 수를 늘려서 과적합 방지
params["min_data_in_leaf"] = 20
params["min_child_samples"] = 20

# 최소 iteration 수 보장 (AUC가 1.0이어도 최소 100개 트리는 학습)
min_iterations = 100

# 1단계: 최소 iteration까지는 early stopping 없이 학습
print(f"  - 1단계: 최소 {min_iterations}개 트리까지 학습 (early stopping 비활성화)...")
model = lgb.train(
    params,
    train_data,
    num_boost_round=min_iterations,
    valid_sets=[train_data, valid_data],  # eval_set 필수
    valid_names=["train", "valid"],
    callbacks=[
        lgb.log_evaluation(period=10)  # early stopping 없이 로깅만
    ],
    init_model=None,
    keep_training_booster=False
)

# 2단계: 최소 iteration 이후에는 early stopping 활성화하여 추가 학습
print(f"  - 2단계: {min_iterations}개 이후 추가 학습 (early stopping 활성화)...")
model = lgb.train(
    params,
    train_data,
    num_boost_round=1000 - min_iterations,  # 나머지 iteration
    valid_sets=[train_data, valid_data],
    valid_names=["train", "valid"],
    init_model=model,  # 기존 모델에서 이어서 학습
    callbacks=[
        lgb.early_stopping(stopping_rounds=50, verbose=True, first_metric_only=False),
        lgb.log_evaluation(period=10)
    ]
)

# 트리 개수 확인
num_trees = model.num_trees()
best_iteration = model.best_iteration if hasattr(model, 'best_iteration') else None
print(f"  - 학습된 트리 개수: {num_trees}")
if best_iteration is not None:
    print(f"  - Best iteration: {best_iteration}")
if num_trees == 0:
    print(f"  - [ERROR] 트리가 0개입니다! 모델이 학습되지 않았습니다.")
    print(f"  - 파라미터나 데이터 분할을 재검토하세요.")
    sys.exit(1)
elif num_trees <= 1:
    print(f"  - [WARNING] 트리가 {num_trees}개뿐입니다! 모델이 제대로 학습되지 않았을 수 있습니다.")
    print(f"  - 데이터를 확인하거나 early_stopping_rounds를 늘려보세요.")

print()

# ==================== 검증 ====================

print(f"[4] 모델 검증 중...")

# 예측
y_train_pred = model.predict(X_train, num_iteration=model.best_iteration)
y_valid_pred = model.predict(X_valid, num_iteration=model.best_iteration)

# AUC 계산
train_auc = roc_auc_score(y_train, y_train_pred)
valid_auc = roc_auc_score(y_valid, y_valid_pred)

print(f"  - Train AUC: {train_auc:.4f}")
print(f"  - Valid AUC: {valid_auc:.4f}")

if valid_auc < 0.70:
    print(f"  - [WARN] Valid AUC가 0.70 미만입니다. 모델 개선 필요")
else:
    print(f"  - [OK] Valid AUC ≥ 0.70 달성")
print()

# ==================== 모델 저장 ====================

print(f"[5] 모델 저장 중...")

# 피처 이름 저장 (JSON)
FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.json"
with open(FEATURE_NAMES_PATH, "w", encoding="utf-8") as f:
    json.dump(feature_cols, f, ensure_ascii=False, indent=2)
print(f"  - 피처 이름 저장: {FEATURE_NAMES_PATH}")

# 모델 저장 (joblib 사용)
model_data = {
    "model": model,
    "feature_cols": feature_cols,
    "train_auc": train_auc,
    "valid_auc": valid_auc,
    "params": params,
    "num_trees": num_trees,
}
joblib.dump(model_data, MODEL_PATH)

print(f"  - 모델 저장 완료: {MODEL_PATH}")
print(f"  - 버전: {MODEL_VERSION}")
print(f"  - 트리 개수: {num_trees}")
print(f"NUM_TREES: {num_trees}")  # 성능 검증용 출력

# 최신 모델 심볼릭 링크 생성 (Windows에서는 복사)
import shutil
try:
    if MODEL_PATH_LATEST.exists():
        MODEL_PATH_LATEST.unlink()
    shutil.copy2(MODEL_PATH, MODEL_PATH_LATEST)
    print(f"  - 최신 모델 링크 생성: {MODEL_PATH_LATEST}")
except Exception as e:
    print(f"  - [WARN] 심볼릭 링크 생성 실패: {e}")

print()

# ==================== 피처 중요도 ====================

print(f"[6] 피처 중요도 (상위 10개):")
feature_importance = pd.DataFrame({
    "feature": feature_cols,
    "importance": model.feature_importance(importance_type="gain")
}).sort_values("importance", ascending=False)

for idx, row in feature_importance.head(10).iterrows():
    print(f"  - {row['feature']}: {row['importance']:.2f}")

print()
print("=" * 60)
print("모델 학습 완료!")
print(f"모델 경로: {MODEL_PATH}")
print()
print("다음 단계:")
print("1. FastAPI로 모델 복사: python copy_model_to_fastapi.py")
print("2. 또는 환경변수 ML_MODEL_PATH로 모델 경로 지정")
print("=" * 60)

