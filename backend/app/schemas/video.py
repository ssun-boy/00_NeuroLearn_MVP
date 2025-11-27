from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# ===== 영상 스키마 =====


class VideoCreate(BaseModel):
    """영상 생성 요청"""
    title: str = Field(min_length=1, max_length=200)
    url: str  # YouTube URL 또는 직접 업로드 URL
    duration_seconds: int = Field(gt=0)  # 영상 길이 (초)
    order_index: int = 0


class VideoUpdate(BaseModel):
    """영상 수정 요청"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    url: Optional[str] = None
    duration_seconds: Optional[int] = Field(None, gt=0)
    order_index: Optional[int] = None


class VideoResponse(BaseModel):
    """영상 응답"""
    id: UUID
    subject_id: UUID
    title: str
    url: str
    duration_seconds: int
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


class VideoBulkCreate(BaseModel):
    """영상 일괄 생성"""
    videos: List[VideoCreate]


# ===== 영상 매핑 관련 =====


class VideoMappingInfo(BaseModel):
    """영상 매핑 정보 (목차에서 사용)"""
    video_id: UUID
    video_title: str
    start_seconds: int
    

class ChapterWithVideoMapping(BaseModel):
    """영상 매핑 정보를 포함한 목차"""
    id: UUID
    title: str
    depth: int
    video_id: Optional[UUID]
    video_start_seconds: Optional[int]
    video_title: Optional[str] = None  # JOIN으로 가져올 때 사용

