from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.models.textbook import Textbook
from app.models.subject import Subject
from app.models.certificate import Certificate
from app.schemas.textbook import TextbookCreate, TextbookUpdate


class TextbookService:
    def __init__(self, session: Session):
        self.session = session

    def _verify_subject_ownership(self, subject_id: UUID, creator_id: UUID) -> Subject:
        """과목 소유권 확인"""
        statement = select(Subject).join(Certificate).where(
            Subject.id == subject_id,
            Certificate.creator_id == creator_id
        )
        subject = self.session.exec(statement).first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="과목을 찾을 수 없습니다"
            )
        return subject

    def get_all_by_subject(self, subject_id: UUID, creator_id: UUID) -> List[Textbook]:
        """과목의 모든 교재 조회"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        statement = select(Textbook).where(
            Textbook.subject_id == subject_id
        ).order_by(Textbook.created_at)
        return list(self.session.exec(statement).all())

    def get_by_id(self, textbook_id: UUID, creator_id: UUID) -> Optional[Textbook]:
        """교재 ID로 조회"""
        statement = select(Textbook).join(Subject).join(Certificate).where(
            Textbook.id == textbook_id,
            Certificate.creator_id == creator_id
        )
        return self.session.exec(statement).first()

    def create(self, subject_id: UUID, data: TextbookCreate, creator_id: UUID) -> Textbook:
        """교재 생성"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        textbook = Textbook(
            subject_id=subject_id,
            title=data.title,
            file_url=data.file_url,
            total_pages=data.total_pages
        )
        self.session.add(textbook)
        self.session.commit()
        self.session.refresh(textbook)
        return textbook

    def update(self, textbook_id: UUID, data: TextbookUpdate, creator_id: UUID) -> Textbook:
        """교재 수정"""
        textbook = self.get_by_id(textbook_id, creator_id)
        if not textbook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="교재를 찾을 수 없습니다"
            )
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(textbook, key, value)
        
        self.session.add(textbook)
        self.session.commit()
        self.session.refresh(textbook)
        return textbook

    def delete(self, textbook_id: UUID, creator_id: UUID) -> bool:
        """교재 삭제"""
        textbook = self.get_by_id(textbook_id, creator_id)
        if not textbook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="교재를 찾을 수 없습니다"
            )
        
        self.session.delete(textbook)
        self.session.commit()
        return True

