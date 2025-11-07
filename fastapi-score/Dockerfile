FROM python:3.11-slim

WORKDIR /app

# 필수 빌드 도구 설치 (필요 시)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 의존성 복사 및 설치 (캐시 최적화)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 복사
COPY . .

EXPOSE 8000

# healthcheck 추가 (선택)
HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1

# 실제 앱 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
