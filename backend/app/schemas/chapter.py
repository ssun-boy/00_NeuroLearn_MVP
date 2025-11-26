from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# ===== 목차 스키마 =====


class ChapterCreate(BaseModel):
    """목차 생성 요청"""
    title: str = Field(min_length=1, max_length=200)
    parent_id: Optional[UUID] = None  # 상위 목차 (없으면 최상위)
    order_index: int = 0


class ChapterUpdate(BaseModel):
    """목차 수정 요청"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    parent_id: Optional[UUID] = None
    order_index: Optional[int] = None


class ChapterResponse(BaseModel):
    """목차 응답"""
    id: UUID
    subject_id: UUID
    parent_id: Optional[UUID]
    title: str
    order_index: int
    depth: int  # 0=장, 1=절, 2=소단원
    textbook_page: Optional[int]
    video_id: Optional[UUID]
    video_start_seconds: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ChapterTreeNode(ChapterResponse):
    """트리 구조의 목차 노드"""
    children: List["ChapterTreeNode"] = []


# 순환 참조 해결
ChapterTreeNode.model_rebuild()


class ChapterMappingUpdate(BaseModel):
    """목차-교재 매핑 수정"""
    textbook_page: Optional[int] = None


class ChapterVideoMappingUpdate(BaseModel):
    """목차-영상 매핑 수정"""
    video_id: Optional[UUID] = None
    video_start_seconds: Optional[int] = None


class ChapterBulkCreate(BaseModel):
    """목차 일괄 생성 (엑셀 업로드용)"""
    chapters: List[ChapterCreate]


class ChapterMappingBulkItem(BaseModel):
    """일괄 매핑 항목"""
    chapter_id: UUID
    textbook_page: Optional[int] = None


class ChapterMappingBulkUpdate(BaseModel):
    """일괄 매핑 요청"""
    mappings: List[ChapterMappingBulkItem]

