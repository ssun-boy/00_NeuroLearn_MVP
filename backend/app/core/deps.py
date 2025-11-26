from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from uuid import UUID
from app.core.database import engine
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_session() -> Generator[Session, None, None]:
    """DB 세션 의존성"""
    with Session(engine) as session:
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    """현재 로그인한 사용자 조회"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    try:
        user = session.get(User, UUID(user_id))
    except (ValueError, Exception):
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """활성 상태인 현재 사용자"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다"
        )
    return current_user


async def get_current_creator(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """현재 사용자가 제작자인지 확인"""
    if current_user.role != "creator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="제작자 권한이 필요합니다"
        )
    return current_user


async def get_current_learner(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """현재 사용자가 학습자인지 확인"""
    if current_user.role != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="학습자 권한이 필요합니다"
        )
    return current_user

