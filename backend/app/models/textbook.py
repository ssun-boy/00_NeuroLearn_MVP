from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime


class Textbook(SQLModel, table=True):
    __tablename__ = "textbooks"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    subject_id: UUID = Field(foreign_key="subjects.id", index=True)
    title: str
    file_url: str
    total_pages: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

