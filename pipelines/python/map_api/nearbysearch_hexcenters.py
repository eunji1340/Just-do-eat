"""
Hex centers -> Google Places Nearby (radius=35m) -> dedupe -> Excel

필요:
- pip install requests pandas openpyxl python-dotenv
- 환경변수 GOOGLE_MAPS_API_KEY 또는 .env 파일에 동일 키

입력:
- HEX_CSV: 헥스 중심 좌표 CSV (columns: lat,lng)
  (이전 대화에서 받은 hex_centers_gangnam.csv 그대로 사용 가능)

출력:
- restaurants_gangnam_nearby.xlsx : 결과 엑셀 1시트
- raw_jsonl/ : 원본 응답 보관(옵션)
"""

import os, time, json, math, pathlib, typing as t
import requests
import pandas as pd
from dataclasses import dataclass
from dotenv import load_dotenv

# -----------------------------
# 설정
# -----------------------------
HEX_CSV = "hex_centers_gangnam.csv"  # 필요 시 절대경로로
RADIUS_M = 35.0
LANGUAGE = "ko"       # 결과 언어(주소 등)
REGION = "KR"         # 포맷에 영향
INCLUDED_TYPES = ["restaurant"]   # 필요 시 세분화
MAX_RESULTS_PER_TILE = 20         # Nearby Search (New)의 page size 상한
SLEEP_BETWEEN_REQ = 0.15          # API rate 조절(계정/쿼터에 맞게 조정)
WRITE_RAW = False                  # 원문 json 보관 여부

# 필드마스크: 요금 영향이 있으므로 필요 필드만!
# - 기본(식별/이름/주소/링크/좌표/타입/아이콘)
# - 연락처/영업시간/가격/평점 (Enterprise SKU)
# - generativeSummary(제미나이 요약) (Atmosphere+ SKU)
FIELD_MASK = ",".join([
    # 식별자/링크/이름/주소/좌표
    "places.id",
    "places.name",
    "places.displayName",
    "places.formattedAddress",
    "places.googleMapsUri",
    "places.googleMapsLinks",          # deep link들
    "places.location",
    "places.primaryType",
    "places.types",
    # 연락처/가격/평점/웹사이트
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.priceLevel",
    "places.rating",
    "places.userRatingCount",
    "places.websiteUri",
    # 영업시간
    "places.currentOpeningHours",
    "places.regularOpeningHours",
    "places.utcOffsetMinutes",
    # 사진(대표컷 한 장만)
    "places.photos",
    # 상태
    "places.businessStatus",
    # 제미나이 요약(요약소개)
    "places.generativeSummary",
])

API_BASE = "https://places.googleapis.com/v1"
NEARBY_URL = f"{API_BASE}/places:searchNearby"
DETAILS_URL_TMPL = f"{API_BASE}" + "/{place_name}"  # place_name 예: 'places/ChIJ...'

# -----------------------------
# 유틸
# -----------------------------
def env_api_key() -> str:
    load_dotenv()
    key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("환경변수 GOOGLE_MAPS_API_KEY 가 없습니다.")
    return key

def headers(field_mask: str) -> dict:
    return {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Goog-Api-Key": env_api_key(),
        "X-Goog-FieldMask": field_mask
    }

def backoff_sleep(attempt: int):
    time.sleep(min(2.0, 0.2 * (2 ** attempt)))

@dataclass
class PlaceNormalized:
    place_id: str
    resource_name: str
    name: str
    address: str
    lat: float
    lng: float
    phone_nat: t.Optional[str]
    phone_intl: t.Optional[str]
    summary_short: t.Optional[str]
    categories: t.List[str]
    primary_type: t.Optional[str]
    rating: t.Optional[float]
    rating_count: t.Optional[int]
    price_level: t.Optional[str]
    gmaps_uri: t.Optional[str]
    website: t.Optional[str]
    image_url: t.Optional[str]
    business_status: t.Optional[str]
    opening_hours_json: t.Optional[str]
    # 아래 3개는 구글에서 제공 X → null (후속 채움: 다이닝코드/자체OCR/외부소스)
    menu: t.Optional[str] = None
    wait_time: t.Optional[str] = None
    break_info: t.Optional[str] = None  # 브레이크 유무(정규 영업시간 텍스트로 추정 가능)

def build_photo_media_url(photo_name: str, max_w: int=800, max_h: int=800) -> str:
    # v1 Photo Media: GET https://places.googleapis.com/v1/{name}/media?maxHeightPx=...&key=...
    # name 예: "places/ABC/photos/XYZ"
    return f"https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx={max_w}&maxHeightPx={max_h}&key={env_api_key()}"

def normalize_place(p: dict) -> PlaceNormalized:
    # id / name(resource)
    rid = p.get("id")
    rname = p.get("name")              # 'places/PLACE_ID'
    place_id = (rname or "").split("/")[-1] if rname else rid

    disp = (p.get("displayName") or {}).get("text")
    addr = p.get("formattedAddress")
    loc = p.get("location") or {}
    lat = loc.get("latitude")
    lng = loc.get("longitude")
    phone_nat = p.get("nationalPhoneNumber")
    phone_intl = p.get("internationalPhoneNumber")
    cats = p.get("types") or []
    primary = p.get("primaryType")
    rating = p.get("rating")
    rcnt = p.get("userRatingCount")
    price_level = p.get("priceLevel")
    guri = p.get("googleMapsUri")
    web = p.get("websiteUri")
    status = p.get("businessStatus")

    # 사진(대표 1장)
    photos = p.get("photos") or []
    image_url = None
    if photos:
        # photos[0]['name'] 사용하여 media URL 구성
        image_url = build_photo_media_url(photos[0]["name"])

    # 제미나이 요약 (overview/description)
    gen = p.get("generativeSummary") or {}
    overview = (gen.get("overview") or {}).get("text")
    description = (gen.get("description") or {}).get("text")
    summary_short = overview or description

    # 영업시간(그대로 JSON 문자열화)
    # regularOpeningHours / currentOpeningHours 구조 유지
    hours = {
        "regularOpeningHours": p.get("regularOpeningHours"),
        "currentOpeningHours": p.get("currentOpeningHours"),
        "utcOffsetMinutes": p.get("utcOffsetMinutes"),
    }
    hours_json = json.dumps(hours, ensure_ascii=False)

    return PlaceNormalized(
        place_id=place_id,
        resource_name=rname,
        name=disp,
        address=addr,
        lat=lat, lng=lng,
        phone_nat=phone_nat,
        phone_intl=phone_intl,
        summary_short=summary_short,
        categories=cats,
        primary_type=primary,
        rating=rating,
        rating_count=rcnt,
        price_level=str(price_level) if price_level is not None else None,
        gmaps_uri=guri,
        website=web,
        image_url=image_url,
        business_status=status,
        opening_hours_json=hours_json,
    )

def call_nearby(lat: float, lng: float) -> t.List[dict]:
    """
    Nearby Search (New) 호출.
    참고: (New) 문서에는 nextPageToken 언급이 없고, 1회 최대 20건.
    헥스 타일링으로 전수 커버합니다.
    """
    body = {
        "includedTypes": INCLUDED_TYPES,
        "maxResultCount": MAX_RESULTS_PER_TILE,
        "languageCode": LANGUAGE,
        "regionCode": REGION,
        "rankPreference": "POPULARITY",
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": RADIUS_M
            }
        }
    }

    for attempt in range(5):
        try:
            resp = requests.post(NEARBY_URL, headers=headers(FIELD_MASK), json=body, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("places", [])
            elif resp.status_code in (429, 503):
                backoff_sleep(attempt)
            else:
                print(f"[WARN] Nearby HTTP {resp.status_code}: {resp.text[:200]}")
                return []
        except requests.RequestException as e:
            print(f"[ERR] Nearby exception: {e}")
            backoff_sleep(attempt)
    return []

# -----------------------------
# 실행
# -----------------------------
def main():
    outdir = pathlib.Path("raw_jsonl")
    if WRITE_RAW:
        outdir.mkdir(exist_ok=True)

    df = pd.read_csv(HEX_CSV)
    #################################################################
    ################# 시험용: 처음 3개 포인트만 사용 ####################
    df = df.head(3)
    #################################################################

    if not {"lat","lng"}.issubset(df.columns):
        raise RuntimeError("CSV에는 lat,lng 컬럼이 필요합니다.")

    # 디듀플: place_id 기준
    seen: dict[str, dict] = {}

    for i, row in df.iterrows():
        lat, lng = float(row["lat"]), float(row["lng"])
        places = call_nearby(lat, lng)
        if WRITE_RAW and places:
            with open(outdir / f"nearby_{i:04d}.jsonl", "w", encoding="utf-8") as f:
                for p in places:
                    f.write(json.dumps(p, ensure_ascii=False) + "\n")

        # 병합
        for p in places:
            # resource name 또는 id 사용
            pid = (p.get("name") or "").split("/")[-1] if p.get("name") else p.get("id")
            if not pid:
                continue
            # 최초것 우선, 이후 것은 rating_count 큰 쪽/정보 더 많은 쪽으로 보완 가능(여기선 최초만)
            if pid not in seen:
                seen[pid] = p

        time.sleep(SLEEP_BETWEEN_REQ)

    # 정규화 → DataFrame
    norm: list[PlaceNormalized] = [normalize_place(p) for p in seen.values()]
    rows = []
    for n in norm:
        rows.append({
            "이름": n.name,
            "주소": n.address,
            "위도": n.lat,
            "경도": n.lng,
            "전화번호(국내)": n.phone_nat,
            "전화번호(국제)": n.phone_intl,
            "요약소개(Generative)": n.summary_short,
            "카테고리(types)": ", ".join(n.categories),
            "대표_주카테고리(primaryType)": n.primary_type,
            "평점": n.rating,
            "리뷰수": n.rating_count,
            "가격대(priceLevel)": n.price_level,
            "구글ID": n.place_id,
            "리소스명": n.resource_name,
            "구글맵링크": n.gmaps_uri,
            "웹사이트": n.website,
            "대표이미지URL": n.image_url,
            "영업상태": n.business_status,
            "영업시간(JSON)": n.opening_hours_json,
            # 구글 미제공 → 후속 채우기(다이닝코드/OCR)
            "메뉴": n.menu,
            "대기시간": n.wait_time,
            "브레이크여부(후처리)": n.break_info,
        })

    out = pd.DataFrame(rows)
    # 정렬(가독)
    out = out.sort_values(by=["이름"]).reset_index(drop=True)

    # 저장
    xlsx_path = "restaurants_gangnam_nearby.xlsx"
    out.to_excel(xlsx_path, index=False)
    print(f"Saved: {xlsx_path} (총 {len(out)}곳, 헥스 입력 {len(df)}개)")

if __name__ == "__main__":
    main()
