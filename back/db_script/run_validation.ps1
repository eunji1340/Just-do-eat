# ======================================================================
# 데이터 검증 스크립트 (Docker + PostgreSQL)
# ======================================================================

# UTF-8 설정
chcp 65001 > $null
$env:PGCLIENTENCODING = "UTF8"

# Docker 컨테이너 정보
$CONTAINER = "JDE-postgres-local"
$DB_USER = "justdoeat"
$DB_NAME = "justdoeat"

Write-Host "`n======================================================================"
Write-Host "           데이터 검증 및 통계"
Write-Host "======================================================================`n"

# ======================================================================
# 1. 기본 통계
# ======================================================================
Write-Host "[1] 기본 통계" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  'restaurant' AS table_name,
  COUNT(*) AS total_records,
  COUNT(DISTINCT kakao_id) AS unique_kakao_ids,
  COUNT(CASE WHEN geom IS NOT NULL THEN 1 END) AS with_location,
  COUNT(CASE WHEN kakao_rating IS NOT NULL THEN 1 END) AS with_rating
FROM restaurant

UNION ALL

SELECT 
  'tag',
  COUNT(*),
  COUNT(DISTINCT type),
  COUNT(DISTINCT name),
  NULL
FROM tag

UNION ALL

SELECT 
  'restaurant_tag',
  COUNT(*),
  COUNT(DISTINCT restaurant_id),
  COUNT(DISTINCT tag_id),
  NULL
FROM restaurant_tag

UNION ALL

SELECT 
  'restaurant_hour',
  COUNT(*),
  COUNT(DISTINCT restaurant_id),
  COUNT(CASE WHEN is_holiday THEN 1 END),
  NULL
FROM restaurant_hour;
"@

# ======================================================================
# 2. 카테고리별 분포
# ======================================================================
Write-Host "`n[2] 카테고리별 식당 수 (Top 20)" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  category1,
  category2,
  COUNT(*) AS restaurant_count,
  ROUND(AVG(kakao_rating), 2) AS avg_rating,
  ROUND(AVG(kakao_review_cnt), 0) AS avg_reviews
FROM restaurant
WHERE category1 IS NOT NULL
GROUP BY category1, category2
ORDER BY restaurant_count DESC
LIMIT 20;
"@

# ======================================================================
# 3. 가격대별 분포
# ======================================================================
Write-Host "`n[3] 가격대별 식당 분포" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  price_range,
  COUNT(*) AS count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM restaurant
WHERE price_range IS NOT NULL
GROUP BY price_range
ORDER BY 
  CASE price_range
    WHEN 'LOW' THEN 1
    WHEN 'MEDIUM' THEN 2
    WHEN 'HIGH' THEN 3
    WHEN 'PREMIUM' THEN 4
  END;
"@

# ======================================================================
# 4. 태그 타입별 분포
# ======================================================================
Write-Host "`n[4] 태그 타입별 분포" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  type,
  COUNT(*) AS tag_count,
  COUNT(DISTINCT name) AS unique_names
FROM tag
GROUP BY type
ORDER BY tag_count DESC;
"@

# ======================================================================
# 5. 인기 태그 Top 20
# ======================================================================
Write-Host "`n[5] 가장 많이 사용된 태그 Top 20" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  t.type,
  t.name,
  COUNT(rt.restaurant_id) AS usage_count,
  ROUND(AVG(rt.confidence), 2) AS avg_confidence
FROM tag t
JOIN restaurant_tag rt ON t.tag_id = rt.tag_id
GROUP BY t.tag_id, t.type, t.name
ORDER BY usage_count DESC
LIMIT 20;
"@

# ======================================================================
# 6. 평점 상위 식당
# ======================================================================
Write-Host "`n[6] 평점 상위 식당 (리뷰 10개 이상)" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  name,
  category1,
  category2,
  kakao_rating,
  kakao_review_cnt,
  price_range,
  address
FROM restaurant
WHERE kakao_rating IS NOT NULL 
  AND kakao_review_cnt >= 10
ORDER BY kakao_rating DESC, kakao_review_cnt DESC
LIMIT 10;
"@

# ======================================================================
# 7. 데이터 품질 체크
# ======================================================================
Write-Host "`n[7] 데이터 품질 체크" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  '필수 필드 누락' AS check_type,
  COUNT(*) AS count
FROM restaurant
WHERE name IS NULL OR kakao_id IS NULL

UNION ALL

SELECT 
  '좌표 누락',
  COUNT(*)
FROM restaurant
WHERE geom IS NULL

UNION ALL

SELECT 
  '카테고리 누락',
  COUNT(*)
FROM restaurant
WHERE category1 IS NULL

UNION ALL

SELECT 
  '중복 KakaoID',
  COUNT(*) - COUNT(DISTINCT kakao_id)
FROM restaurant;
"@

# ======================================================================
# 8. 서울 구별 분포
# ======================================================================
Write-Host "`n[8] 서울 구별 식당 분포" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  CASE 
    WHEN address LIKE '%강남구%' THEN '강남구'
    WHEN address LIKE '%서초구%' THEN '서초구'
    WHEN address LIKE '%송파구%' THEN '송파구'
    WHEN address LIKE '%강동구%' THEN '강동구'
    WHEN address LIKE '%마포구%' THEN '마포구'
    WHEN address LIKE '%종로구%' THEN '종로구'
    WHEN address LIKE '%용산구%' THEN '용산구'
    WHEN address LIKE '%성동구%' THEN '성동구'
    WHEN address LIKE '%광진구%' THEN '광진구'
    WHEN address LIKE '%중구%' THEN '중구'
    ELSE '기타'
  END AS district,
  COUNT(*) AS restaurant_count
FROM restaurant
WHERE address IS NOT NULL
GROUP BY district
ORDER BY restaurant_count DESC
LIMIT 10;
"@

Write-Host "`n======================================================================"
Write-Host "           검증 완료"
Write-Host "======================================================================`n"
