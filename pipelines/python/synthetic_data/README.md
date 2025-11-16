# Synthetic ML Training Dataset Generator

추천 로직에 맞춰서 학습 데이터셋을 인공적으로 생성하는 파이프라인입니다.

## 파이프라인 구조

1. **Synthetic User 생성** → `UserPrefFeature` 형태
   - 각 user는 랜덤한 tag preference를 가짐
   - tag_id, score(-3.0~3.0), confidence(0.2~0.95)

2. **Restaurant 데이터 생성/로드**
   - **옵션 1**: DB에서 `restaurant_tag` 테이블 직접 로드
   - **옵션 2**: CSV 파일에서 `restaurant_tag` 데이터 로드
   - **옵션 3**: Synthetic 생성 (각 restaurant는 랜덤한 tag weight를 가짐)
   - 각 식당이 가진 tag (weight, confidence)를 의미함

3. **User × Restaurant Pair 생성**
   - 각 user당 N개의 restaurant와 pair 생성

4. **Synthetic Action Log 생성**
   - SAVE, SHARE, SELECT, VIEW 액션 생성
   - 최근 30일 내 랜덤한 timestamp

5. **ML 학습 데이터셋 생성**
   - 실제 추천 로직(`score_personal`)을 사용하여 점수 계산
   - 계산된 점수를 ground truth로 사용
   - Feature 추출 및 CSV 저장

## 사용 방법

### 1. 가상환경 설정 (권장)

```bash
cd pipelines/python/synthetic_data
chmod +x setup_env.sh
./setup_env.sh
```

**수동 설정:**
```bash
cd pipelines/python/synthetic_data
python -m venv venv
source venv/bin/activate  # Git Bash에서도 동일
pip install pandas numpy pydantic
```

### 2. 스크립트 실행

```bash
# 가상환경 활성화 후
source venv/bin/activate
python generate_ml_dataset.py
```

## 설정

`generate_ml_dataset.py` 파일 상단의 설정 변수를 수정하여 데이터 생성 규모를 조정할 수 있습니다:

```python
NUM_SYNTHETIC_USERS = 1000      # 생성할 synthetic user 수
NUM_RESTAURANTS = 500            # 사용할 식당 수
NUM_PAIRS_PER_USER = 50          # 각 user당 생성할 pair 수
NUM_ACTION_LOGS_PER_USER = 200   # 각 user당 생성할 action log 수

# Restaurant 데이터 소스 설정
USE_DB = False                   # True: DB에서 직접 로드
RESTAURANT_TAG_CSV = None        # CSV 파일 경로 (예: "restaurant_tag.csv")
                                 # 둘 다 False/None이면 synthetic 생성
```

### Restaurant 데이터 소스 선택

**옵션 1: DB에서 직접 로드**
```python
USE_DB = True
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "your_database",
    "user": "your_user",
    "password": "your_password"
}
```

**옵션 2: CSV 파일에서 로드**
```python
USE_DB = False
RESTAURANT_TAG_CSV = "data/restaurant_tag.csv"  # CSV 파일 경로
```

**CSV 파일 위치**: `pipelines/python/synthetic_data/data/restaurant_tag.csv`

**CSV 형식**:
```csv
restaurant_id,tag_id,weight,confidence
1,10,2.5,0.8
1,20,1.5,0.7
2,10,3.0,0.9
...
```

**옵션 3: Synthetic 생성**
```python
USE_DB = False
RESTAURANT_TAG_CSV = None
```

## 데이터 구조 설명

- **Restaurant 데이터**: 각 식당이 가진 tag (Restaurant_tag 테이블의 weight, confidence)
  - 이미 크롤링/DB에 있는 데이터를 사용할 수 있음
  - 코드에서 실제 데이터를 로드하거나 synthetic으로 생성

- **pref_score**: 유저가 특정 식당에 대해 가진 개인 선호 점수
  - User-Restaurant pair별로 action log 기반으로 계산됨
  - SAVE, SELECT 액션에 따라 증가

## 출력 파일

모든 출력 파일은 `output/` 디렉토리에 저장됩니다:

- `synthetic_users.jsonl`: Synthetic user 데이터
- `restaurants.jsonl`: Restaurant 데이터
- `user_restaurant_pairs.jsonl`: User-Restaurant pair 데이터
- `synthetic_action_logs.jsonl`: Action log 데이터
- `ml_training_dataset.csv`: 최종 ML 학습 데이터셋

## 학습 데이터셋 컬럼

### 라벨
- `score`: 룰 엔진 점수 (soft label for distillation)
- `y`: 이진 라벨 (SELECT>0 또는 pref_score≥5 → 1, 그 외 → 0)

### User Features
- `user_num_tags`, `user_tag_avg_score`, `user_tag_avg_confidence`

### Restaurant Features
- `restaurant_num_tags`, `restaurant_tag_avg_weight`, `restaurant_tag_avg_confidence`
- `restaurant_tag_weight_std`: 태그 weight 표준편차 (분산 확보)

### 태그 유사도
- `tag_similarity_dot`: 사용자-식당 태그 내적 유사도
- `tag_similarity_cosine`: 사용자-식당 태그 코사인 유사도

### Interaction Features
- `distance_m`: 거리 (미터)
- `distance_m_log`: 거리 로그 스케일 (log1p)
- `pref_score`: 개인 선호 점수 (NaN → 0.0)
- `has_interaction_recent`: 최근 상호작용 여부 (0/1)
- `engagement_boost`: 행동 부스트 (NaN → 0.0)

### Action Log Counts
- `action_count_save/share/select/view/total`

## 데이터셋 분할

- **Train/Val/Test**: 시간 기준 70% / 15% / 15% 분할
- **사용자 누수 방지**: 같은 user_id가 여러 세트에 섞이지 않도록 확인
- **출력 파일**:
  - `ml_training_dataset.csv`: 전체 데이터셋
  - `ml_training_dataset_train.csv`: 학습용
  - `ml_training_dataset_val.csv`: 검증용
  - `ml_training_dataset_test.csv`: 테스트용

## 데이터 품질 점검

- ✅ 중복 제거: (user_id, restaurant_id) 중복 시 최근 데이터만 유지
- ✅ 누락 처리: pref_score, engagement_boost의 NaN → 0.0
- ✅ 타입 정리: has_interaction_recent → 0/1
- ✅ 클래스 밸런스 확인: Positive 비율 5%~40% 권장

## 의존성

- pandas
- numpy
- fastapi-score의 schemas 및 services (상대 경로로 import)

