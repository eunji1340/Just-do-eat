# tests/test_score_contract.py
# 계약/형식 검증 최소 테스트
# Author: Jang
# Date: 2025-10-29

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_personal_contract_min():
    payload = {
        "user": {
            "user_id": 1,
            "cat_pref": {"10": 0.6},
            "attr_pref": {"price:bucket_2": 0.4, "atmo:quiet": 0.5},
            "saved": [1001],
            "rest_bias": {}
        },
        "candidates": [
            {
                "restaurant_id": 1001,
                "distance_m": 350,
                "is_open": True,
                "price_bucket": 2,
                "categories": [10],
                "attrs": {"atmo:quiet": "Y", "price:bucket_2": "Y"}
            },
            {
                "restaurant_id": 1002,
                "distance_m": 1200,
                "is_open": True,
                "price_bucket": 3,
                "categories": [20],
                "attrs": {"atmo:lively": "Y", "price:bucket_3": "Y"}
            }
        ],
        "debug": True
    }
    r = client.post("/v1/score/personal", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "scores" in body and "algo_version" in body and "elapsed_ms" in body
    assert isinstance(body["scores"], list) and len(body["scores"]) == 2
    # 점수 값 존재
    assert "score" in body["scores"][0]

def test_group_contract_min():
    payload = {
        "members": [
            {"user_id": 1, "cat_pref": {"10": 0.5}, "attr_pref": {}, "saved": [], "rest_bias": {}},
            {"user_id": 2, "cat_pref": {"10": 0.2}, "attr_pref": {"atmo:quiet": 0.4}, "saved": [], "rest_bias": {}}
        ],
        "appointment_constraints": {
            "center_lat": 37.5,
            "center_lng": 127.0,
            "radius_m": 1000,
            "dow": 2,
            "hour": 19,
            "alcohol_ok": 1,
            "price_bucket": 2,
            "dislikes": []
        },
        "candidates": [
            {
                "restaurant_id": 1001,
                "distance_m": 800,
                "is_open": True,
                "price_bucket": 2,
                "categories": [10],
                "attrs": {"atmo:quiet": "Y"}
            }
        ],
        "debug": True
    }
    r = client.post("/v1/score/group", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "results" in body and len(body["results"]) == 1
    item = body["results"][0]
    assert "restaurant_id" in item and "group_score" in item and "per_user" in item
