# 로깅 가이드

## 로그 확인 방법

### 1. 콘솔 로그
서버 실행 시 콘솔에 구조화된 로그가 출력됩니다.

### 2. 파일 로그 (선택사항)
환경변수로 로그 파일 경로 지정:
```bash
export LOG_FILE=/path/to/logs/fastapi.log
export LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

## 로그 형식

### ML 스코어링 로그
```
INFO: ML_SCORING: {
  "event": "ml_scoring_complete",
  "user_id": 1,
  "num_candidates": 200,
  "performance": {
    "total_ms": 45.23,
    "rule_scoring_ms": 12.34,
    "ml_prediction_ms": 28.45,
    "feature_extract_ms": 15.67,
    "predict_ms": 12.78,
    "combine_ms": 4.44,
    "avg_per_candidate_ms": 0.14
  },
  "statistics": {
    "rule_score": {"min": 0.1, "max": 0.9, "mean": 0.5, "std": 0.2},
    "ml_prob": {"min": 0.0, "max": 0.95, "mean": 0.45, "std": 0.25},
    "final_score": {"min": 0.15, "max": 0.92, "mean": 0.48, "std": 0.22}
  },
  "top8": {
    "scores": [0.92, 0.89, 0.85, 0.82, 0.78, 0.75, 0.72, 0.68],
    "ml_probs": [0.95, 0.88, 0.82, 0.79, 0.75, 0.71, 0.68, 0.64]
  },
  "config": {"alpha": 0.7}
}
```

### API 레벨 로그
```
INFO: API_SCORE: {
  "event": "api_score_personal",
  "user_id": 1,
  "algo": "ml_v1",
  "num_candidates": 200,
  "elapsed_ms": 45,
  "top5_scores": [0.92, 0.89, 0.85, 0.82, 0.78]
}
```

### 성능 경고
```
WARNING: ML_SCORING_SLOW: total_ms=65.23 > 50ms, num_candidates=200
WARNING: API_SCORE_SLOW: elapsed_ms=120 > 100ms, algo=ml_v1, num_candidates=200
```

## 로그 분석

### 성능 분석
```bash
# 총 소요 시간 확인
grep "ML_SCORING" logs/fastapi.log | jq '.performance.total_ms'

# 후보 수별 평균 처리 시간
grep "ML_SCORING" logs/fastapi.log | jq '.performance.avg_per_candidate_ms'

# 느린 요청 찾기
grep "ML_SCORING_SLOW" logs/fastapi.log
```

### 정확도 분석
```bash
# ML 예측 확률 분포
grep "ML_SCORING" logs/fastapi.log | jq '.statistics.ml_prob'

# 최종 점수 분포
grep "ML_SCORING" logs/fastapi.log | jq '.statistics.final_score'

# 상위 8개 점수 추이
grep "ML_SCORING" logs/fastapi.log | jq '.top8.scores'
```

### 통계 집계
```bash
# 평균 처리 시간 계산
grep "ML_SCORING" logs/fastapi.log | jq -s 'map(.performance.total_ms) | add / length'

# p95 레이턴시 계산
grep "ML_SCORING" logs/fastapi.log | jq -s 'map(.performance.total_ms) | sort | .[length * 0.95 | floor]'

# ML 예측 확률 평균
grep "ML_SCORING" logs/fastapi.log | jq -s 'map(.statistics.ml_prob.mean) | add / length'
```

## Prometheus 메트릭

`/metrics` 엔드포인트에서 Prometheus 메트릭 확인:
- `http_request_duration_seconds`: 요청 처리 시간
- `http_requests_total`: 총 요청 수

## 로그 레벨

- `DEBUG`: 상세 디버그 정보 (피처 값 등)
- `INFO`: 일반 정보 (성능, 통계)
- `WARNING`: 성능 경고 (느린 요청)
- `ERROR`: 에러 발생

