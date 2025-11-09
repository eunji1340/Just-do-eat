# app/main.py
# FastAPI 부트스트랩
# Author: Jang
# Date: 2025-10-29

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.score import router as score_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="Eat MVP Scoring Engine",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.include_router(score_router)
    
    # Prometheus metrics 엔드포인트 추가
    instrumentator = Instrumentator()
    instrumentator.instrument(app).expose(app, endpoint="/metrics")
    
    return app

# uvicorn이 참조할 실제 애플리케이션 인스턴스
app = create_app()
