"""
모델 파일을 FastAPI 프로젝트로 복사하는 스크립트

Author: Auto-generated
Date: 2025-01-XX
"""

from pathlib import Path
import shutil

# 경로 설정
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
MODEL_DIR = OUTPUT_DIR / "models"
MODEL_FILE = MODEL_DIR / "lgbm_ml_v1.pkl"
FEATURE_NAMES_FILE = MODEL_DIR / "feature_names.json"

# FastAPI 프로젝트 경로
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
FASTAPI_MODEL_DIR = PROJECT_ROOT / "fastapi-score" / "models"
FASTAPI_MODEL_DIR.mkdir(exist_ok=True)
FASTAPI_MODEL_PATH = FASTAPI_MODEL_DIR / "lgbm_ml_v1.pkl"
FASTAPI_FEATURE_NAMES_PATH = FASTAPI_MODEL_DIR / "feature_names.json"

# 모델 파일 복사
if MODEL_FILE.exists():
    shutil.copy2(MODEL_FILE, FASTAPI_MODEL_PATH)
    print(f"[OK] 모델 파일 복사 완료")
    print(f"  - 원본: {MODEL_FILE}")
    print(f"  - 대상: {FASTAPI_MODEL_PATH}")
else:
    print(f"[ERROR] 모델 파일을 찾을 수 없습니다: {MODEL_FILE}")
    print(f"  - 먼저 train_ml_model.py를 실행하여 모델을 학습하세요.")
    exit(1)

# 피처 이름 파일 복사
if FEATURE_NAMES_FILE.exists():
    shutil.copy2(FEATURE_NAMES_FILE, FASTAPI_FEATURE_NAMES_PATH)
    print(f"[OK] 피처 이름 파일 복사 완료")
    print(f"  - 원본: {FEATURE_NAMES_FILE}")
    print(f"  - 대상: {FASTAPI_FEATURE_NAMES_PATH}")
else:
    print(f"[WARN] 피처 이름 파일을 찾을 수 없습니다: {FEATURE_NAMES_FILE}")
    print(f"  - train_ml_model.py를 다시 실행하여 feature_names.json을 생성하세요.")

