from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime


class Subject(SQLModel, table=True):
    __tablename__ = "subjects"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    certificate_id: UUID = Field(foreign_key="certificates.id", index=True)
    name: str = Field(index=True)
    description: str | None = Field(default=None)
    order_index: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SubjectProficiencyWeight(SQLModel, table=True):
    __tablename__ = "subject_proficiency_weights"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    subject_id: UUID = Field(foreign_key="subjects.id", index=True)
    proficiency_level: int = Field(ge=1, le=5)  # 1~5 레벨
    time_weight: float = Field(default=1.0)  # 시간 가중치

