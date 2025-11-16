"""
Synthetic ML Training Dataset Generator
추천 로직에 맞춰서 학습 데이터셋을 인공적으로 생성

파이프라인:
1. Synthetic User 생성 (UserPrefFeature)
2. User × Restaurant Pair 생성
3. Synthetic Action Log 생성
4. ML 학습 데이터셋 생성 (실제 추천 로직 사용)

Author: Auto-generated
Date: 2025-01-XX
"""

import sys
import os
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import random
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import math

# Python 버전 확인 및 호환 스키마 사용
if sys.version_info < (3, 10):
    # Python 3.9 이하: 호환 스키마 사용
    from schemas_compat import UserPrefFeature, CandidateFeature, TagPreference
    from scoring_compat import score_personal
else:
    # Python 3.10 이상: 원본 스키마 사용
    project_root = Path(__file__).parent.parent.parent.parent
    fastapi_score_path = project_root / "fastapi-score"
    sys.path.insert(0, str(fastapi_score_path))
    from app.schemas.features import UserPrefFeature, CandidateFeature, TagPreference
    from app.services.scoring import score_personal

# ==================== 설정 ====================
NUM_SYNTHETIC_USERS = 1000  # 생성할 synthetic user 수
NUM_RESTAURANTS = 500  # 사용할 식당 수 (실제 데이터가 있으면 그걸 사용)
NUM_PAIRS_PER_USER = 50  # 각 user당 생성할 user-restaurant pair 수
NUM_ACTION_LOGS_PER_USER = 200  # 각 user당 생성할 action log 수

# Restaurant 데이터 소스 설정
# 옵션 1: DB에서 직접 로드 (USE_DB=True)
# 옵션 2: CSV 파일에서 로드 (USE_DB=False, RESTAURANT_TAG_CSV 경로 지정)
# 옵션 3: Synthetic 생성 (USE_DB=False, RESTAURANT_TAG_CSV=None)
USE_DB = False  # DB에서 로드할지 여부
RESTAURANT_TAG_CSV = "data/restaurant_tag.csv"  # CSV 파일 경로 (상대 경로 또는 절대 경로)
RESTAURANT_CSV = "data/restaurant.csv"  # Restaurant 정보 CSV 파일 경로
                                                # None이면 synthetic 생성

# 기준 위치 (테헤란로 212)
BASE_LOCATION = {
    "lat": 37.5012767241426,
    "lng": 127.039600248343
}

# DB 연결 설정 (USE_DB=True일 때 사용)
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "your_database",
    "user": "your_user",
    "password": "your_password"
}

# Tag ID 범위 (실제 tag 데이터가 있으면 그걸 사용)
TAG_ID_MIN = 1
TAG_ID_MAX = 100
NUM_TAGS_PER_USER = 15  # 각 user가 가질 tag 수
NUM_TAGS_PER_RESTAURANT = 10  # 각 restaurant가 가질 tag 수 (synthetic 생성 시에만 사용)

# Action Log 타입 및 가중치
ACTION_TYPES = ["SAVE", "SHARE", "SELECT", "VIEW"]
ACTION_WEIGHTS = {
    "SAVE": 0.15,
    "SHARE": 0.10,
    "SELECT": 0.20,
    "VIEW": 0.03,  # 첫 1회만
}

# 출력 파일
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
OUTPUT_SYNTHETIC_USERS = OUTPUT_DIR / "synthetic_users.jsonl"
OUTPUT_RESTAURANTS = OUTPUT_DIR / "restaurants.jsonl"
OUTPUT_PAIRS = OUTPUT_DIR / "user_restaurant_pairs.jsonl"
OUTPUT_ACTION_LOGS = OUTPUT_DIR / "synthetic_action_logs.jsonl"
OUTPUT_TRAINING_DATASET = OUTPUT_DIR / "ml_training_dataset.csv"

# ==================== 유틸 함수 ====================

def generate_tag_pref(
    num_tags: int,
    tag_id_min: int,
    tag_id_max: int,
    score_range: Tuple[float, float] = (-3.0, 3.0),
    weight_range: Tuple[float, float] = (0.0, 3.0),
    use_score: bool = True,
) -> Dict[int, TagPreference]:
    """
    Tag preference 딕셔너리 생성
    
    Args:
        num_tags: 생성할 tag 수
        tag_id_min: 최소 tag_id
        tag_id_max: 최대 tag_id
        score_range: score 범위 (user용)
        weight_range: weight 범위 (restaurant용)
        use_score: True면 score 사용, False면 weight 사용
    """
    tag_ids = random.sample(range(tag_id_min, tag_id_max + 1), min(num_tags, tag_id_max - tag_id_min + 1))
    tag_pref = {}
    
    for tag_id in tag_ids:
        if use_score:
            score = round(random.uniform(*score_range), 2)
            weight = None
        else:
            score = None
            weight = round(random.uniform(*weight_range), 2)
        
        confidence = round(random.uniform(0.2, 0.95), 2)
        tag_pref[tag_id] = TagPreference(
            score=score,
            weight=weight,
            confidence=confidence
        )
    
    return tag_pref


def generate_synthetic_user(user_id: int) -> UserPrefFeature:
    """Synthetic User 생성"""
    tag_pref = generate_tag_pref(
        num_tags=NUM_TAGS_PER_USER,
        tag_id_min=TAG_ID_MIN,
        tag_id_max=TAG_ID_MAX,
        use_score=True
    )
    
    return UserPrefFeature(
        user_id=user_id,
        tag_pref=tag_pref
    )


def load_restaurant_tags_from_db(restaurant_ids: List[int]) -> Dict[int, Dict[int, TagPreference]]:
    """
    DB에서 restaurant_tag 데이터 로드
    
    Returns:
        {restaurant_id: {tag_id: TagPreference}}
    """
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ImportError:
        raise ImportError("psycopg2가 필요합니다. pip install psycopg2-binary")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # restaurant_tag 테이블에서 데이터 로드
    query = """
        SELECT restaurant_id, tag_id, weight, confidence
        FROM restaurant_tag
        WHERE restaurant_id = ANY(%s)
    """
    cursor.execute(query, (restaurant_ids,))
    rows = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    # 결과를 딕셔너리로 변환
    result = {}
    for row in rows:
        rid = row['restaurant_id']
        tag_id = row['tag_id']
        if rid not in result:
            result[rid] = {}
        result[rid][tag_id] = TagPreference(
            score=None,
            weight=float(row['weight']),
            confidence=float(row['confidence'])
        )
    
    return result


def load_restaurant_tags_from_csv(csv_path: str) -> Dict[int, Dict[int, TagPreference]]:
    """
    CSV 파일에서 restaurant_tag 데이터 로드
    
    CSV 형식: restaurant_id, tag_id, weight, confidence
    
    Returns:
        {restaurant_id: {tag_id: TagPreference}}
    """
    df = pd.read_csv(csv_path)
    
    result = {}
    for _, row in df.iterrows():
        rid = int(row['restaurant_id'])
        tag_id = int(row['tag_id'])
        if rid not in result:
            result[rid] = {}
        result[rid][tag_id] = TagPreference(
            score=None,
            weight=float(row['weight']),
            confidence=float(row['confidence'])
        )
    
    return result


def parse_point_geom(geom_str: str) -> Optional[Tuple[float, float]]:
    """
    POINT (경도 위도) 형식의 문자열을 파싱하여 (lng, lat) 튜플 반환
    
    예: "POINT (127.0416528 37.50347844)" -> (127.0416528, 37.50347844)
    """
    if pd.isna(geom_str) or not geom_str or not isinstance(geom_str, str):
        return None
    
    try:
        # POINT (lng lat) 형식 파싱
        import re
        match = re.search(r'POINT\s*\(([\d.]+)\s+([\d.]+)\)', geom_str)
        if match:
            lng = float(match.group(1))
            lat = float(match.group(2))
            return (lng, lat)
    except Exception:
        pass
    
    return None


def calculate_distance_haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    하버사인 공식을 사용하여 두 지점 간의 거리 계산 (미터 단위)
    
    Args:
        lat1, lng1: 첫 번째 지점의 위도, 경도
        lat2, lng2: 두 번째 지점의 위도, 경도
    
    Returns:
        거리 (미터)
    """
    # 지구 반지름 (미터)
    R = 6371000.0
    
    # 라디안 변환
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    
    # 하버사인 공식
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return round(distance, 2)


def load_restaurants_from_csv(csv_path: str) -> Dict[int, Dict]:
    """
    CSV 파일에서 restaurant 데이터 로드
    
    Returns:
        {restaurant_id: {restaurant_id, price_range, category1, category2, category3, lat, lng, ...}}
    """
    df = pd.read_csv(csv_path)
    
    result = {}
    for _, row in df.iterrows():
        rid = int(row['restaurant_id'])
        
        # geom 파싱
        geom_str = row.get('geom', None)
        coords = parse_point_geom(geom_str) if geom_str else None
        
        restaurant_info = {
            "restaurant_id": rid,
            "price_range": row.get('price_range', None),
            "category1": row.get('category1', None),
            "category2": row.get('category2', None),
            "category3": row.get('category3', None),
        }
        
        # 좌표 정보 추가
        if coords:
            restaurant_info["lng"] = coords[0]
            restaurant_info["lat"] = coords[1]
        
        result[rid] = restaurant_info
    
    return result


def generate_restaurant(
    restaurant_id: int, 
    tag_pref: Dict[int, TagPreference] = None,
    restaurant_info: Dict = None,
    base_lat: float = 37.4979, 
    base_lng: float = 127.0276
) -> Dict:
    """
    Restaurant 데이터 생성
    
    Args:
        restaurant_id: 식당 ID
        tag_pref: 실제 tag preference 데이터 (None이면 synthetic 생성)
        restaurant_info: 실제 restaurant 정보 (None이면 synthetic 생성)
    """
    if tag_pref is None:
        # Synthetic 생성
        tag_pref = generate_tag_pref(
            num_tags=NUM_TAGS_PER_RESTAURANT,
            tag_id_min=TAG_ID_MIN,
            tag_id_max=TAG_ID_MAX,
            use_score=False  # restaurant는 weight 사용
        )
    
    # 거리 계산: 실제 좌표가 있으면 기준 위치와의 거리 계산, 없으면 랜덤 생성
    if restaurant_info and "lat" in restaurant_info and "lng" in restaurant_info:
        # 실제 좌표 기반 거리 계산
        rest_lat = restaurant_info["lat"]
        rest_lng = restaurant_info["lng"]
        distance_m = calculate_distance_haversine(
            BASE_LOCATION["lat"], BASE_LOCATION["lng"],
            rest_lat, rest_lng
        )
    else:
        # 좌표 정보가 없으면 랜덤 생성 (0~5000m 범위)
        distance_m = round(random.uniform(0, 5000), 2)
    
    # 실제 데이터가 있으면 사용, 없으면 synthetic 생성
    if restaurant_info:
        price_range = restaurant_info.get("price_range")
        category1 = restaurant_info.get("category1")
        category2 = restaurant_info.get("category2")
        category3 = restaurant_info.get("category3")
        # category2를 주요 카테고리로 사용 (없으면 category1)
        category = category2 if category2 else (category1 if category1 else None)
    else:
        # Synthetic 생성
        price_ranges = ["LOW", "MEDIUM", "HIGH", "PREMIUM"]
        price_range = random.choice(price_ranges)
        categories = ["한식", "중식", "일식", "양식", "분식", "치킨", "패스트푸드", "디저트", "샐러드", "아시아/퓨전", "뷔페/패밀리", "술집"]
        category = random.choice(categories)
        category1 = None
        category2 = category
        category3 = None
    
    return {
        "restaurant_id": restaurant_id,
        "tag_pref": tag_pref,
        "distance_m": distance_m,
        "price_range": price_range,
        "category": category,
        "category1": category1,
        "category2": category2,
        "category3": category3,
        "pref_score": None,  # 나중에 action log 기반으로 계산
        "has_interaction_recent": None,  # 나중에 action log 기반으로 계산
        "engagement_boost": None,  # 나중에 action log 기반으로 계산
    }


def calculate_engagement_boost(action_logs: List[Dict], days: int = 14) -> float:
    """
    최근 N일 내 행동 부스트 점수 계산
    - SAVE: +0.15
    - SHARE: +0.10
    - SELECT: +0.20
    - VIEW: +0.03 (첫 1회만)
    - 상한: 0.25
    """
    cutoff_date = datetime.now() - timedelta(days=days)
    boost = 0.0
    view_counted = False
    
    for log in action_logs:
        if datetime.fromisoformat(log["timestamp"]) < cutoff_date:
            continue
        
        action_type = log["action_type"]
        if action_type == "SAVE":
            boost += 0.15
        elif action_type == "SHARE":
            boost += 0.10
        elif action_type == "SELECT":
            boost += 0.20
        elif action_type == "VIEW" and not view_counted:
            boost += 0.03
            view_counted = True
    
    return min(boost, 0.25)


def calculate_pref_score(action_logs: List[Dict]) -> Optional[float]:
    """
    User-Restaurant 간 pref_score 계산
    - SAVE, SELECT는 긍정 신호
    - VIEW만 있는 경우는 중립/약한 신호
    - 범위: -10.0 ~ +10.0
    """
    if not action_logs:
        return None
    
    score = 0.0
    save_count = sum(1 for log in action_logs if log["action_type"] == "SAVE")
    select_count = sum(1 for log in action_logs if log["action_type"] == "SELECT")
    view_count = sum(1 for log in action_logs if log["action_type"] == "VIEW")
    
    # SAVE: +3.0씩
    score += save_count * 3.0
    
    # SELECT: +5.0씩
    score += select_count * 5.0
    
    # VIEW만 있는 경우: 약한 긍정 신호 (+0.5)
    if save_count == 0 and select_count == 0 and view_count > 0:
        score = min(view_count * 0.5, 2.0)
    
    # 범위 제한
    score = max(-10.0, min(10.0, score))
    
    return round(score, 2) if score != 0.0 else None


def has_interaction_recent(action_logs: List[Dict], days: int = 30) -> bool:
    """최근 N일 내 상호작용 여부 확인"""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    for log in action_logs:
        if datetime.fromisoformat(log["timestamp"]) >= cutoff_date:
            return True
    
    return False


def get_action_counts_by_period(action_logs: List[Dict], days: int) -> Dict[str, int]:
    """최근 N일 내 행동 카운트"""
    cutoff_date = datetime.now() - timedelta(days=days)
    counts = {"save": 0, "share": 0, "select": 0, "view": 0}
    
    for log in action_logs:
        log_date = datetime.fromisoformat(log["timestamp"])
        if log_date >= cutoff_date:
            action_type = log["action_type"].lower()
            if action_type in counts:
                counts[action_type] += 1
    
    return counts


def get_days_since_last_interaction(action_logs: List[Dict]) -> Optional[float]:
    """마지막 상호작용으로부터 경과일"""
    if not action_logs:
        return None
    
    last_date = max(datetime.fromisoformat(log["timestamp"]) for log in action_logs)
    days_ago = (datetime.now() - last_date).total_seconds() / 86400.0
    return round(days_ago, 2)


def calculate_tag_similarity_dot_product(
    user_tags: Dict[int, TagPreference],
    restaurant_tags: Dict[int, TagPreference]
) -> float:
    """사용자-식당 태그 유사도 (내적)"""
    if not user_tags or not restaurant_tags:
        return 0.0
    
    dot_product = 0.0
    for tag_id, user_pref in user_tags.items():
        if tag_id in restaurant_tags:
            rest_pref = restaurant_tags[tag_id]
            dot_product += user_pref.get_value() * rest_pref.get_value() * user_pref.confidence * rest_pref.confidence
    
    return round(dot_product, 4)


def calculate_tag_similarity_cosine(
    user_tags: Dict[int, TagPreference],
    restaurant_tags: Dict[int, TagPreference]
) -> float:
    """사용자-식당 태그 유사도 (코사인)"""
    if not user_tags or not restaurant_tags:
        return 0.0
    
    # 공통 태그만 사용
    common_tags = set(user_tags.keys()) & set(restaurant_tags.keys())
    if not common_tags:
        return 0.0
    
    dot_product = 0.0
    user_norm = 0.0
    rest_norm = 0.0
    
    for tag_id in common_tags:
        user_val = user_tags[tag_id].get_value() * user_tags[tag_id].confidence
        rest_val = restaurant_tags[tag_id].get_value() * restaurant_tags[tag_id].confidence
        
        dot_product += user_val * rest_val
        user_norm += user_val * user_val
        rest_norm += rest_val * rest_val
    
    if user_norm == 0.0 or rest_norm == 0.0:
        return 0.0
    
    cosine = dot_product / (math.sqrt(user_norm) * math.sqrt(rest_norm))
    return round(cosine, 4)


def get_top_k_tag_stats(restaurant_tags: Dict[int, TagPreference], k: int = 5) -> Dict[str, float]:
    """태그 상위 K개 weight 통계"""
    if not restaurant_tags:
        return {"top_k_mean": 0.0, "top_k_max": 0.0, "top_k_std": 0.0}
    
    weights = [tp.weight for tp in restaurant_tags.values() if tp.weight is not None]
    if not weights:
        return {"top_k_mean": 0.0, "top_k_max": 0.0, "top_k_std": 0.0}
    
    top_k_weights = sorted(weights, reverse=True)[:k]
    
    return {
        "top_k_mean": round(np.mean(top_k_weights), 4),
        "top_k_max": round(np.max(top_k_weights), 4),
        "top_k_std": round(np.std(top_k_weights), 4) if len(top_k_weights) > 1 else 0.0
    }


def generate_action_log(
    user_id: int,
    restaurant_id: int,
    action_type: str,
    timestamp: datetime
) -> Dict:
    """Action Log 생성"""
    return {
        "user_id": user_id,
        "restaurant_id": restaurant_id,
        "action_type": action_type,
        "timestamp": timestamp.isoformat(),
    }


def generate_synthetic_action_logs(
    user_id: int,
    restaurant_ids: List[int],
    num_logs: int
) -> List[Dict]:
    """Synthetic Action Logs 생성"""
    action_logs = []
    now = datetime.now()
    
    # 각 restaurant에 대해 action log 생성
    for _ in range(num_logs):
        restaurant_id = random.choice(restaurant_ids)
        action_type = random.choices(
            ACTION_TYPES,
            weights=[ACTION_WEIGHTS.get(a, 1.0) for a in ACTION_TYPES]
        )[0]
        
        # 최근 30일 내 랜덤 timestamp
        days_ago = random.uniform(0, 30)
        timestamp = now - timedelta(days=days_ago)
        
        action_logs.append(generate_action_log(
            user_id=user_id,
            restaurant_id=restaurant_id,
            action_type=action_type,
            timestamp=timestamp
        ))
    
    return action_logs


# ==================== 메인 파이프라인 ====================

def step1_generate_synthetic_users() -> List[UserPrefFeature]:
    """Step 1: Synthetic User 생성"""
    print(f"[Step 1] Synthetic User 생성 중... (N={NUM_SYNTHETIC_USERS})")
    
    users = []
    with open(OUTPUT_SYNTHETIC_USERS, "w", encoding="utf-8") as f:
        for user_id in range(1, NUM_SYNTHETIC_USERS + 1):
            user = generate_synthetic_user(user_id)
            users.append(user)
            
            # JSONL로 저장
            user_dict = {
                "user_id": user.user_id,
                "tag_pref": {
                    str(tag_id): {
                        "score": tp.score,
                        "confidence": tp.confidence
                    }
                    for tag_id, tp in user.tag_pref.items()
                }
            }
            f.write(json.dumps(user_dict, ensure_ascii=False) + "\n")
    
    print(f"[Step 1] 완료: {len(users)}명 생성 → {OUTPUT_SYNTHETIC_USERS}")
    return users


def step2_generate_restaurants() -> List[Dict]:
    """Step 2: Restaurant 데이터 생성/로드"""
    print(f"[Step 2] Restaurant 데이터 로드/생성 중...")
    
    restaurant_tags_by_id = {}
    restaurant_info_by_id = {}
    restaurant_ids = list(range(1, NUM_RESTAURANTS + 1))
    
    # 실제 데이터 로드 시도
    if USE_DB:
        print(f"  - DB에서 restaurant_tag 데이터 로드 중...")
        try:
            restaurant_tags_by_id = load_restaurant_tags_from_db(restaurant_ids)
            print(f"  - DB에서 {len(restaurant_tags_by_id)}개 식당의 tag 데이터 로드 완료")
        except Exception as e:
            print(f"  - DB 로드 실패: {e}")
            print(f"  - Synthetic 생성으로 전환")
            restaurant_tags_by_id = {}
    elif RESTAURANT_TAG_CSV:
        # 상대 경로인 경우 스크립트 위치 기준으로 변환
        csv_path = Path(RESTAURANT_TAG_CSV)
        if not csv_path.is_absolute():
            csv_path = Path(__file__).parent / csv_path
        
        if csv_path.exists():
            print(f"  - CSV 파일에서 restaurant_tag 데이터 로드 중: {csv_path}")
            try:
                restaurant_tags_by_id = load_restaurant_tags_from_csv(str(csv_path))
                # CSV에서 로드한 식당 ID만 사용
                restaurant_ids = list(restaurant_tags_by_id.keys())[:NUM_RESTAURANTS]
                print(f"  - CSV에서 {len(restaurant_ids)}개 식당의 tag 데이터 로드 완료")
            except Exception as e:
                print(f"  - CSV 로드 실패: {e}")
                print(f"  - Synthetic 생성으로 전환")
                restaurant_tags_by_id = {}
        else:
            print(f"  - CSV 파일을 찾을 수 없음: {csv_path}")
            print(f"  - Synthetic 생성으로 전환")
            restaurant_tags_by_id = {}
    else:
        print(f"  - Synthetic restaurant_tag 데이터 생성")
    
    # Restaurant 정보 로드 (가격대, 카테고리 등)
    if RESTAURANT_CSV:
        csv_path = Path(RESTAURANT_CSV)
        if not csv_path.is_absolute():
            csv_path = Path(__file__).parent / csv_path
        
        if csv_path.exists():
            print(f"  - CSV 파일에서 restaurant 정보 로드 중: {csv_path}")
            try:
                restaurant_info_by_id = load_restaurants_from_csv(str(csv_path))
                print(f"  - CSV에서 {len(restaurant_info_by_id)}개 식당의 정보 로드 완료")
            except Exception as e:
                print(f"  - Restaurant CSV 로드 실패: {e}")
                restaurant_info_by_id = {}
        else:
            print(f"  - Restaurant CSV 파일을 찾을 수 없음: {csv_path}")
    
    restaurants = []
    with open(OUTPUT_RESTAURANTS, "w", encoding="utf-8") as f:
        for restaurant_id in restaurant_ids:
            # 실제 데이터가 있으면 사용, 없으면 synthetic 생성
            tag_pref = restaurant_tags_by_id.get(restaurant_id)
            restaurant_info = restaurant_info_by_id.get(restaurant_id)
            restaurant = generate_restaurant(restaurant_id, tag_pref=tag_pref, restaurant_info=restaurant_info)
            restaurants.append(restaurant)
            
            # JSONL로 저장
            restaurant_dict = {
                "restaurant_id": restaurant["restaurant_id"],
                "tag_pref": {
                    str(tag_id): {
                        "weight": tp.weight,
                        "confidence": tp.confidence
                    }
                    for tag_id, tp in restaurant["tag_pref"].items()
                },
                "distance_m": restaurant["distance_m"],
                "price_range": restaurant.get("price_range"),
                "category": restaurant.get("category"),
                "category1": restaurant.get("category1"),
                "category2": restaurant.get("category2"),
                "category3": restaurant.get("category3"),
            }
            f.write(json.dumps(restaurant_dict, ensure_ascii=False) + "\n")
    
    print(f"[Step 2] 완료: {len(restaurants)}개 생성 → {OUTPUT_RESTAURANTS}")
    return restaurants


def step3_generate_user_restaurant_pairs(
    users: List[UserPrefFeature],
    restaurants: List[Dict]
) -> List[Dict]:
    """Step 3: User × Restaurant Pair 생성"""
    print(f"[Step 3] User × Restaurant Pair 생성 중...")
    
    pairs = []
    restaurant_ids = [r["restaurant_id"] for r in restaurants]
    
    with open(OUTPUT_PAIRS, "w", encoding="utf-8") as f:
        for user in users:
            # 각 user당 NUM_PAIRS_PER_USER개의 pair 생성
            selected_restaurant_ids = random.sample(
                restaurant_ids,
                min(NUM_PAIRS_PER_USER, len(restaurant_ids))
            )
            
            for restaurant_id in selected_restaurant_ids:
                pair = {
                    "user_id": user.user_id,
                    "restaurant_id": restaurant_id,
                }
                pairs.append(pair)
                f.write(json.dumps(pair, ensure_ascii=False) + "\n")
    
    print(f"[Step 3] 완료: {len(pairs)}개 pair 생성 → {OUTPUT_PAIRS}")
    return pairs


def step4_generate_action_logs(
    users: List[UserPrefFeature],
    restaurants: List[Dict]
) -> Dict[Tuple[int, int], List[Dict]]:
    """Step 4: Synthetic Action Log 생성"""
    print(f"[Step 4] Synthetic Action Log 생성 중...")
    
    action_logs_by_pair: Dict[Tuple[int, int], List[Dict]] = {}
    restaurant_ids = [r["restaurant_id"] for r in restaurants]
    
    with open(OUTPUT_ACTION_LOGS, "w", encoding="utf-8") as f:
        for user in users:
            # 각 user당 NUM_ACTION_LOGS_PER_USER개의 action log 생성
            user_action_logs = generate_synthetic_action_logs(
                user_id=user.user_id,
                restaurant_ids=restaurant_ids,
                num_logs=NUM_ACTION_LOGS_PER_USER
            )
            
            for log in user_action_logs:
                pair_key = (log["user_id"], log["restaurant_id"])
                if pair_key not in action_logs_by_pair:
                    action_logs_by_pair[pair_key] = []
                action_logs_by_pair[pair_key].append(log)
                
                f.write(json.dumps(log, ensure_ascii=False) + "\n")
    
    print(f"[Step 4] 완료: {sum(len(logs) for logs in action_logs_by_pair.values())}개 action log 생성 → {OUTPUT_ACTION_LOGS}")
    return action_logs_by_pair


def step5_generate_training_dataset(
    users: List[UserPrefFeature],
    restaurants: List[Dict],
    pairs: List[Dict],
    action_logs_by_pair: Dict[Tuple[int, int], List[Dict]]
) -> pd.DataFrame:
    """Step 5: ML 학습 데이터셋 생성 (실제 추천 로직 사용)"""
    print(f"[Step 5] ML 학습 데이터셋 생성 중...")
    
    training_rows = []
    
    # User별로 처리
    for user in users:
        # 해당 user의 pair들 찾기
        user_pairs = [p for p in pairs if p["user_id"] == user.user_id]
        
        # 각 pair에 대해 candidate feature 생성 및 점수 계산
        candidates = []
        for pair in user_pairs:
            restaurant_id = pair["restaurant_id"]
            restaurant = next(r for r in restaurants if r["restaurant_id"] == restaurant_id)
            
            # Action log 기반으로 pref_score, has_interaction_recent, engagement_boost 계산
            pair_key = (user.user_id, restaurant_id)
            action_logs = action_logs_by_pair.get(pair_key, [])
            
            pref_score = calculate_pref_score(action_logs)
            has_interaction = has_interaction_recent(action_logs, days=30)
            engagement_boost = calculate_engagement_boost(action_logs, days=14)
            
            candidate = CandidateFeature(
                restaurant_id=restaurant_id,
                distance_m=restaurant["distance_m"],
                tag_pref=restaurant["tag_pref"],
                pref_score=pref_score,
                has_interaction_recent=has_interaction if action_logs else None,
                engagement_boost=engagement_boost if engagement_boost > 0 else None
            )
            candidates.append(candidate)
        
        # 실제 추천 로직으로 점수 계산
        scored_results = score_personal(user, candidates, debug=False)
        
        # 결과를 training dataset에 추가
        for restaurant_id, score, debug in scored_results:
            # 해당 pair의 action log 정보
            pair_key = (user.user_id, restaurant_id)
            action_logs = action_logs_by_pair.get(pair_key, [])
            
            # 해당 restaurant 정보 찾기
            restaurant = next(r for r in restaurants if r["restaurant_id"] == restaurant_id)
            
            # Action log 기반으로 pref_score, has_interaction_recent, engagement_boost 재계산
            pref_score = calculate_pref_score(action_logs)
            has_interaction = has_interaction_recent(action_logs, days=30)
            engagement_boost = calculate_engagement_boost(action_logs, days=14)
            
            # Action log counts
            action_count_save = sum(1 for log in action_logs if log["action_type"] == "SAVE")
            action_count_share = sum(1 for log in action_logs if log["action_type"] == "SHARE")
            action_count_select = sum(1 for log in action_logs if log["action_type"] == "SELECT")
            action_count_view = sum(1 for log in action_logs if log["action_type"] == "VIEW")
            action_count_total = len(action_logs)
            
            # 태그 유사도 계산
            tag_sim_dot = calculate_tag_similarity_dot_product(user.tag_pref, restaurant["tag_pref"])
            tag_sim_cosine = calculate_tag_similarity_cosine(user.tag_pref, restaurant["tag_pref"])
            
            # Restaurant tag weight 표준편차
            restaurant_tag_weights = [tp.weight for tp in restaurant["tag_pref"].values() if tp.weight is not None]
            restaurant_tag_weight_std = np.std(restaurant_tag_weights) if restaurant_tag_weights else 0.0
            
            # Feature 추출
            row = {
                "user_id": user.user_id,
                "restaurant_id": restaurant_id,
                "score": score,  # 실제 추천 로직으로 계산된 점수 (ground truth)
                
                # User features
                "user_num_tags": len(user.tag_pref),
                "user_tag_avg_score": np.mean([tp.score for tp in user.tag_pref.values() if tp.score is not None]) if user.tag_pref else 0.0,
                "user_tag_avg_confidence": np.mean([tp.confidence for tp in user.tag_pref.values()]) if user.tag_pref else 0.0,
                
                # Restaurant features
                "restaurant_num_tags": len(restaurant["tag_pref"]),
                "restaurant_tag_avg_weight": np.mean([tp.weight for tp in restaurant["tag_pref"].values() if tp.weight is not None]) if restaurant["tag_pref"] else 0.0,
                "restaurant_tag_avg_confidence": np.mean([tp.confidence for tp in restaurant["tag_pref"].values()]) if restaurant["tag_pref"] else 0.0,
                "restaurant_tag_weight_std": restaurant_tag_weight_std,
                
                # 태그 유사도
                "tag_similarity_dot": tag_sim_dot,
                "tag_similarity_cosine": tag_sim_cosine,
                
                # Interaction features
                "distance_m": restaurant["distance_m"],
                "distance_m_log": np.log1p(restaurant["distance_m"]),  # 로그 스케일
                "pref_score": pref_score if pref_score is not None else 0.0,
                "has_interaction_recent": 1 if has_interaction else 0,  # boolean -> 0/1
                "engagement_boost": engagement_boost if engagement_boost > 0 else 0.0,
                
                # Action log counts
                "action_count_save": action_count_save,
                "action_count_share": action_count_share,
                "action_count_select": action_count_select,
                "action_count_view": action_count_view,
                "action_count_total": action_count_total,
                
                # Timestamp (분할용): action_log의 마지막 timestamp 사용, 없으면 현재 시간
                "timestamp": max([datetime.fromisoformat(log["timestamp"]) for log in action_logs]).isoformat() if action_logs else datetime.now().isoformat(),
            }
            
            training_rows.append(row)
    
    # DataFrame 생성
    df = pd.DataFrame(training_rows)
    
    # ==================== 피처 상태 점검 및 개선 ====================
    print(f"[Step 5-1] 피처 상태 점검 및 개선 중...")
    
    # 1. 누락 처리
    for col in ["pref_score", "engagement_boost"]:
        df[col] = df[col].fillna(0.0)
    
    # 2. boolean 캐스팅 (이미 0/1로 되어있지만 확실히)
    if "has_interaction_recent" in df.columns:
        df["has_interaction_recent"] = df["has_interaction_recent"].astype(int)
    
    # 3. 중복 제거: (user_id, restaurant_id) 중복이 있으면 최근 데이터 하나만 유지
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp", ascending=False)
        df = df.drop_duplicates(subset=["user_id", "restaurant_id"], keep="first")
        print(f"  - 중복 제거 후: {len(df)}개 행")
    
    # ==================== 라벨 생성 ====================
    print(f"[Step 5-2] 이진 라벨 생성 중...")
    
    # y=1: action_count_select>0 또는 pref_score≥5
    # y=0: 그 외 (무반응은 0으로 처리)
    df["y"] = ((df["action_count_select"] > 0) | (df["pref_score"] >= 5.0)).astype(int)
    
    # 클래스 밸런스 확인
    pos_ratio = df["y"].mean()
    print(f"  - Positive 비율: {pos_ratio:.2%} ({df['y'].sum()}/{len(df)})")
    
    if pos_ratio < 0.05:
        print(f"  - [WARN] Positive 비율이 너무 낮습니다 (5% 미만). 언더샘플링 또는 class_weight=balanced 권장")
    elif pos_ratio > 0.40:
        print(f"  - [WARN] Positive 비율이 높습니다 (40% 초과)")
    else:
        print(f"  - [OK] Positive 비율이 적절합니다 (5%~40%)")
    
    # ==================== Train/Val/Test 분할 ====================
    print(f"[Step 5-3] Train/Val/Test 분할 중...")
    
    if "timestamp" in df.columns:
        # 시간 기준 정렬
        df = df.sort_values("timestamp")
        
        # 시간 기준 분할 (70% / 15% / 15%)
        n_total = len(df)
        n_train = int(n_total * 0.7)
        n_val = int(n_total * 0.15)
        
        df_train = df.iloc[:n_train].copy()
        df_val = df.iloc[n_train:n_train+n_val].copy()
        df_test = df.iloc[n_train+n_val:].copy()
        
        # 사용자 누수 확인 (같은 user_id가 여러 세트에 있는지)
        train_users = set(df_train["user_id"].unique())
        val_users = set(df_val["user_id"].unique())
        test_users = set(df_test["user_id"].unique())
        
        overlap_train_val = len(train_users & val_users)
        overlap_train_test = len(train_users & test_users)
        overlap_val_test = len(val_users & test_users)
        
        if overlap_train_val > 0 or overlap_train_test > 0 or overlap_val_test > 0:
            print(f"  - [WARN] 사용자 누수 발견: Train-Val={overlap_train_val}, Train-Test={overlap_train_test}, Val-Test={overlap_val_test}")
            print(f"  - GroupKFold(user_id) 사용 권장")
        else:
            print(f"  - [OK] 사용자 누수 없음")
        
        print(f"  - Train: {len(df_train)}개 행 ({len(df_train)/n_total:.1%})")
        print(f"  - Val: {len(df_val)}개 행 ({len(df_val)/n_total:.1%})")
        print(f"  - Test: {len(df_test)}개 행 ({len(df_test)/n_total:.1%})")
        
        # 분할된 데이터셋 저장
        df_train.to_csv(OUTPUT_DIR / "ml_training_dataset_train.csv", index=False, encoding="utf-8-sig")
        df_val.to_csv(OUTPUT_DIR / "ml_training_dataset_val.csv", index=False, encoding="utf-8-sig")
        df_test.to_csv(OUTPUT_DIR / "ml_training_dataset_test.csv", index=False, encoding="utf-8-sig")
        
        print(f"  - 저장 완료: train/val/test CSV 파일")
    else:
        print(f"  - [WARN] timestamp 정보 없음, 분할 건너뜀")
        df_train = df
        df_val = None
        df_test = None
    
    # ==================== 최종 데이터셋 저장 ====================
    # timestamp 컬럼 제거 (학습용이 아니므로)
    if "timestamp" in df.columns:
        df_final = df.drop(columns=["timestamp"])
    else:
        df_final = df
    
    # CSV 저장
    df_final.to_csv(OUTPUT_TRAINING_DATASET, index=False, encoding="utf-8-sig")
    
    print(f"[Step 5] 완료: {len(df_final)}개 행 생성 → {OUTPUT_TRAINING_DATASET}")
    print(f"  - 총 컬럼 수: {len(df_final.columns)}")
    print(f"  - Score 범위: [{df_final['score'].min():.4f}, {df_final['score'].max():.4f}]")
    print(f"  - 주요 피처:")
    print(f"    * 라벨: score (룰 엔진 점수), y (이진 라벨)")
    print(f"    * 태그 유사도: tag_similarity_dot, tag_similarity_cosine")
    print(f"    * 거리: distance_m, distance_m_log")
    print(f"    * 태그 통계: restaurant_tag_weight_std")
    
    return df_final


def main():
    """메인 파이프라인 실행"""
    print("=" * 60)
    print("Synthetic ML Training Dataset Generator")
    print("=" * 60)
    print()
    
    # Step 1: Synthetic User 생성
    users = step1_generate_synthetic_users()
    print()
    
    # Step 2: Restaurant 데이터 생성
    restaurants = step2_generate_restaurants()
    print()
    
    # Step 3: User × Restaurant Pair 생성
    pairs = step3_generate_user_restaurant_pairs(users, restaurants)
    print()
    
    # Step 4: Synthetic Action Log 생성
    action_logs_by_pair = step4_generate_action_logs(users, restaurants)
    print()
    
    # Step 5: ML 학습 데이터셋 생성
    training_df = step5_generate_training_dataset(
        users, restaurants, pairs, action_logs_by_pair
    )
    print()
    
    print("=" * 60)
    print("모든 단계 완료!")
    print(f"출력 디렉토리: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()

