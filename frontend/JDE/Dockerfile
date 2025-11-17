# ---------- builder ----------
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY .env .env.production
COPY . .
RUN npm run build  # Vite 기본 outDir = dist

# ---------- runtime ----------
FROM nginx:1.25-alpine

RUN rm -rf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*


COPY --from=builder /app/dist .         
COPY default.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]       
