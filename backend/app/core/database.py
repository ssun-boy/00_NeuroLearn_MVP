from sqlmodel import SQLModel, Session, create_engine
from typing import Generator
from app.core.config import settings

# SQLModel 엔진 생성
engine = create_engine(settings.DATABASE_URL, echo=True)


def init_db() -> None:
    """데이터베이스 테이블 생성"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """데이터베이스 세션 의존성"""
    with Session(engine) as session:
        yield session
