# ML 모델 통합 최종 마감 체크리스트

## ✅ 완료 사항

### 1. 서버 기동 & 모델 로드 확인
- ✅ 환경변수: `ML_MODEL_PATH`, `ML_ALPHA=0.7` 지원
- ✅ 기동 로그에 `lgbm_ml_v1.pkl loaded` 확인 메시지 추가
- ✅ 로드 실패 시 규칙 엔진으로 폴백 처리 완료

### 2. 엔드포인트 연동 확인
- ✅ `POST /score/personal?algo=cbf_v1.2` → 기존 점수 반환
- ✅ `POST /score/personal?algo=ml_v1` → 결합 점수 반환
- ✅ 응답에 `algo_version` 포함

### 3. Java 백엔드 연동
- ✅ 개인 피드 (`getPersonalFeed`, `getFeedBatch`)에서 `algo=ml_v1` 사용
- ✅ 약속 생성은 그룹 점수 사용 (개인 점수 아님)

### 4. 입력→피처 매핑 일치
- ✅ 학습 스키마와 `extract_features_for_ml()` 생성 로직 동일
- ✅ 열 순서/스케일/결측 처리 일치

### 5. 모델 버전 고정
- ✅ 파일명: `lgbm_ml_v1_YYYYMMDD.pkl` (타임스탬프 포함)
- ✅ 최신 모델 링크: `lgbm_ml_v1.pkl` (자동 생성)
- ✅ FastAPI 설정에 경로만 바꿔 교체 배포 가능

### 6. 스모크 테스트
- ✅ `fastapi-score/tests/test_ml_smoke.py` 작성
- ✅ 동일 요청으로 `algo=cbf_v1.2` vs `algo=ml_v1` 비교

## 📋 확인 필요 사항

### 1. 성능 확인 (최소)
- [ ] p95 레이턴시(ML 모드) 50ms 내외인지 확인 (로컬 기준)
- [ ] 배치 예측이 아닌 후보 N개(예: 200개) 벡터화 예측 사용

### 2. 데이터/모델 아티팩트 보관
- [ ] `dataset_v1.parquet`, `train/valid.parquet`, `lgbm_ml_v1.pkl` S3(or NAS)에 보관
- [ ] 추후 재현/재학습 대비

### 3. 롤백 경로
- ✅ 트래픽 이슈 시 즉시 `algo=cbf_v1.2`로 호출 가능
- ✅ 서버 기본값을 `cbf_v1.2`로 유지 (ML 비활성화 시에도 서비스 정상 동작)

## 🧪 테스트 방법

### 1. 모델 학습
```bash
cd pipelines/python/synthetic_data
python generate_ml_dataset.py
python train_ml_model.py
python copy_model_to_fastapi.py
```

### 2. FastAPI 서버 기동
```bash
cd fastapi-score
# 환경변수 설정 (선택)
export ML_MODEL_PATH=/path/to/lgbm_ml_v1.pkl
export ML_ALPHA=0.7

uvicorn main:app --reload
```

### 3. 스모크 테스트 실행
```bash
cd fastapi-score
python tests/test_ml_smoke.py
```

### 4. Java 백엔드 확인
- 개인 피드 API 호출 시 `algo=ml_v1` 사용 확인
- 약속 생성은 그룹 점수 사용 (변경 없음)

## 📝 환경변수 설정

### FastAPI 서버
- `ML_MODEL_PATH`: ML 모델 파일 경로 (기본: `fastapi-score/models/lgbm_ml_v1.pkl`)
- `ML_ALPHA`: 규칙 점수 가중치 (기본: 0.7)

### Java 백엔드
- `score.api.base`: FastAPI 서버 URL (기본: `http://localhost:8000`)

## 🔄 롤백 방법

### 즉시 롤백 (Java 코드 변경 없이)
1. FastAPI 서버에서 `ML_MODEL_PATH` 환경변수 제거 또는 잘못된 경로 설정
2. 서버 재시작 → 규칙 엔진으로 자동 폴백

### 코드 롤백
1. `MainQueryServiceImpl.java`에서 `score(req, "ml_v1")` → `score(req, "cbf_v1.2")` 변경
2. 재배포

## 📊 모니터링

### 로그 확인
- FastAPI 서버 기동 시: `[ML Scoring] ✅ lgbm_ml_v1.pkl loaded`
- API 응답: `algo_version` 필드 확인
- 성능: `elapsed_ms` 필드 확인

### 메트릭
- `/metrics` 엔드포인트에서 Prometheus 메트릭 확인
- 레이턴시 분포 모니터링

