# 레스토랑 데이터베이스 구축 - PowerShell 가이드

Docker 환경에서 PowerShell을 사용한 레스토랑 데이터베이스 구축 가이드입니다.

## 사전 요구사항

- Docker Desktop 실행 중
- PostgreSQL + PostGIS 컨테이너 실행 중 (`JDE-postgres-local`)
- PowerShell 5.1 이상

## 빠른 시작

### 1단계: 파일 준비

다음 파일들이 현재위치치에 있어야 합니다:

```
S13P31A701\back\db_script\
├── 00_schema.sql              # 스키마 정의
├── 01_staging.sql             # 스테이징 테이블
├── 02_merge.sql               # 데이터 병합 로직
├── restaurants.csv            # 원본 CSV 데이터
```

### 2단계: 전체 데이터베이스 구축

PowerShell에서 실행:

```powershell
# UTF-8
chcp 65001 > $null
$env:PGCLIENTENCODING = "UTF8"

cd C:\DEV\S13P31A701\back\db_script

# 1) SQL 파일을 컨테이너로 복사
docker cp 00_schema.sql  JDE-postgres-local:/tmp/00_schema.sql
docker cp 01_staging.sql JDE-postgres-local:/tmp/01_staging.sql
docker cp 02_merge.sql   JDE-postgres-local:/tmp/02_merge.sql

# 2) 스키마/스테이징 적용
docker exec JDE-postgres-local psql --set=ON_ERROR_STOP=1 --echo-errors --set=VERBOSITY=verbose -U justdoeat -d justdoeat -f /tmp/00_schema.sql
docker exec JDE-postgres-local psql --set=ON_ERROR_STOP=1 --echo-errors --set=VERBOSITY=verbose -U justdoeat -d justdoeat -f /tmp/01_staging.sql

# 3) CSV 복사 & 적재
docker cp restaurants.csv JDE-postgres-local:/tmp/restaurants.csv

docker exec JDE-postgres-local psql -U justdoeat -d justdoeat `
  --set=ON_ERROR_STOP=1 --echo-errors --set=VERBOSITY=verbose `
  -c "\copy staging_restaurant_raw from '/tmp/restaurants.csv' with (format csv, header true, encoding 'UTF8')"

# 4) 병합 실행
docker exec JDE-postgres-local psql --set=ON_ERROR_STOP=1 --echo-errors --set=VERBOSITY=verbose -U justdoeat -d justdoeat -f /tmp/02_merge.sql

# 5) 결과 확인
docker exec JDE-postgres-local psql -U justdoeat -d justdoeat `
  -c "SELECT COUNT(*) restaurant, (SELECT COUNT(*) FROM restaurant_hour) hours, (SELECT COUNT(*) FROM restaurant_tag) rtags FROM restaurant;"
```

이 스크립트는 자동으로 다음을 수행합니다:
1. ✅ 스키마 생성 (`00_schema.sql`)
2. ✅ 스테이징 테이블 준비 (`01_staging.sql`)
3. ✅ CSV 파일 Docker 컨테이너로 복사
4. ✅ CSV 데이터 로드
5. ✅ 데이터 병합 및 관계 설정 (`02_merge.sql`)
6. ✅ 최종 결과 출력

### 3단계: 데이터 검증

```powershell
.\run_validation.bat
```

다음 정보를 확인할 수 있습니다:
- 기본 통계 (테이블별 레코드 수)
- 카테고리별 분포
- 가격대별 분포
- 태그 분석
- 평점 상위 식당
- 데이터 품질 체크
- 지역별 분포

### 4단계: 쿼리 예제 실행

```powershell
.\run_queries.bat
```

대화형 메뉴에서 원하는 쿼리를 선택:
1. 거리 기반 검색 (강남역 반경 500m)
2. 복합 조건 검색 (일식 + 저~중가 + 평점 3.5+)
3. 태그 검색 (분위기: 고급스러운)
4. 여러 태그 조합 (데이트 + 뷰 좋은)
5. 현재 영업 중인 식당
6. 심야 영업 식당 (23시 이후)
7. 메뉴 검색 (예: 카츠)
8. 가격대별 평균 평점
9. 카테고리별 인기 태그 (일식)
10. 종합 추천 (거리+평점+리뷰)


## 데이터베이스 접속

직접 psql로 접속:

```powershell
docker exec -it JDE-postgres-local psql -U justdoeat -d justdoeat
```

## 문제 해결

### PostGIS 오류

```
ERROR: function st_makepoint(text, text) does not exist
```

**해결**: PostGIS 확장 설치

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### CSV 인코딩 문제

UTF-8 인코딩 확인:

```powershell
chcp 65001
$env:PGCLIENTENCODING = "UTF8"
```

## 스크립트 설명

### setup_database.ps1
- 전체 데이터베이스 구축 자동화
- 단계별 진행 상황 표시
- 오류 발생 시 중단
- 최종 통계 출력

### run_validation.ps1
- 8가지 검증 쿼리 실행
- 데이터 품질 확인
- 통계 및 분포 분석

### run_queries.ps1
- 10가지 실용 쿼리 예제
- 대화형 메뉴
- 개별 또는 전체 실행 가능


**작성일**: 2025-11-08  
**Docker 컨테이너**: JDE-postgres-local  
**데이터베이스**: justdoeat
