# JUST DO EAT
<img width="320" height="360" alt="logo" src="https://github.com/user-attachments/assets/33042827-218b-4fb1-844a-2870e94e70e3" />


개인 & 모임을 위한 **AI 기반 외식 추천 서비스**

온보딩 기반 취향 분석부터 개인 맞춤 추천,
모임 약속 생성 및 최종 결정 도구(투표/토너먼트/룰렛)까지 제공하는 외식 추천 플랫폼입니다.
> 삼성 청년 SW 아카데미 13기 자율 프로젝트 <br /> 개발기간: 2025.10.10 ~ 2025.11.20

---

# 주요 기능

## 온보딩 (먹BTI + 빙고)

* 1분 이내로 취향을 빠르게 수집
* 먹BTI로 식습관·선호 유형 분석
* 빙고 입력으로 메뉴/속성 호불호 수집
* 이후 개인 추천에 즉시 반영

## 개인 맞춤 추천

* 스와이프, 저장, 숨김, 공유 등의 행동을 기반으로 추천 개선
* 태그 기반 취향, 자주 저장하는 카테고리, 최근 조회 패턴 등을 점수화
* 위치 기반 거리·영업 여부·가격대 필터 자동 적용

## 모임 & 약속 생성

* 모임을 만들고 초대 링크로 멤버를 추가
* 약속 생성 시 날짜/시간/위치/가격/비선호 정보를 입력
* 참여 멤버들의 취향을 반영해 “그룹 맞춤 추천” 제공

## 결정 도구

* **투표**: 멤버가 각자 원하는 식당 선택
* **토너먼트**: 1:1 대결 방식으로 빠르게 최종 한 곳 선택
* **룰렛**: 랜덤 방식으로 재미 요소 제공
* 선택 결과는 이후 추천에도 반영됨

## 방문/저장 기록

* 저장한 식당, 방문한 식당, 약속 기록 확인
* 행동 데이터 기반으로 더 정교한 추천 제공

---

# 🧱 시스템 아키텍처

<img width="1122" height="978" alt="image" src="https://github.com/user-attachments/assets/b8f553c5-7e32-4664-a5af-7a862201d34a" />


**구성 요소**
* Spring Boot: API 서버, 추천 후보 생성(Retrieval), 행동 로그 업데이트
* FastAPI: 개인/그룹 추천 점수 계산(Scoring)
* PostgreSQL + PostGIS: 식당 정보/위치/태그/사용자 상태 저장
* Redis: 개인 피드 캐싱 + 약속 후보 임시 저장
* S3: 이미지 저장
* GitHub Actions + AWS: 배포 자동화

---

# 🧠 추천 알고리즘

JUST DO EAT의 추천은 크게 **Retrieval → Scoring → Behavior Update** 구조로 이루어져 있습니다.

### 🔹 1. Retrieval (후보 생성)

* 현재 위치 또는 약속 반경 기준으로 **가능한 식당 후보들을 빠르게 조회**
* 가격대, 영업 여부, 비선호 카테고리 등 기본 필터 적용
* 개인 추천은 최대 반경 5km → 점진적 확장
* 모임 추천은 약속에서 정한 “중심 위치 + 반경” 우선 적용

### 🔹 2. Scoring (개인/그룹 점수 계산)

FastAPI에서 수행하며, 주로 다음을 반영합니다:

* 태그/카테고리 기반 취향
* 최근 행동(저장/숨김/조회 등)
* 선호도 업데이트(pref_score 등)
* 멤버들의 취향을 결합한 **그룹 점수 계산**
  

### 🔹 3. Behavior Update (행동 기반 선호도 업데이트)

Spring에서 관리하며:

* 저장·공유·방문 등은 강한 긍정 신호
* 숨김·스킵은 약한 부정 신호
* 사용자의 취향 점수(pref, tagScore 등)에 반영해
  **점점 더 개인화된 추천**이 나올 수 있도록 구성됨.

---

# 🗄️ ERD

<img width="4340" height="2022" alt="ERD" src="https://github.com/user-attachments/assets/e98316cf-29b1-434d-bece-0ba3d34579df" />


주요 도메인

* **식당(restaurant)** – 태그, 메뉴, 위치, 영업정보
* **사용자(user)** – 온보딩 결과, 선호도, 행동 상태
* **모임(group)**
* **약속(plan)** – 약속 조건(시간/위치/반경/가격대 등)
* **plan_candidate** – 추천 결과 저장
* **user_restaurant_state / user_tag_pref** – 개인화 핵심 테이블

---

# 🛠 기술 스택
# 🛠 Tech Stack

## 🟩 Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=React&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=TailwindCSS&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-764ABC?style=for-the-badge&logo=React&logoColor=white)
![ReactQuery](https://img.shields.io/badge/React%20Query-FF4154?style=for-the-badge&logo=ReactQuery&logoColor=white)
![FramerMotion](https://img.shields.io/badge/FramerMotion-0055FF?style=for-the-badge&logo=Framer&logoColor=white)
![ReactRouter](https://img.shields.io/badge/React%20Router-CA4245?style=for-the-badge&logo=ReactRouter&logoColor=white)
![KakaoMap](https://img.shields.io/badge/Kakao%20Map-FFCD00?style=for-the-badge&logo=Kakao&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=PWA&logoColor=white)

---

## 🟦 Backend (API Server)

![Java](https://img.shields.io/badge/Java_21-007396?style=for-the-badge&logo=OpenJDK&logoColor=white)
![SpringBoot](https://img.shields.io/badge/SpringBoot_3-6DB33F?style=for-the-badge&logo=SpringBoot&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSONWebTokens&logoColor=white)
![KakaoAPI](https://img.shields.io/badge/Kakao%20Local%20API-FFCD00?style=for-the-badge&logo=Kakao&logoColor=black)
![S3](https://img.shields.io/badge/AWS%20S3-569A31?style=for-the-badge&logo=AmazonS3&logoColor=white)

---

## 🟧 Recommender System (Scoring Layer)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=Python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=NumPy&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=Pandas&logoColor=white)
![LightGBM](https://img.shields.io/badge/LightGBM-02569B?style=for-the-badge&logo=Microsoft&logoColor=white)

---

## 🟨 Database & Storage

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=PostgreSQL&logoColor=white)
![PostGIS](https://img.shields.io/badge/PostGIS-6CA437?style=for-the-badge&logo=QGIS&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=Redis&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=AmazonS3&logoColor=white)

---

## 🟥 Infra / DevOps

![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=AmazonEC2&logoColor=white)
![AWS RDS](https://img.shields.io/badge/AWS_RDS-527FFF?style=for-the-badge&logo=AmazonRDS&logoColor=white)
![CloudFront](https://img.shields.io/badge/CloudFront-8C4FFF?style=for-the-badge&logo=AmazonAWS&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=Docker&logoColor=white)
![GitHubActions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=GitHubActions&logoColor=white)
![CloudWatch](https://img.shields.io/badge/CloudWatch-FF4F8B?style=for-the-badge&logo=AmazonAWS&logoColor=white)


---

# 👤 담당 역할


---

# 📦 프로젝트 실행 방법

```bash
# Backend(Spring)
cd backend
./gradlew bootRun

# Recommender(FastAPI)
cd recommender
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

