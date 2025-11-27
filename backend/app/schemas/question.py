from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime


# ===== 문제 스키마 =====

class QuestionCreate(BaseModel):
    """문제 생성 요청"""
    content: str = Field(min_length=1)  # 문제 내용
    options: List[str] = Field(min_length=2, max_length=5)  # 보기 (2~5개)
    correct_answer: int = Field(ge=0)  # 정답 인덱스 (0부터 시작)
    explanation: Optional[str] = None  # 해설
    chapter_id: Optional[UUID] = None  # 연결된 목차
    textbook_page: Optional[int] = None  # 연결된 교재 페이지
    order_index: int = 0


class QuestionUpdate(BaseModel):
    """문제 수정 요청"""
    content: Optional[str] = Field(None, min_length=1)
    options: Optional[List[str]] = Field(None, min_length=2, max_length=5)
    correct_answer: Optional[int] = Field(None, ge=0)
    explanation: Optional[str] = None
    chapter_id: Optional[UUID] = None
    textbook_page: Optional[int] = None
    order_index: Optional[int] = None


class QuestionResponse(BaseModel):
    """문제 응답"""
    id: UUID
    subject_id: UUID
    content: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str]
    chapter_id: Optional[UUID]
    textbook_page: Optional[int]
    order_index: int
    created_at: datetime

    @model_validator(mode='before')
    @classmethod
    def convert_options_and_answer(cls, data: Any) -> Any:
        """Question 모델의 options와 correct_answer를 변환"""
        # SQLModel 객체인 경우 dict로 변환
        if hasattr(data, '__dict__'):
            data = data.__dict__
        
        if isinstance(data, dict):
            # options 변환: dict에서 리스트 추출
            if 'options' in data:
                options_value = data['options']
                if isinstance(options_value, dict):
                    # {"options": [...]} 형태에서 리스트 추출
                    if 'options' in options_value:
                        data['options'] = options_value['options']
                    else:
                        # 그냥 dict인 경우 빈 리스트로
                        data['options'] = []
                elif isinstance(options_value, list):
                    # 이미 리스트인 경우 그대로 사용
                    pass
                else:
                    # 다른 타입인 경우 빈 리스트로
                    data['options'] = []
            
            # correct_answer 변환: str에서 int로
            if 'correct_answer' in data:
                correct_answer_value = data['correct_answer']
                if isinstance(correct_answer_value, str):
                    try:
                        data['correct_answer'] = int(correct_answer_value)
                    except (ValueError, TypeError):
                        data['correct_answer'] = 0
        return data

    class Config:
        from_attributes = True


class QuestionBulkCreate(BaseModel):
    """문제 일괄 생성"""
    questions: List[QuestionCreate]


# ===== 문제-교재 매핑 =====

class QuestionMappingUpdate(BaseModel):
    """문제-교재 매핑 수정"""
    textbook_page: Optional[int] = None
    chapter_id: Optional[UUID] = None


class QuestionMappingBulkItem(BaseModel):
    """일괄 매핑 항목"""
    question_id: UUID
    textbook_page: Optional[int] = None
    chapter_id: Optional[UUID] = None


class QuestionMappingBulkUpdate(BaseModel):
    """일괄 매핑 요청"""
    mappings: List[QuestionMappingBulkItem]


# ===== 문제 통계 =====

class QuestionStats(BaseModel):
    """문제 통계"""
    total_count: int
    mapped_count: int  # 교재 매핑된 문제 수
    unmapped_count: int  # 매핑 안 된 문제 수

