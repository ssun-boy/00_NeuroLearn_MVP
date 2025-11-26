from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime


class Chapter(SQLModel, table=True):
    __tablename__ = "chapters"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    subject_id: UUID = Field(foreign_key="subjects.id", index=True)
    parent_id: UUID | None = Field(default=None, foreign_key="chapters.id", index=True)
    title: str
    order_index: int = Field(default=0)
    depth: int = Field(default=0)  # 0=장, 1=절, 2=소단원
    
    # 교재 매핑
    textbook_page: int | None = Field(default=None)
    
    # 영상 매핑
    video_id: UUID | None = Field(default=None, foreign_key="videos.id")
    video_start_seconds: int | None = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

