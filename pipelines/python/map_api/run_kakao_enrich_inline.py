# -*- coding: utf-8 -*-
"""
입력: kakao_restaurants_hex_all.xlsx (KakaoID 포함)
처리: KakaoID별 카카오 상세(panel3) JSON 호출 -> 파싱 -> enrich_* 컬럼 추가
출력: kakao_restaurants_hex_enriched.xlsx
주의: 비공개 웹 API를 호출하므로 정책/구조 변경 시 DevTools로 재확인 필요
"""

import json
from re import L
import time
from datetime import datetime
import pandas as pd
import requests

# ===================== 설정 =====================
INPUT_XLSX  = "kakao_restaurants_hex_all.xlsx"
OUTPUT_XLSX = "kakao_restaurants_hex_enriched.xlsx"

# 호출 세부
RETRY_MAX       = 4
TIMEOUT         = 12
SLEEP_BETWEEN   = 0.40   # 너무 낮추면 406/429 발생 가능
BACKOFF_BASE    = 0.40   # 0.4, 0.8, 1.6, 3.2 ..

# 시험용: 첫 1건만 실행하려면 True
TEST_FIRST_ONLY = False

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/141.0.0.0 Safari/537.36"
)

# 전역 세션(쿠키 유지)
SESS = requests.Session()


# ===================== 유틸 =====================
def ts() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def _get(d: dict, path: str, default=None):
    """안전한 딕셔너리 경로 접근: 'a.b.c'"""
    cur = d
    for key in path.split("."):
        if not isinstance(cur, dict) or key not in cur:
            return default
        cur = cur[key]
    return cur

def backoff_sleep(attempt: int):
    time.sleep(min(3.2, BACKOFF_BASE * (2 ** attempt)))


# ===================== 네트워크 =====================
def prime_cookies(kakao_id: str):
    """상세 페이지를 먼저 열어 쿠키(credential) 프라이밍"""
    detail_url = f"https://place.map.kakao.com/{kakao_id}"
    headers = {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://place.map.kakao.com/",
        "Connection": "keep-alive",
    }
    try:
        SESS.get(detail_url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException:
        # 쿠키 프라이밍 실패해도 이후 재시도로 복구될 수 있음 (여기선 단순 통과)
        pass

def fetch_panel3_json(kakao_id: str) -> dict | None:
    """현재 웹앱이 사용하는 엔드포인트 (폴백 없음)"""
    url = f"https://place-api.map.kakao.com/places/panel3/{kakao_id}"
    headers = {
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Origin": "https://place.map.kakao.com",
        "Referer": "https://place.map.kakao.com/",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Site": "same-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "appversion": "6.6.0",  # DevTools 캡처 기준
        "pf": "web",
    }

    last_err = None
    for attempt in range(RETRY_MAX):
        try:
            r = SESS.get(url, headers=headers, timeout=TIMEOUT)
            if r.status_code == 200:
                try:
                    return r.json()
                except Exception:
                    try:
                        return json.loads(r.text)
                    except Exception:
                        return None
            elif r.status_code in (406, 429, 503, 504):
                last_err = f"HTTP {r.status_code}"
                backoff_sleep(attempt)
                continue
            else:
                last_err = f"HTTP {r.status_code}"
                break
        except requests.RequestException as e:
            last_err = str(e)
            backoff_sleep(attempt)
            continue

    if last_err:
        print(f"[WARN] panel3 fail cid={kakao_id}: {last_err}")
    return None

def fetch_detail_json(kakao_id: str) -> dict | None:
    """쿠키 프라이밍 후 panel3 호출 (폴백 없음)"""
    prime_cookies(kakao_id)
    return fetch_panel3_json(kakao_id)


# ===================== 파싱 =====================
def parse_rating_and_reviews(j: dict):
    # 5점 만점(카카오 별점)
    rating     = _get(j, "kakaomap_review.score_set.average_score")
    review_cnt = _get(j, "kakaomap_review.score_set.review_count")
    blog_review_cnt = _get(j, "blog_review.review_count")
    return rating, review_cnt, blog_review_cnt


def pick_top_photos(j: dict, limit: int = 3):
    urls = []

    # 1) 메인 사진 우선
    main = _get(j, "my_store.main_photo_url")
    if main:
        urls.append(main)

    # 2) 후보 경로들에서 리스트를 꺼내 URL 키를 탐색
    candidates = [
        "photos.photos",        # DevTools에 따라 이렇게 오는 케이스 존재
        "photos.items",
        "photos.list",
        "photos",               # 어떤 경우엔 바로 리스트
        "menu.menus.photos",
        "menu.photos",
    ]
    url_keys = ("url", "img_url", "image_url", "photo_url", "thumb_url")

    for path in candidates:
        node = _get(j, path, [])
        if isinstance(node, list):
            for item in node:
                if isinstance(item, dict):
                    for k in url_keys:
                        u = item.get(k)
                        if u and u not in urls:
                            urls.append(u)
                            if len(urls) >= limit:
                                return urls
    return urls[:limit]

def parse_menu(j: dict):
    # menu.items[]: {name, price, ...}
    items = _get(j, "menu.menus.items", [])
    menus = []
    if isinstance(items, list):
        for it in items:
            if not isinstance(it, dict):
                continue
            menus.append({
                "name": it.get("name"),
                "price": it.get("price"),
                "is_recommend": it.get("is_recommend"),
                "is_ai_mate": it.get("is_ai_mate"),
            })
    return menus


def parse_ai_summary(j: dict):
    # 제목: ai_mate.summary.title > ai_mate.bottom_sheet.title > bottom_sheet.title
    title = (
        _get(j, "ai_mate.summary.title")
        or _get(j, "ai_mate.bottom_sheet.title")
        or _get(j, "bottom_sheet.title")
    )

    # 요약문(긴 줄글): ai_mate.bottom_sheet.summary > bottom_sheet.summary > summary(문자열일 때만)
    summary_text = (
        _get(j, "ai_mate.bottom_sheet.summary")
        or _get(j, "bottom_sheet.summary")
        or (_get(j, "summary") if isinstance(_get(j, "summary"), str) else None)
    )

    return {"title": title, "summary": summary_text}


def parse_open_hours(j: dict):
    periods = _get(j, "open_hours.all.periods", [])
    hours = []
    if isinstance(periods, list):
        for p in periods:
            period_title = p.get("period_title")  # '기본 영업시간', '공휴일' 등
            for d in p.get("days", []):
                day = d.get("day_of_the_week")
                on  = d.get("on_days") or {}
                hours.append({
                    "period": period_title,
                    "day": day,
                    "open_close": on.get("start_end_time_desc"),  # "11:30 ~ 02:00"
                    "breaks": on.get("break_times_desc") or [],   # ["13:30 ~ 16:30 브레이크타임"]
                })
    return hours

def parse_wait_or_congestion(j: dict):
    # 명시 wait 필드가 없으면 visitor 블록을 그대로 보관 (후처리 규칙 합의 시 숫자화 가능)
    return j.get("visitor")

def parse_parking_and_reservation(j: dict):
    """
    주차 및 예약 가능 여부를 함께 반환
    """
    is_parking = _get(j, "place_add_info.facilities.is_parking")
    is_reservation = _get(j, "place_add_info.facilities.is_reservation")

    return is_parking, is_reservation


def parse_tags(j: dict):
    """ai_mate.blog_summaries + ai_mate.summary.contents + place_add_info.tags 추출"""
    tag_groups = []

    # ai_mate.blog_summaries 그대로
    ai_blog = _get(j, "ai_mate.blog_summaries") or _get(j, "blog_summaries")
    if isinstance(ai_blog, list):
        for group in ai_blog:
            if isinstance(group, dict) and group.get("keywords"):
                title = group.get("title")
                kws = group["keywords"]
                tag_groups.append({
                    "title": title,
                    "keywords": kws
                })

    # ai_mate.summary.contents (["단체석", "라이브밴드 공연", ...])
    ai_summary_kw = _get(j, "ai_mate.summary.contents")
    if isinstance(ai_summary_kw, list) and ai_summary_kw:
        tag_groups.append({
            "title": None,
            "keywords": ai_summary_kw
        })

    # place_add_info.tags (["점심식사", "회식장소", ...])
    place_tags = _get(j, "place_add_info.tags")
    if isinstance(place_tags, list) and place_tags:
        tag_groups.append({
            "title": None,
            "keywords": place_tags
        })

    return tag_groups

def enrich_from_json(kakao_id: str, j: dict) -> dict:
    rating, review_cnt, blog_review_cnt = parse_rating_and_reviews(j)
    photos             = pick_top_photos(j, limit=3)
    menus              = parse_menu(j)
    ai_summary_obj     = parse_ai_summary(j) 
    hours              = parse_open_hours(j)
    wait_congestion    = parse_wait_or_congestion(j)
    parking, reservation = parse_parking_and_reservation(j)
    tags_obj           = parse_tags(j)

    return {
        "KakaoID": kakao_id,
        "enrich_kakao_rating": rating,                             # 5점 만점
        "enrich_kakao_review_count": review_cnt,
        "enrich_blog_review_count": blog_review_cnt,
        "enrich_photos_top3": json.dumps(photos, ensure_ascii=False),
        "enrich_menu_json": json.dumps(menus, ensure_ascii=False),
        "enrich_ai_summary_json": json.dumps(ai_summary_obj, ensure_ascii=False),
        "enrich_opening_hours_json": json.dumps(hours, ensure_ascii=False),
        "enrich_wait_or_congestion_json": (
            json.dumps(wait_congestion, ensure_ascii=False) if wait_congestion else None
        ),
        "enrich_parking": parking,
        "enrich_reservation": reservation,
        "enrich_tags": json.dumps(tags_obj, ensure_ascii=False),
        "enrich_last_crawled_at": ts(),
        "updated_at": ts(),  # 기존 created_at 유지 가정
    }


# ===================== 메인 =====================
def main():
    base = pd.read_excel(INPUT_XLSX)

    if "KakaoID" not in base.columns:
        raise SystemExit("엑셀에 'KakaoID' 컬럼이 없습니다.")

    # 병합 에러 방지: dtype 통일 (문자열)
    base["KakaoID"] = base["KakaoID"].apply(
        lambda x: str(int(x)) if pd.notna(x) and str(x).strip() != "" else None
    )

    ids = [kid for kid in base["KakaoID"].dropna().tolist() if kid]
    if TEST_FIRST_ONLY and ids:
        ids = ids[:1]

    enriched_rows = []
    total = len(ids)
    for idx, kid in enumerate(ids, 1):
        j = fetch_detail_json(kid)
        if j:
            enriched_rows.append(enrich_from_json(kid, j))
        else:
            # 실패 시 최소 정보만 남김
            enriched_rows.append({
                "KakaoID": kid,
                "enrich_last_crawled_at": ts(),
                "updated_at": ts(),
            })

        # break # 테스트용

        if idx % 10 == 0 or idx == total:
            print(f"[INFO] processed {idx}/{total}")
        time.sleep(SLEEP_BETWEEN)

    extra = pd.DataFrame(enriched_rows)
    # extra 쪽도 dtype 통일
    if not extra.empty:
        extra["KakaoID"] = extra["KakaoID"].astype(str)

    out = base.merge(extra, on="KakaoID", how="left")
    out.to_excel(OUTPUT_XLSX, index=False)
    print(f"[DONE] Saved '{OUTPUT_XLSX}' rows={len(out)}")


if __name__ == "__main__":
    main()
