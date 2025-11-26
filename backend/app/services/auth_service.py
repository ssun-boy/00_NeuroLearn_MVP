from typing import Optional
from sqlmodel import Session, select
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister
from app.core.security import get_password_hash, verify_password


class AuthService:
    def __init__(self, session: Session):
        self.session = session
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자 조회"""
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """ID로 사용자 조회"""
        from uuid import UUID
        try:
            return self.session.get(User, UUID(user_id))
        except (ValueError, Exception):
            return None
    
    def create_user(self, user_data: UserRegister) -> User:
        """새 사용자 생성"""
        # 이메일 중복 확인
        existing_user = self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError("이미 등록된 이메일입니다")
        
        # 사용자 생성
        user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            name=user_data.name,
            role=user_data.role
        )
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        
        return user
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """사용자 인증 (로그인)"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user
    
    def update_user(self, user: User, **kwargs) -> User:
        """사용자 정보 수정"""
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        
        return user
    
    def deactivate_user(self, user: User) -> User:
        """사용자 비활성화"""
        user.is_active = False
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

