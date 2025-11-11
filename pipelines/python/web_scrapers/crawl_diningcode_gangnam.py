import re
import time
import hashlib
from pathlib import Path
from urllib.parse import urljoin

import pandas as pd
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

SEARCH_URL = "https://www.diningcode.com/list.dc?query=%EA%B0%95%EB%82%A8%EC%97%AD"
HEADLESS = False
MAX_ITEMS = 10
OUTPUT_XLSX = "gangnam_top10.xlsx"

# ---------------------- 공통 유틸 ----------------------
def make_driver():
    opts = Options()
    if HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1440,2400")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    service = ChromeService(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=opts)

def get_html(driver, url, sleep_sec=1.0):
    driver.get(url)
    time.sleep(sleep_sec)
    return driver.page_source

def get_search_links(driver):
    # 검색 페이지 하단까지 스크롤해 컨텐츠 로드 유도
    driver.get(SEARCH_URL)
    for _ in range(8):
        driver.execute_script("window.scrollBy(0, 1200);")
        time.sleep(0.7)
    html = driver.page_source
    soup = BeautifulSoup(html, "lxml")
    links = []
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if "profile.php?rid=" in href or "place.dc" in href:
            links.append(urljoin("https://www.diningcode.com/", href))
    # 중복 제거, 상위 MAX_ITEMS
    uniq, seen = [], set()
    for u in links:
        if u not in seen:
            uniq.append(u); seen.add(u)
    return uniq[:MAX_ITEMS]

def first_text(soup, selector):
    el = soup.select_one(selector)
    return el.get_text(" ", strip=True) if el else None

def all_texts(soup, selector):
    return [e.get_text(" ", strip=True) for e in soup.select(selector)]

def clean_commas(s):
    return re.sub(r"\s+", " ", s or "").strip()

def derive_place_id(detail_url, name, address):
    rid = None
    m = re.search(r"rid=([^&]+)", detail_url)
    if m: rid = m.group(1)
    if rid: return f"rid_{rid}"
    base = f"{name}|{address}|{detail_url}"
    return "hash_" + hashlib.md5(base.encode("utf-8")).hexdigest()[:16]

# ---------------------- 섹션/필드 파서 ----------------------
def extract_name(soup):
    # 보통 상세 타이틀은 h1
    return first_text(soup, "h1") or first_text(soup, "header h1")

def extract_rating_and_reviews(full_text_block):
    """
    상세 상단부 텍스트에서
    - 평점: 4.3 (62명의 평가) → 4.3
    - 리뷰 수: 괄호 안 숫자
    """
    if not full_text_block:
        return None, None
    m = re.search(r"(\d+(?:\.\d+)?)\s*\(\s*(\d+)\s*명의\s*평가\)", full_text_block)
    if m:
        return float(m.group(1)), int(m.group(2))
    # 백업: 숫자 1개라도 잡자
    m2 = re.search(r"\b(\d+(?:\.\d+)?)\b", full_text_block)
    rating = float(m2.group(1)) if m2 else None
    m3 = re.search(r"\(\s*(\d+)\s*명의\s*평가\)", full_text_block)
    reviews = int(m3.group(1)) if m3 else None
    return rating, reviews

def block_between_text(soup, start_token, end_tokens):
    """
    페이지 전역 텍스트에서 start_token 이후 ~ end_tokens(중 하나) 이전 구간을 블록으로 추출
    """
    t = soup.get_text("\n", strip=True)
    si = t.find(start_token)
    if si < 0:
        return None
    sub = t[si + len(start_token):]
    cut = len(sub)
    for et in end_tokens:
        ei = sub.find(et)
        if 0 <= ei < cut:
            cut = ei
    return sub[:cut].strip()

def extract_category_and_tags(soup, phone_text=None):
    """
    - 카테고리: 타이틀 인근의 '역삼역 / 부대찌개, 미나리' 라인에서 역 제외하고 조합
    - 태그: 전화 라인 이후 ~ 다음 섹션(예: 사진/영업시간) 이전 블록에서 해시태그/짧은 단어들 수집
    """
    full = soup.get_text("\n", strip=True)

    # 카테고리
    category = None
    # 역/업종 구문 라인을 탐색 (예: "역삼역 / 부대찌개, 미나리")
    cat_line = None
    m = re.search(r"[가-힣A-Za-z0-9]+역\s*/\s*([가-힣A-Za-z0-9 ,·]+)", full)
    if m:
        cat_line = m.group(1)
    if cat_line:
        parts = re.split(r"[,\u00B7·/]", cat_line)
        parts = [p.strip() for p in parts if p.strip()]
        if parts:
            category = ", ".join(parts)

    # 태그(키워드)
    keywords = None
    if phone_text and phone_text in full:
        blk = block_between_text(soup, phone_text, ["폐업신고", "사진", "영업시간", "메뉴정보", "지도보기"])
        if blk:
            # 해시태그/짧은 토큰 필터
            tokens = re.findall(r"(#?[가-힣A-Za-z][가-힣A-Za-z ]{0,12})", blk)
            clean = []
            bad = {"영업시간","라스트오더","브레이크타임","휴무","지도보기","메뉴정보","사진"}
            for w in tokens:
                w = w.strip("# ").strip()
                if len(w) >= 2 and w not in bad and not re.search(r"\d%|\d위|\d+명", w):
                    clean.append(w)
            # 중복 제거
            seen = set(); uniq = []
            for w in clean:
                if w not in seen:
                    uniq.append(w); seen.add(w)
            if uniq:
                keywords = ", ".join(uniq)

    return category, keywords

def extract_address_and_phone(soup):
    t = soup.get_text("\n", strip=True)
    # 주소: '서울특별시'부터 번지까지
    address = None
    m = re.search(r"(서울특별시.*?\d{1,4}(?:-\d+)?)", t)
    if m:
        address = clean_commas(m.group(1))
    phone = None
    m2 = re.search(r"(\d{2,3}-\d{3,4}-\d{4})", t)
    if m2:
        phone = m2.group(1)
    return address, phone

def extract_hours_rows(soup, place_id):
    """
    '영업시간' 섹션을 찾아 요일별로 펼침.
    '브레이크타임', '라스트오더', '휴무'도 함께 기록.
    """
    blk = block_between_text(soup, "영업시간", ["접기","사진","메뉴정보","지도보기","리뷰"])
    rows = []
    if not blk:
        return rows

    # 줄 단위
    lines = [ln.strip() for ln in re.split(r"[\r\n]+", blk) if ln.strip()]
    order = ["월","화","수","목","금","토","일"]

    def expand_days(s):
        if s in ("매일","연중무휴"):
            return order
        m = re.match(r"^([월화수목금토일])\s*[~\-]\s*([월화수목금토일])$", s)
        if m:
            a,b = m.group(1), m.group(2)
            ai,bi = order.index(a), order.index(b)
            return order[ai:bi+1] if ai<=bi else (order[ai:]+order[:bi+1])
        if s in order:
            return [s]
        # '토,일' 같은 콤마 나열
        if "," in s:
            parts = [x.strip() for x in s.split(",")]
            return [p for p in parts if p in order]
        return []

    for ln in lines:
        # 요일 + '영업시간/브레이크타임/라스트오더/휴무' 등
        # 예: "월~금 영업시간 11:00 - 21:00"
        m = re.match(r"^([월화수목금토일매일연중무휴,~\-]+)\s+(.*)$", ln)
        if not m:
            # '브레이크타임 15:00 - 17:00' 처럼 요일 생략 줄은 스킵
            continue
        daypart, rest = m.group(1), m.group(2)
        days = []
        for token in re.split(r"\s+", daypart):
            token = token.strip()
            if not token: 
                continue
            days.extend(expand_days(token))
        days = days or order  # 안전장치

        # 시간 범위들
        oc = re.findall(r"(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})", rest)
        label = None
        if "브레이크" in rest: label = "브레이크타임"
        elif "라스트오더" in rest or "라스트 오더" in rest: label = "라스트오더"
        elif "휴무" in rest: label = "휴무"

        if oc:
            for op,cl in oc:
                for d in days:
                    rows.append({"place_id":place_id,"day":d,"open":op,"close":cl,"note":label})
        else:
            # 휴무만 표시된 경우
            if label == "휴무":
                for d in days:
                    rows.append({"place_id":place_id,"day":d,"open":None,"close":None,"note":"휴무"})
    # 중복 제거
    out, seen = [], set()
    for r in rows:
        key = (r["place_id"], r["day"], r["open"], r["close"], r.get("note"))
        if key not in seen:
            out.append(r); seen.add(key)
    return out

def extract_images_all(soup, place_id):
    # 페이지의 모든 img 중 유효 URL 전부
    urls = []
    for img in soup.find_all("img"):
        src = (img.get("src") or "").strip()
        if src.startswith("http"):
            urls.append(src)
    # 중복 제거
    uniq, seen = [], set()
    for u in urls:
        if u not in seen:
            uniq.append(u); seen.add(u)
    return [{"place_id":place_id, "order":i+1, "image_url":u} for i,u in enumerate(uniq)]

def extract_menus_all(soup, place_id):
    """
    '메뉴정보' 섹션 헤더 이후의 텍스트를 통째로 받아,
    (메뉴명) 다음 줄에 (가격 'nn,nnn 원')이 오는 패턴을 모두 짝지어 수집
    """
    blk = block_between_text(soup, "메뉴정보", ["사진","리뷰","지도보기","주변"])
    if not blk:
        return []
    lines = [ln.strip() for ln in blk.splitlines() if ln.strip()]
    rows = []
    for i in range(len(lines)-1):
        name = lines[i]
        price_line = lines[i+1]
        # 가격 줄만 잡기
        pm = re.match(r"^([\d,]+)\s*원$", price_line)
        if not pm:
            continue
        # 메뉴명 라인은 너무 길거나 숫자%/순위/명 인원 같은 건 배제
        if len(name) > 40 or re.search(r"\d%|^\d위|\d+\s*명", name):
            continue
        price = pm.group(1).replace(",", "")
        rows.append({"place_id":place_id, "menu":name, "price":price})
    # 중복 제거
    out, seen = [], set()
    for r in rows:
        key = (r["place_id"], r["menu"], r["price"] or "")
        if key not in seen:
            out.append(r); seen.add(key)
    return out

# ---------------------- 메인 ----------------------
def main():
    driver = make_driver()
    places, hours, menus, images = [], [], [], []
    try:
        links = get_search_links(driver)
        if not links:
            print("[WARN] 검색 링크 0건")
            return

        for idx, url in enumerate(links, 1):
            html = get_html(driver, url, 1.0)
            soup = BeautifulSoup(html, "lxml")

            name = extract_name(soup)
            # 상단 블록에서 평점·리뷰수 추출
            # (제목 바로 다음 ~ 주소/지도보기 이전까지)
            upper_blk = block_between_text(soup, name or "", ["지도보기","서울","주소","메뉴정보","영업시간"]) if name else None
            rating, review_cnt = extract_rating_and_reviews(upper_blk or "")

            address, phone = extract_address_and_phone(soup)
            category, keywords = extract_category_and_tags(soup, phone_text=phone)

            place_id = derive_place_id(url, name, address)
            hours_rows = extract_hours_rows(soup, place_id)
            menu_rows  = extract_menus_all(soup, place_id)
            image_rows = extract_images_all(soup, place_id)

            places.append({
                "place_id": place_id,
                "name": name,
                "rating": rating,
                "review_count": review_cnt,
                "category": category,
                "keywords": keywords,
                "address": address,
                "phone": phone,
                "detail_url": url,
                "source": "DiningCode",
                "crawled_at": pd.Timestamp.utcnow().isoformat()
            })
            hours.extend(hours_rows)
            menus.extend(menu_rows)
            images.extend(image_rows)

            print(f"[{idx}/{len(links)}] {name or url} | imgs={len(image_rows)} menus={len(menu_rows)}")

    finally:
        driver.quit()

    # 저장
    with pd.ExcelWriter(OUTPUT_XLSX, engine="openpyxl") as w:
        pd.DataFrame(places, columns=[
            "place_id","name","rating","review_count","category","keywords",
            "address","phone","detail_url","source","crawled_at"
        ]).to_excel(w, sheet_name="places", index=False)
        pd.DataFrame(hours).to_excel(w, sheet_name="hours", index=False)
        pd.DataFrame(menus).to_excel(w, sheet_name="menus", index=False)
        pd.DataFrame(images).to_excel(w, sheet_name="images", index=False)

    print(f"[OK] Saved -> {Path(OUTPUT_XLSX).resolve()} (sheets: places, hours, menus, images)")

if __name__ == "__main__":
    main()
