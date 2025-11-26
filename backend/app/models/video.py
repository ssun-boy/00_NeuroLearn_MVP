from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime


class Video(SQLModel, table=True):
    __tablename__ = "videos"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    subject_id: UUID = Field(foreign_key="subjects.id", index=True)
    title: str
    url: str
    duration_seconds: int = Field(default=0)
    order_index: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

