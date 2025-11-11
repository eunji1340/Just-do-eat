# ---------- 1. Builder Stage (프론트엔드 빌드) ----------
FROM node:20 AS builder
WORKDIR /app

# 의존성 파일만 먼저 복사하여 캐시 활용도를 높입니다.
COPY package*.json ./
RUN npm install

# 모든 소스 복사 후 빌드 명령 실행
COPY . .
RUN npm run build 

# ---------- 2. Runtime Stage (Nginx 배포) ----------
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Nginx의 기본 웹 루트(/usr/share/nginx/html)를 비웁니다.


# 🚨 빌드 결과물 (dist 폴더의 내용)을 Nginx 웹 루트로 복사합니다.# S13P31A701/frontend/JDE/Dockerfile

# 🚨 1. Builder Stage를 제거합니다. Jenkins가 이미 빌드했습니다.
# FROM node:20 AS builder
# ... (builder stage 전체 삭제)

# ---------- 2. Runtime Stage (Nginx 배포) ----------
# Nginx 이미지를 사용하고, 바로 파일을 복사합니다.
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Nginx의 기본 웹 루트(/usr/share/nginx/html)를 비웁니다.
RUN rm -rf ./*
# RUN mkdir -p /usr/share/nginx/html # 디렉토리가 없으면 생성 (선택 사항)


# 🚨 2. 이 부분이 핵심: Jenkins 워크스페이스에서 빌드된 dist 폴더를 직접 복사합니다.
# Docker Compose Context는 frontend/JDE이므로, dist 폴더를 복사합니다.
# Jenkinsfile의 'Build Frontend' 단계에서 dist가 생성되었음을 가정
COPY dist . 

# 🚨 3. Nginx 설정 파일을 컨테이너 내부로 복사합니다. (default.conf는 frontend/JDE에 있어야 함)
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]# 이 COPY 명령이 'docker cp'와 'volume mount'를 대체하며 오류를 해결합니다.
COPY --from=builder /app/dist .

# 🚨 Nginx 설정 파일을 컨테이너 내부로 복사합니다.
# 이 설정 파일은 Dockerfile과 같은 레벨(frontend/JDE)에 있어야 합니다.
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]