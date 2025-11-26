from pydantic import BaseModel, Field
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from datetime import datetime

if TYPE_CHECKING:
    from app.schemas.subject import SubjectResponse


# ===== 자격증 스키마 =====

class CertificateCreate(BaseModel):
    """자격증 생성 요청"""
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class CertificateUpdate(BaseModel):
    """자격증 수정 요청"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None


class CertificateResponse(BaseModel):
    """자격증 응답"""
    id: UUID
    name: str
    description: Optional[str]
    creator_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CertificateWithSubjects(CertificateResponse):
    """과목 목록을 포함한 자격증 응답"""
    subjects: List["SubjectResponse"] = []


# Forward reference 업데이트
from app.schemas.subject import SubjectResponse
CertificateWithSubjects.model_rebuild()

