# ---------- builder ----------
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Vite 기본 outDir = dist

# ---------- runtime ----------
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
 # ✅ 단 한 번만 복사
COPY --from=builder /app/dist .         
COPY default.conf /etc/nginx/conf.d/default.conf
# ✅ CMD는 하나만
CMD ["nginx", "-g", "daemon off;"]       
