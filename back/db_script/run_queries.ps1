# ======================================================================
# 유용한 쿼리 예제 실행 스크립트 (Docker + PostgreSQL)
# ======================================================================

# UTF-8 설정
chcp 65001 > $null
$env:PGCLIENTENCODING = "UTF8"

# Docker 컨테이너 정보
$CONTAINER = "JDE-postgres-local"
$DB_USER = "justdoeat"
$DB_NAME = "justdoeat"

Write-Host "`n======================================================================"
Write-Host "           유용한 쿼리 예제"
Write-Host "======================================================================`n"

# 메뉴 표시
Write-Host "실행할 쿼리를 선택하세요:" -ForegroundColor Yellow
Write-Host "  1. 거리 기반 검색 (강남역 반경 500m)"
Write-Host "  2. 복합 조건 검색 (일식 + 저~중가 + 평점 3.5+)"
Write-Host "  3. 태그 검색 (분위기: 고급스러운)"
Write-Host "  4. 여러 태그 조합 (데이트 + 뷰 좋은)"
Write-Host "  5. 현재 영업 중인 식당"
Write-Host "  6. 심야 영업 식당 (23시 이후)"
Write-Host "  7. 메뉴 검색 (예: 카츠)"
Write-Host "  8. 가격대별 평균 평점"
Write-Host "  9. 카테고리별 인기 태그 (일식)"
Write-Host " 10. 종합 추천 (거리+평점+리뷰)"
Write-Host "  0. 모두 실행"
Write-Host ""

$choice = Read-Host "선택 (0-10)"

function Run-Query {
    param($number, $name, $query)
    
    Write-Host "`n======================================================================"
    Write-Host "[$number] $name"
    Write-Host "======================================================================`n" -ForegroundColor Cyan
    
    docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c $query
}

# 쿼리 정의
$queries = @{
    1 = @{
        Name = "거리 기반 검색 (강남역 반경 500m)"
        Query = @"
SELECT 
  r.name,
  r.category1,
  r.category2,
  r.kakao_rating,
  r.price_range,
  r.address,
  ROUND(ST_Distance(
    r.geom::geography,
    ST_SetSRID(ST_MakePoint(127.027610, 37.498095), 4326)::geography
  )::numeric, 0) AS distance_meters
FROM restaurant r
WHERE r.geom IS NOT NULL
  AND ST_DWithin(
    r.geom::geography,
    ST_SetSRID(ST_MakePoint(127.027610, 37.498095), 4326)::geography,
    500
  )
ORDER BY distance_meters
LIMIT 20;
"@
    }
    2 = @{
        Name = "복합 조건 검색 (일식 + 저~중가 + 평점 3.5+)"
        Query = @"
SELECT 
  r.name,
  r.category2,
  r.category3,
  r.kakao_rating,
  r.kakao_review_cnt,
  r.price_range,
  r.address,
  r.phone
FROM restaurant r
WHERE r.category1 = '음식점'
  AND r.category2 = '일식'
  AND r.price_range IN ('LOW', 'MEDIUM')
  AND r.kakao_rating >= 3.5
  AND r.kakao_review_cnt >= 10
ORDER BY r.kakao_rating DESC, r.kakao_review_cnt DESC
LIMIT 20;
"@
    }
    3 = @{
        Name = "태그 검색 (분위기: 고급스러운)"
        Query = @"
SELECT 
  r.name,
  r.category1,
  r.category2,
  r.kakao_rating,
  r.price_range,
  array_agg(DISTINCT t.name) AS tags
FROM restaurant r
JOIN restaurant_tag rt ON r.restaurant_id = rt.restaurant_id
JOIN tag t ON rt.tag_id = t.tag_id
WHERE EXISTS (
  SELECT 1 
  FROM restaurant_tag rt2
  JOIN tag t2 ON rt2.tag_id = t2.tag_id
  WHERE rt2.restaurant_id = r.restaurant_id
    AND t2.type = 'AMBIENCE'
    AND t2.name = '고급스러운'
)
GROUP BY r.restaurant_id, r.name, r.category1, r.category2, r.kakao_rating, r.price_range
ORDER BY r.kakao_rating DESC
LIMIT 20;
"@
    }
    4 = @{
        Name = "여러 태그 조합 (데이트 + 뷰 좋은)"
        Query = @"
SELECT 
  r.name,
  r.category1,
  r.category2,
  r.kakao_rating,
  r.price_range,
  r.address,
  array_agg(DISTINCT t.name ORDER BY t.name) AS matching_tags
FROM restaurant r
JOIN restaurant_tag rt ON r.restaurant_id = rt.restaurant_id
JOIN tag t ON rt.tag_id = t.tag_id
WHERE r.restaurant_id IN (
  SELECT rt1.restaurant_id
  FROM restaurant_tag rt1
  JOIN tag t1 ON rt1.tag_id = t1.tag_id
  WHERE t1.name = '데이트'
  
  INTERSECT
  
  SELECT rt2.restaurant_id
  FROM restaurant_tag rt2
  JOIN tag t2 ON rt2.tag_id = t2.tag_id
  WHERE t2.name LIKE '%뷰%'
)
GROUP BY r.restaurant_id, r.name, r.category1, r.category2, r.kakao_rating, r.price_range, r.address
ORDER BY r.kakao_rating DESC NULLS LAST
LIMIT 20;
"@
    }
    5 = @{
        Name = "현재 영업 중인 식당"
        Query = @"
SELECT 
  r.name,
  r.category1,
  r.category2,
  rh.`"open`",
  rh.`"close`",
  r.address,
  r.phone
FROM restaurant r
JOIN restaurant_hour rh ON r.restaurant_id = rh.restaurant_id
WHERE rh.dow = EXTRACT(ISODOW FROM CURRENT_TIMESTAMP)
  AND CURRENT_TIME BETWEEN rh.`"open`" AND rh.`"close`"
ORDER BY r.kakao_rating DESC NULLS LAST
LIMIT 20;
"@
    }
    6 = @{
        Name = "심야 영업 식당 (23시 이후)"
        Query = @"
SELECT 
  r.name,
  r.category1,
  r.category2,
  rh.`"open`",
  rh.`"close`",
  CASE rh.dow
    WHEN 1 THEN '월' WHEN 2 THEN '화' WHEN 3 THEN '수'
    WHEN 4 THEN '목' WHEN 5 THEN '금' WHEN 6 THEN '토' WHEN 7 THEN '일'
  END AS day,
  r.address
FROM restaurant r
JOIN restaurant_hour rh ON r.restaurant_id = rh.restaurant_id
WHERE rh.`"close`" >= TIME '23:00:00'
  OR rh.`"close`" < rh.`"open`"
ORDER BY r.name, rh.dow
LIMIT 30;
"@
    }
    7 = @{
        Name = "메뉴 검색 (예: 카츠)"
        Query = @"
SELECT 
  r.name,
  r.category1,
  r.category2,
  r.price_range,
  (
    SELECT jsonb_agg(menu_item->>'name')
    FROM jsonb_array_elements(r.menu) AS menu_item
    WHERE menu_item->>'name' LIKE '%카츠%'
  ) AS katsu_menu_items
FROM restaurant r
WHERE r.menu IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(r.menu) AS menu_item
    WHERE menu_item->>'name' LIKE '%카츠%'
  )
LIMIT 20;
"@
    }
    8 = @{
        Name = "가격대별 평균 평점 및 리뷰 수"
        Query = @"
SELECT 
  price_range,
  COUNT(*) AS restaurant_count,
  ROUND(AVG(kakao_rating), 2) AS avg_rating,
  ROUND(AVG(kakao_review_cnt), 0) AS avg_review_count,
  MIN(kakao_rating) AS min_rating,
  MAX(kakao_rating) AS max_rating
FROM restaurant
WHERE price_range IS NOT NULL 
  AND kakao_rating IS NOT NULL
GROUP BY price_range
ORDER BY 
  CASE price_range
    WHEN 'LOW' THEN 1
    WHEN 'MEDIUM' THEN 2
    WHEN 'HIGH' THEN 3
    WHEN 'PREMIUM' THEN 4
  END;
"@
    }
    9 = @{
        Name = "카테고리별 인기 태그 (일식)"
        Query = @"
SELECT 
  t.type,
  t.name AS tag_name,
  COUNT(*) AS usage_count,
  ROUND(AVG(rt.confidence), 2) AS avg_confidence
FROM restaurant r
JOIN restaurant_tag rt ON r.restaurant_id = rt.restaurant_id
JOIN tag t ON rt.tag_id = t.tag_id
WHERE r.category2 = '일식'
GROUP BY t.tag_id, t.type, t.name
ORDER BY usage_count DESC
LIMIT 10;
"@
    }
    10 = @{
        Name = "종합 추천 (거리+평점+리뷰) - 강남역 1km"
        Query = @"
WITH nearby AS (
  SELECT 
    r.restaurant_id,
    r.name,
    r.category1,
    r.category2,
    r.kakao_rating,
    r.kakao_review_cnt,
    r.price_range,
    r.address,
    ROUND(ST_Distance(
      r.geom::geography,
      ST_SetSRID(ST_MakePoint(127.027610, 37.498095), 4326)::geography
    )::numeric, 0) AS distance_meters
  FROM restaurant r
  WHERE r.geom IS NOT NULL
    AND ST_DWithin(
      r.geom::geography,
      ST_SetSRID(ST_MakePoint(127.027610, 37.498095), 4326)::geography,
      1000
    )
    AND r.kakao_rating IS NOT NULL
    AND r.kakao_review_cnt >= 5
)
SELECT 
  name,
  category1,
  category2,
  kakao_rating,
  kakao_review_cnt,
  price_range,
  distance_meters,
  ROUND(
    (kakao_rating / 5.0 * 0.4) +
    (LEAST(kakao_review_cnt, 100) / 100.0 * 0.3) +
    ((1000 - distance_meters) / 1000.0 * 0.3),
    3
  ) AS recommendation_score
FROM nearby
ORDER BY recommendation_score DESC
LIMIT 20;
"@
    }
}

# 쿼리 실행
if ($choice -eq "0") {
    # 모두 실행
    foreach ($key in 1..10) {
        Run-Query $key $queries[$key].Name $queries[$key].Query
        Start-Sleep -Seconds 1
    }
}
elseif ($queries.ContainsKey([int]$choice)) {
    Run-Query $choice $queries[[int]$choice].Name $queries[[int]$choice].Query
}
else {
    Write-Host "잘못된 선택입니다." -ForegroundColor Red
}

Write-Host "`n======================================================================"
Write-Host "           쿼리 실행 완료"
Write-Host "======================================================================`n"
