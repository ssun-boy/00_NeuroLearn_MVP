from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# ===== 과목 스키마 =====

class SubjectCreate(BaseModel):
    """과목 생성 요청"""
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    order_index: int = 0


class SubjectUpdate(BaseModel):
    """과목 수정 요청"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    order_index: Optional[int] = None


class SubjectResponse(BaseModel):
    """과목 응답"""
    id: UUID
    certificate_id: UUID
    name: str
    description: Optional[str]
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


# ===== 숙련도 가중치 스키마 =====

class ProficiencyWeightCreate(BaseModel):
    """숙련도 가중치 생성/수정"""
    proficiency_level: int = Field(ge=1, le=5)  # 1~5
    time_weight: float = Field(gt=0)  # 양수만


class ProficiencyWeightResponse(BaseModel):
    """숙련도 가중치 응답"""
    id: UUID
    subject_id: UUID
    proficiency_level: int
    time_weight: float

    class Config:
        from_attributes = True


class SubjectWithWeights(SubjectResponse):
    """숙련도 가중치를 포함한 과목 응답"""
    proficiency_weights: List[ProficiencyWeightResponse] = []

