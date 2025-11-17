"""
ML 모델 스모크 테스트
동일 요청으로 algo=cbf_v1.2 vs algo=ml_v1 비교

Author: Auto-generated
Date: 2025-01-XX
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_ml_smoke():
    """스모크 테스트: cbf_v1.2 vs ml_v1 비교"""
    
    # 샘플 요청 데이터
    sample_request = {
        "user": {
            "user_id": 1,
            "tag_pref": {
                10: {"score": 0.8, "confidence": 0.9},
                20: {"score": 0.7, "confidence": 0.8},
                30: {"score": 0.6, "confidence": 0.7}
            }
        },
        "candidates": [
            {
                "restaurant_id": 1001,
                "distance_m": 420.0,
                "tag_pref": {
                    10: {"weight": 0.9, "confidence": 0.8},
                    20: {"weight": 0.7, "confidence": 0.6}
                },
                "pref_score": 0.7,
                "has_interaction_recent": True,
                "engagement_boost": 0.2
            },
            {
                "restaurant_id": 1002,
                "distance_m": 800.0,
                "tag_pref": {
                    10: {"weight": 0.5, "confidence": 0.7},
                    30: {"weight": 0.8, "confidence": 0.9}
                },
                "pref_score": None,
                "has_interaction_recent": False,
                "engagement_boost": None
            }
        ],
        "debug": True
    }
    
    print("=" * 60)
    print("ML 스모크 테스트")
    print("=" * 60)
    print()
    
    # 1. 규칙 엔진 테스트
    print("[1] 규칙 엔진 (cbf_v1.2) 테스트...")
    try:
        response_cbf = requests.post(
            f"{BASE_URL}/score/personal?algo=cbf_v1.2",
            json=sample_request,
            timeout=5
        )
        response_cbf.raise_for_status()
        result_cbf = response_cbf.json()
        
        print(f"  ✅ 응답 성공")
        print(f"  - algo_version: {result_cbf.get('algo_version')}")
        print(f"  - elapsed_ms: {result_cbf.get('elapsed_ms')}ms")
        print(f"  - 상위 8개 점수:")
        for i, score_item in enumerate(result_cbf.get('scores', [])[:8], 1):
            print(f"    {i}. restaurant_id={score_item['restaurant_id']}, score={score_item['score']:.4f}")
    except Exception as e:
        print(f"  ❌ 실패: {e}")
        return
    
    print()
    
    # 2. ML 결합 테스트
    print("[2] ML 결합 (ml_v1) 테스트...")
    try:
        response_ml = requests.post(
            f"{BASE_URL}/score/personal?algo=ml_v1",
            json=sample_request,
            timeout=5
        )
        response_ml.raise_for_status()
        result_ml = response_ml.json()
        
        print(f"  ✅ 응답 성공")
        print(f"  - algo_version: {result_ml.get('algo_version')}")
        print(f"  - elapsed_ms: {result_ml.get('elapsed_ms')}ms")
        print(f"  - 상위 8개 점수:")
        for i, score_item in enumerate(result_ml.get('scores', [])[:8], 1):
            print(f"    {i}. restaurant_id={score_item['restaurant_id']}, score={score_item['score']:.4f}")
    except Exception as e:
        print(f"  ❌ 실패: {e}")
        return
    
    print()
    
    # 3. 비교 분석
    print("[3] 비교 분석...")
    scores_cbf = {item['restaurant_id']: item['score'] for item in result_cbf.get('scores', [])}
    scores_ml = {item['restaurant_id']: item['score'] for item in result_ml.get('scores', [])}
    
    print(f"  - 규칙 엔진 상위 8개: {list(scores_cbf.keys())[:8]}")
    print(f"  - ML 결합 상위 8개: {list(scores_ml.keys())[:8]}")
    
    # 랭킹 변화 확인
    top8_cbf = list(scores_cbf.keys())[:8]
    top8_ml = list(scores_ml.keys())[:8]
    
    common = set(top8_cbf) & set(top8_ml)
    print(f"  - 공통 식당: {len(common)}개")
    
    if len(common) > 0:
        print(f"  - ✅ 합리적인 변화: 일부 식당이 상승/하강")
    else:
        print(f"  - ⚠️  주의: 랭킹이 완전히 다릅니다")
    
    # 성능 확인
    elapsed_ml = result_ml.get('elapsed_ms', 0)
    if elapsed_ml < 50:
        print(f"  - ✅ 성능 OK: {elapsed_ml}ms < 50ms")
    else:
        print(f"  - ⚠️  성능 주의: {elapsed_ml}ms >= 50ms")
    
    print()
    print("=" * 60)
    print("스모크 테스트 완료!")
    print("=" * 60)

if __name__ == "__main__":
    test_ml_smoke()

