"""검수(Validation) 관련 Pydantic 스키마"""
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from enum import Enum


class ValidationStatus(str, Enum):
    """검수 상태"""
    OK = "ok"           # 정상
    WARNING = "warning" # 경고 (일부 누락)
    ERROR = "error"     # 오류 (필수 항목 누락)


class ChapterValidationItem(BaseModel):
    """목차 검수 항목"""
    id: UUID
    title: str
    depth: int
    has_textbook_mapping: bool
    has_video_mapping: bool
    textbook_page: Optional[int]
    video_start_seconds: Optional[int]
    status: ValidationStatus
    message: Optional[str] = None

    class Config:
        from_attributes = True


class QuestionValidationItem(BaseModel):
    """문제 검수 항목"""
    id: UUID
    content: str
    has_textbook_mapping: bool
    textbook_page: Optional[int]
    status: ValidationStatus
    message: Optional[str] = None

    class Config:
        from_attributes = True


class ValidationSummary(BaseModel):
    """검수 요약"""
    total_chapters: int
    chapters_with_textbook: int
    chapters_with_video: int
    chapters_ok: int
    chapters_warning: int
    chapters_error: int
    
    total_questions: int
    questions_with_textbook: int
    questions_ok: int
    questions_warning: int


class ChapterValidationResult(BaseModel):
    """목차 검수 결과"""
    summary: ValidationSummary
    items: List[ChapterValidationItem]


class QuestionValidationResult(BaseModel):
    """문제 검수 결과"""
    summary: ValidationSummary
    items: List[QuestionValidationItem]


class FullValidationResult(BaseModel):
    """전체 검수 결과"""
    subject_id: UUID
    subject_name: str
    chapter_validation: ChapterValidationResult
    question_validation: QuestionValidationResult
    overall_status: ValidationStatus
    completion_percentage: float

