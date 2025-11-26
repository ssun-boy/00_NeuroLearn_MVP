from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Set
import os


class Settings(BaseSettings):
    """애플리케이션 설정"""
    DATABASE_URL: str = "postgresql+psycopg://postgres:password@localhost:5432/neurolearn"
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # 파일 업로드 설정
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: Set[str] = {"pdf", "png", "jpg", "jpeg"}

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """설정 인스턴스를 캐시하여 반환"""
    return Settings()


settings = get_settings()

# 업로드 디렉토리 생성
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{settings.UPLOAD_DIR}/textbooks", exist_ok=True)
os.makedirs(f"{settings.UPLOAD_DIR}/videos", exist_ok=True)
