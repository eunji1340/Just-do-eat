# ---------- builder ----------
FROM node:20 AS builder
WORKDIR /app

# 1️⃣ package.json만 복사해서 의존성 캐시 최적화
COPY package*.json ./
RUN npm install

# 2️⃣ 실제 소스 복사 후 빌드
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# 3️⃣ Nginx 기본 html 삭제 후 빌드 결과물 복사
RUN rm -rf ./*
COPY --from=builder /app/dist .

# 4️⃣ Nginx 기본 설정 파일 대체 (필요시 수정 가능)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
