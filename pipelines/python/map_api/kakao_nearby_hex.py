"""
Kakao Local API hex sweep -> Excel

- Input CSV: hex_centers_gangnam.csv ('lat','lng')
- API: GET https://dapi.kakao.com/v2/local/search/category.json
- Category: FD6 (음식점)
- 반경: 35 m
- Pagination: page=1.., size=15, meta.is_end == True 면 종료
- Dedupe: Kakao 'id'
- Output: kakao_restaurants_hex_all.xlsx

Dependencies:
  pip install requests pandas openpyxl python-dotenv
Env:
  .env file with KAKAO_REST_API_KEY=xxxxx
"""

import os, time, json, math, typing as t
import requests
import pandas as pd
from datetime import datetime
from dataclasses import dataclass
from dotenv import load_dotenv

HEX_CSV = "hex_centers_gangnam.csv"  # input csv
OUTPUT_XLSX = "kakao_restaurants_hex_all.xlsx"

# ---- Kakao API config ----
KAKAO_BASE = "https://dapi.kakao.com"
KAKAO_PATH = "/v2/local/search/category.json"
CATEGORY = "FD6"        # 음식점
RADIUS_M = 35
SIZE = 15
PAGE_MAX = 3
LANG = "ko"

# ---- Controls ----
SLEEP_BETWEEN_REQ = 0.08     # 요청 간격 조절
RETRY_MAX = 4
LIMIT_CENTERS = None         # 숫자 지정시 처음 n개만 사용용

def env_kakao_key() -> str:
    load_dotenv()
    key = os.getenv("KAKAO_REST_API_KEY", "").strip()
    if not key:
        raise SystemExit("ERROR: Set KAKAO_REST_API_KEY in environment or .env")
    return key

def kakao_headers() -> dict:
    return {"Authorization": f"KakaoAK {env_kakao_key()}"}

def backoff_sleep(attempt: int):
    time.sleep(min(2.0, 0.15 * (2 ** attempt)))

def parse_category_path(cat: str) -> tuple[str, str, str]:
    """
    Kakao 'category_name' example: '음식점 > 한식 > 감자탕'
    Return (대분류, 중분류, 소분류)
    """
    if not cat:
        return (None, None, None)
    parts = [p.strip() for p in cat.split(">")]
    parts += [None] * (3 - len(parts))
    return (parts[0], parts[1], parts[2])

def fetch_kakao_page(lat: float, lng: float, radius_m: int, page: int, size: int = SIZE) -> dict:
    params = {
        "category_group_code": CATEGORY,
        "y": f"{lat}",
        "x": f"{lng}",
        "radius": radius_m,
        "page": page,
        "size": size,
        "sort": "distance" # 거리 순 정렬, 없을 시 정확도 기준 정렬 기본
    }
    for attempt in range(RETRY_MAX):
        try:
            r = requests.get(KAKAO_BASE + KAKAO_PATH, headers=kakao_headers(), params=params, timeout=12)
            if r.status_code == 200:
                return r.json()
            elif r.status_code in (429, 503, 504):
                backoff_sleep(attempt)
            else:
                print(f"[WARN] HTTP {r.status_code}: {r.text[:200]}")
                return {}
        except requests.RequestException as e:
            print(f"[ERR] Kakao exception: {e}")
            backoff_sleep(attempt)
    return {}

def fetch_all_for_center(lat: float, lng: float, radius_m: int = RADIUS_M) -> list[dict]:
    all_docs: list[dict] = []
    for page in range(1, PAGE_MAX + 1):
        data = fetch_kakao_page(lat, lng, radius_m, page, size=SIZE)
        docs = data.get("documents", []) if isinstance(data, dict) else []
        all_docs.extend(docs)

        meta = data.get("meta", {}) if isinstance(data, dict) else {}
        is_end = meta.get("is_end", True)  # 무한 루프 방지, 기본 True
        # 디버깅 출력
        print(f"  page={page:02d}, docs={len(docs)}, is_end={is_end}")
        if is_end or len(docs) < SIZE:
            break
        time.sleep(SLEEP_BETWEEN_REQ)
    return all_docs

def normalize(doc: dict) -> dict:
    # Kakao 'x'=lng, 'y'=lat 문자열 반환
    x = doc.get("x"); y = doc.get("y")
    try:
        lng = float(x) if x is not None else None
        lat = float(y) if y is not None else None
    except ValueError:
        lng = None; lat = None

    big, mid, small = parse_category_path(doc.get("category_name") or "")
    dist_m = None
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if doc.get("distance"):
        try:
            dist_m = int(float(doc["distance"]))
        except ValueError:
            pass

    return {
        "이름": doc.get("place_name"),
        "도로명주소": doc.get("road_address_name"),
        "지번주소": doc.get("address_name"),
        "위도": lat,
        "경도": lng,
        "전화번호": doc.get("phone") or None,
        "카테고리(원문)": doc.get("category_name"),
        "카테고리_대": big,
        "카테고리_중": mid,
        "카테고리_소": small,
        "KakaoID": doc.get("id"),
        "링크": doc.get("place_url"),
        # 거리(m)": dist_m,
        "출처": "kakao",
        "created_at": now_str,
        "updated_at": now_str,
    }

def main():
    df = pd.read_csv(HEX_CSV)
    if not {"lat", "lng"}.issubset(df.columns):
        raise SystemExit("CSV must contain 'lat','lng' columns")

    if LIMIT_CENTERS:
        df = df.head(int(LIMIT_CENTERS))
        print(f"[TEST MODE] Using first {len(df)} centers")

    seen: dict[str, dict] = {}
    total_calls = 0

    for i, row in df.iterrows():
        lat, lng = float(row["lat"]), float(row["lng"])
        docs = fetch_all_for_center(lat, lng, RADIUS_M)
        total_calls += 1

        for d in docs:
            kid = d.get("id")
            if not kid:
                continue
            # 중복 시 첫 번째 탐색 유지
            if kid not in seen:
                seen[kid] = d

        if total_calls % 20 == 0:
            print(f"  progress: centers={total_calls}/{len(df)}, unique_kakao={len(seen)}")

        time.sleep(SLEEP_BETWEEN_REQ)

    # 정규화
    rows = [normalize(d) for d in seen.values()]
    out = pd.DataFrame(rows)
    out.sort_values(by=["이름", "도로명주소"], inplace=True, na_position="last")
    out.reset_index(drop=True, inplace=True)

    # Excel 저장
    out.to_excel(OUTPUT_XLSX, index=False)
    print(f"Saved {OUTPUT_XLSX} (unique restaurants={len(out)}, centers={len(df)})")

if __name__ == "__main__":
    main()