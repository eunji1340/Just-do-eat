# app/main.py
# FastAPI 부트스트랩
# Author: Jang
# Date: 2025-10-29

import os
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.score import router as score_router
from app.logging_config import setup_logging

# 로깅 설정
log_level = os.getenv("LOG_LEVEL", "INFO")
log_file = os.getenv("LOG_FILE", None)
setup_logging(log_level=log_level, log_file=log_file)

# OMP_NUM_THREADS 설정 (예측 지연 완화)
omp_num_threads = os.getenv("OMP_NUM_THREADS", "2")
os.environ["OMP_NUM_THREADS"] = omp_num_threads
print(f"[Config] OMP_NUM_THREADS={omp_num_threads}")

def create_app() -> FastAPI:
    app = FastAPI(
        title="Eat MVP Scoring Engine",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        default_response_class=ORJSONResponse,  # orjson 사용 (성능 개선)
    )
    app.include_router(score_router)
    
    # Prometheus metrics 엔드포인트 추가
    instrumentator = Instrumentator()
    instrumentator.instrument(app).expose(app, endpoint="/metrics")
    
    # ML 모델 로드는 지연 로드 (첫 요청 시 로드)
    # 모듈 import 시점에 로드하면 모델 파일이 없을 때 서버가 시작되지 않음
    
    return app

# uvicorn이 참조할 실제 애플리케이션 인스턴스
app = create_app()
