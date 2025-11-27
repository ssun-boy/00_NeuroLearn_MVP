from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSON
from uuid import UUID, uuid4
from datetime import datetime
from typing import Any


class Question(SQLModel, table=True):
    __tablename__ = "questions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    subject_id: UUID = Field(foreign_key="subjects.id", index=True)
    chapter_id: UUID | None = Field(default=None, foreign_key="chapters.id", index=True)
    
    content: str  # 문제 내용
    options: dict[str, Any] = Field(default={}, sa_column=Column(JSON))  # JSON 형태의 선택지
    correct_answer: str  # 정답 (인덱스를 문자열로 저장)
    explanation: str | None = Field(default=None)  # 해설
    
    # 교재 매핑
    textbook_page: int | None = Field(default=None)
    order_index: int = Field(default=0)  # 정렬 순서
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

