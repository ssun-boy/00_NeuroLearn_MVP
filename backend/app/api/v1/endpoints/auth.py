from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.core.deps import get_session, get_current_active_user
from app.core.security import create_access_token
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    MessageResponse
)
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    session: Session = Depends(get_session)
):
    """
    회원가입
    - 이메일, 비밀번호, 이름, 역할(creator/learner) 입력
    - 성공 시 JWT 토큰 반환
    """
    auth_service = AuthService(session)
    
    try:
        user = auth_service.create_user(user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    session: Session = Depends(get_session)
):
    """
    로그인
    - 이메일, 비밀번호 입력
    - 성공 시 JWT 토큰 반환
    """
    auth_service = AuthService(session)
    user = auth_service.authenticate_user(login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    현재 로그인한 사용자 정보 조회
    - Authorization: Bearer {token} 헤더 필요
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    로그아웃
    - 클라이언트에서 토큰 삭제 처리
    - 서버에서는 별도 처리 없음 (stateless JWT)
    """
    return MessageResponse(message="로그아웃되었습니다")
