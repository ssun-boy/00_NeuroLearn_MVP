from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime


class Certificate(SQLModel, table=True):
    __tablename__ = "certificates"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True)
    description: str | None = Field(default=None)
    creator_id: UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

