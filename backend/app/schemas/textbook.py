from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class TextbookCreate(BaseModel):
    """교재 생성 요청 (파일 업로드 후)"""
    title: str = Field(min_length=1, max_length=200)
    file_url: str
    total_pages: int = Field(gt=0)


class TextbookUpdate(BaseModel):
    """교재 수정 요청"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    total_pages: Optional[int] = Field(None, gt=0)


class TextbookResponse(BaseModel):
    """교재 응답"""
    id: UUID
    subject_id: UUID
    title: str
    file_url: str
    total_pages: int
    created_at: datetime

    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """파일 업로드 응답"""
    file_url: str
    file_name: str
    file_size: int

