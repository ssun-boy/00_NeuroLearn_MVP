from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from app.models.user import UserRole


# 요청 스키마
class UserRegister(BaseModel):
    """회원가입 요청"""
    email: EmailStr
    password: str = Field(min_length=6, description="최소 6자 이상")
    name: str = Field(min_length=2, max_length=50)
    role: UserRole = UserRole.LEARNER


class UserLogin(BaseModel):
    """로그인 요청"""
    email: EmailStr
    password: str


# 응답 스키마
class UserResponse(BaseModel):
    """사용자 정보 응답"""
    id: UUID
    email: str
    name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """일반 메시지 응답"""
    message: str
