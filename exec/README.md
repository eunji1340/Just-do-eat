# 🚀 **Just Do Eat — 포팅 매뉴얼 (Porting Manual)**

**Version: 1.0**

**Last Update: 2025-11-19**

**Environment: Ubuntu 22.04, Docker, Docker Compose, Nginx, Jenkins, Spring Boot 3.x, FastAPI, PostgreSQL, Redis**

---

# 📌 1. 개요 (Overview)

본 문서는 **Just Do Eat** 서비스를 로컬 및 서버 환경(Ubuntu 22.04)에서 실행하기 위한 전체 포팅 절차를 다룹니다.

구성 요소:

| 서비스 | 기술스택 | 설명 |
| --- | --- | --- |
| main-server | Spring Boot 3.3 + JDK 21 + Gradle | 핵심 API 서버 |
| ai-server | FastAPI + Python 3.10 | AI 추론 기능 담당 |
| front-server | React + Vite | 프론트엔드 |
| nginx | Reverse Proxy | SSL, 라우팅 |
| postgres | Postgres 15 + PostGIS | DB |
| redis | Redis 7 | 캐싱 및 토큰 |

모든 서비스는 Docker-compose 기반으로 관리됩니다.

---

# 📌 2. 서버 사양 및 기본 설정

## ✔ 2.1 서버 요구사항

- Ubuntu 22.04 LTS
- 최소 사양: **vCPU 2, RAM 4GB, Disk 40GB**
- 공개 포트: `80`, `443`, `22`

## ✔ 2.2 서버 초기 세팅

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip ufw

```

## ✔ 2.3 방화벽 설정

```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

// 포트 번호
// Jenkins : 9090:8081
// main-server : 8080:8080
// ai : 8000:8000
// postgreSQL : 5432:5432
// redis : 6379:6379
// prometheus : 9000:9000
// grafana : 9001:9001
// nginx : 80:80
```

---

# 📌 3. 필수 설치 요소

## ✔ 3.1 Docker 설치

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

```

## ✔ 3.2 Docker Compose 설치

```bash
sudo apt install -y docker-compose-plugin
docker compose version

```

---

# 📌 4. 프로젝트 다운로드

## ✔ 4.1 GitLab Clone

```bash
git clone https://lab.ssafy.com/s13-final/S13P31A701.git
cd S13P31A701/deploy

```

---

# 📌 5. 환경 변수 설정 (.env)

`deploy/.env` 파일 생성:

```
# POSTGRES
POSTGRES_DB=jde
POSTGRES_USER=jde
POSTGRES_PASSWORD=jde1234
POSTGRES_PORT=5432

# SPRING MAIN SERVER
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/jde
SPRING_DATASOURCE_USERNAME=jde
SPRING_DATASOURCE_PASSWORD=jde1234
SPRING_REDIS_HOST=redis
SPRING_REDIS_PORT=6379

# AI SERVER
AI_PORT=8000

# FRONT
VITE_API_BASE_URL=/api

# NGINX
DOMAIN=justdoeat.ai.kr

```

---

# 📌 6. Docker Compose 구조

`deploy/docker-compose.yml` (예시 기반):

```yaml
services:
  nginx:
    image: nginx:latest
    container_name: JDE-nginx
    build:
      context: ../../frontend02/frontend/JDE
      dockerfile: Dockerfile
    depends_on:
      - main-server
      - ai
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      # - ../../frontend02/frontend/JDE/dist:/usr/share/nginx/html
    networks:
      - JDE-network
    restart: always

  postgres:
    image: postgis/postgis:16-3.4
    container_name: JDE-postgres
    env_file:
      - .env
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      TZ: Asia/Seoul
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - /var/jenkins_home/workspace/back/back/compose-infra/postgres/init:/docker-entrypoint-initdb.d
    networks:
      - JDE-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    container_name: JDE-redis
    env_file:
      - .env
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - JDE-network
    restart: unless-stopped

  main-server:
    build:
      context: ./main-server
    container_name: JDE-main-server
    hostname: main-server
    env_file:
      - .env
    environment:
      SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL}
      SPRING_DATASOURCE_USERNAME: ${SPRING_DATASOURCE_USERNAME}
      SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
      SPRING_DATA_REDIS_HOST: ${REDIS_HOST}
      SPRING_DATA_REDIS_PORT: ${REDIS_PORT}
      SPRING_DATA_REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      ACCESS_TOKEN_EXPIRATION_TIME: ${ACCESS_TOKEN_EXPIRATION_TIME}
      REFRESH_TOKEN_EXPIRATION_TIME: ${REFRESH_TOKEN_EXPIRATION_TIME}
      FRONT_BASE_URL: ${FRONT_BASE_URL}
      KAKAO_API_KEY: ${KAKAO_API_KEY}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_health
      redis:
        condition: service_started
    networks:
      JDE-network:
        aliases:
          - main-server
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  ai:
    build:
      context: ../fastapi-score
    container_name: JDE-ai
    hostname: ai
    env_file:
      - .env
    environment:
      PYTHONUNBUFFERED=1
    command: ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    networks:
      JDE-network:
        aliases:
          - ai
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: JDE-prometheus
    ports:
      - "9000:9090"
    volumes:
      - /home/ubuntu/projects/S13P31A701/back/compose-infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.path=/prometheus
      - --web.console.libraries=/etc/prometheus/console_libraries
      - --web.console.templates=/etc/prometheus/consoles
      - --storage.tsdb.retention.time=24h
      - --web.enable-lifecycle
    networks:
      - JDE-network
    restart: unless-stopped
    depends_on:
      - main-server

  grafana:
    image: grafana/grafana:latest
    container_name: JDE-grafana
    ports:
      - "9001:3000"
    env_file:
      - .env
    environment:
      GF_SECURITY_ADMIN_USER: ${GF_SECURITY_ADMIN_USER}
      GF_SECURITY_ADMIN_PASSWORD: ${GF_SECURITY_ADMIN_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: ${GF_USERS_ALLOW_SIGN_UP}
    volumes:
      - grafana_data:/var/lib/grafana
      - /home/ubuntu/projects/S13P31A701/back/compose-infra/grafana/prod:/etc/grafana/provisioning
    networks:
      - JDE-network
    restart: unless-stopped
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  JDE-network:

```

---

# 📌 7. Nginx 설정

`deploy/nginx.conf`

```
server {
  listen 80;
  server_name justdoeat.ai.kr www.justdoeat.ai.kr;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name justdoeat.ai.kr www.justdoeat.ai.kr;

  ssl_certificate /etc/letsencrypt/live/justdoeat.ai.kr/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/justdoeat.ai.kr/privkey.pem;

  # React Frontend
  location / {
      root /usr/share/nginx/html;
      index index.html;
      try_files $uri /index.html;
  }

  # Backend Spring Boot
  location /api/ {
      proxy_pass http://main-server:8080/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
  }

  # AI FastAPI
  location /ai/ {
      proxy_pass http://ai-server:8000/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
  }
}

```

---

# 📌 8. SSL 발급

Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d justdoeat.ai.kr -d www.justdoeat.ai.kr

```

자동 갱신 확인:

```bash
sudo certbot renew --dry-run

```

---

# 📌 9. 서비스 실행

```bash
cd S13P31A701/deploy
docker compose up -d --build

```

상태 확인:

```bash
docker ps

```

---

# 📌 10. 주요 접속 경로

| 기능 | 주소 |
| --- | --- |
| Frontend | https://justdoeat.ai.kr |
| Backend Swagger | https://justdoeat.ai.kr/api/swagger-ui/index.html |
| AI Server Docs | https://justdoeat.ai.kr/ai/docs |
| DB | 내부 postgres |
| Jenkins | 별도 구성 시 http://IP:8080 |

---

# 📌 11. 로그 확인

### Spring Boot

```bash
docker logs -f main-server

```

### FastAPI

```bash
docker logs -f ai-server

```

### Nginx

```bash
docker logs -f nginx

```

---

# 📌 12. 배포(Production) 시나리오

### 1) Git pull

### 2) `docker compose down`

### 3) 신규 앱 build

### 4) `docker compose up -d --build`

### 5) 정상동작 확인

---

# 📌 13. 문제 해결(트러블슈팅)

### ❗ Swagger 401 발생

- Spring Security 설정에서 `/api/swagger-ui/**`, `/api/v3/api-docs/**` 허용 필요
- Nginx가 `/api` 루트로 라우팅해야 함

### ❗ 502 Bad Gateway

- main-server 컨테이너가 실행 중인지 확인
- Nginx proxy_pass 주소와 컨테이너 이름이 일치해야 함

### ❗ DB 연결 실패

- `.env`의 DB 정보
- `SPRING_DATASOURCE_URL` 점검

---

# 📌 14. 종료 명령

```bash
docker compose down

```

---

# 📌 15. 백업

```bash
docker exec postgres pg_dump -U jde jde > backup.sql

```

---

# .env

```
# PostgreSQL Database 설정
POSTGRES_ROOT_PASSWORD=${PASSWORD}
POSTGRES_DB=justdoeat
POSTGRES_USER=jde
POSTGRES_PASSWORD=${PASSWORD}

# Redis 설정
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${PASSWORD}

# AWS S3 설정 (로컬 개발용 더미 값)
AWS_S3_BUCKET=justdoeat-jde
AWS_REGION_STATIC=us-east-1
AWS_BASE_URL=https://justdoeat-jde.s3.amazonaws.com
AWS_CREDENTIALS_ACCESS_KEY=${YOUR_ACCESS_KEY}
AWS_CREDENTIALS_SECRET_KEY=${YOUR_SECRET_KEY}

# Spring Boot 애플리케이션 설정
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/justdoeat
SPRING_DATASOURCE_USERNAME=jde
SPRING_DATASOURCE_PASSWORD=${PASSWORD}
JWT_SECRET=qwerasdfzxcv123456789qwerasdfzxcv123456789qwerasdfzxcv123456789qwerasdfzxcv123456789qwerasdfzxcv123456789
ACCESS_TOKEN_EXPIRATION_TIME=9000
REFRESH_TOKEN_EXPIRATION_TIME=108000
FRONT_BASE_URL=https://www.justdoeat.ai.kr
KAKAO_API_KEY=${YOUR_KAKAO_KEY}

# Grafana 설정
GF_SECURITY_ADMIN_USER=justdoeat
GF_SECURITY_ADMIN_PASSWOR=${PASSWORD}
GF_USERS_ALLOW_SIGN_UP=false
GF_INSTALL_PLUGINS=grafana-piechart-panel

# JVM 옵션
JAVA_OPTS=-Xmx512m -Xms256m -Dspring.profiles.active=prod

```