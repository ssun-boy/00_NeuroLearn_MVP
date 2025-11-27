from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1 import api_router
from app.core.config import settings
import os

app = FastAPI(
    title="NeuroLearn API",
    description="자격증 학습 플랫폼 API",
    version="0.1.0"
)

# CORS 설정 (개발 환경) - 미들웨어는 먼저 추가해야 함
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# 정적 파일 서빙 (업로드된 파일)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# API 라우터 등록
app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "NeuroLearn API"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
