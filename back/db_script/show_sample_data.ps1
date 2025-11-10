# ======================================================================
# 테이블 샘플 데이터 확인 스크립트 (Docker + PostgreSQL)
# ======================================================================

# UTF-8 설정
chcp 65001 > $null
$env:PGCLIENTENCODING = "UTF8"

# Docker 컨테이너 정보
$CONTAINER = "JDE-postgres-local"
$DB_USER = "justdoeat"
$DB_NAME = "justdoeat"

Write-Host "`n======================================================================"
Write-Host "           테이블 샘플 데이터 확인"
Write-Host "======================================================================`n"

# ======================================================================
# 1. restaurant 테이블 - 처음 3개 행
# ======================================================================
Write-Host "[1] restaurant 테이블 - 처음 3개 행" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT * FROM restaurant ORDER BY restaurant_id LIMIT 3;
"@

# ======================================================================
# 2. restaurant_hour 테이블 - 처음 10개 행
# ======================================================================
Write-Host "`n[2] restaurant_hour 테이블 - 처음 10개 행" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT * FROM restaurant_hour ORDER BY restaurant_hour_id LIMIT 10;
"@

# ======================================================================
# 3. tag 테이블 - 처음 10개 행
# ======================================================================
Write-Host "`n[3] tag 테이블 - 처음 10개 행" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT * FROM tag ORDER BY tag_id LIMIT 10;
"@

# ======================================================================
# 4. restaurant_tag 테이블 - 처음 10개 행
# ======================================================================
Write-Host "`n[4] restaurant_tag 테이블 - 처음 10개 행" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT * FROM restaurant_tag ORDER BY restaurant_id, tag_id LIMIT 10;
"@

# ======================================================================
# 5. 테이블별 총 레코드 수
# ======================================================================
Write-Host "`n[5] 테이블별 총 레코드 수" -ForegroundColor Cyan
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  'restaurant' AS table_name,
  COUNT(*) AS total_rows
FROM restaurant

UNION ALL

SELECT 
  'restaurant_hour',
  COUNT(*)
FROM restaurant_hour

UNION ALL

SELECT 
  'tag',
  COUNT(*)
FROM tag

UNION ALL

SELECT 
  'restaurant_tag',
  COUNT(*)
FROM restaurant_tag;
"@

# ======================================================================
# 6. 특정 식당의 전체 정보 (1번 식당)
# ======================================================================
Write-Host "`n[6] 특정 식당의 전체 정보 (restaurant_id = 1)" -ForegroundColor Cyan

Write-Host "`n  [6-1] 기본 정보" -ForegroundColor Gray
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  restaurant_id,
  kakao_id,
  name,
  address,
  phone,
  category1,
  category2,
  category3,
  kakao_rating,
  kakao_review_cnt,
  blog_review_cnt,
  price_range,
  is_parking,
  is_reservation
FROM restaurant
WHERE restaurant_id = 1;
"@

Write-Host "`n  [6-2] 영업시간" -ForegroundColor Gray
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  CASE dow
    WHEN 0 THEN '공휴일'
    WHEN 1 THEN '월' WHEN 2 THEN '화' WHEN 3 THEN '수'
    WHEN 4 THEN '목' WHEN 5 THEN '금' WHEN 6 THEN '토' WHEN 7 THEN '일'
  END AS day_name,
  \"open\",
  \"close\",
  break_open,
  break_close
FROM restaurant_hour
WHERE restaurant_id = 1
ORDER BY dow;
"@

Write-Host "`n  [6-3] 태그" -ForegroundColor Gray
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  t.type AS tag_type,
  t.name AS tag_name,
  rt.weight,
  rt.confidence
FROM restaurant_tag rt
JOIN tag t ON rt.tag_id = t.tag_id
WHERE rt.restaurant_id = 1
ORDER BY t.type, t.name;
"@

Write-Host "`n  [6-4] 메뉴 (JSONB)" -ForegroundColor Gray
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT 
  jsonb_pretty(menu) AS menu_items
FROM restaurant
WHERE restaurant_id = 1
  AND menu IS NOT NULL;
"@

Write-Host "`n======================================================================"
Write-Host "           샘플 데이터 확인 완료"
Write-Host "======================================================================`n"
