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

# CORS 설정 (개발 환경) - 모든 origin 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 origin 허용
    allow_credentials=False,  # allow_origins=["*"]일 때는 False
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
