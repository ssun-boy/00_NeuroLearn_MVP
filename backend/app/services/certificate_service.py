from typing import List, Optional, Tuple
from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException, status
from datetime import datetime

from app.models.certificate import Certificate
from app.models.subject import Subject
from app.schemas.certificate import CertificateCreate, CertificateUpdate


class CertificateService:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_creator(self, creator_id: UUID) -> List[Certificate]:
        """제작자의 모든 자격증 조회"""
        statement = select(Certificate).where(Certificate.creator_id == creator_id)
        return list(self.session.exec(statement).all())

    def get_by_id(self, certificate_id: UUID, creator_id: UUID) -> Optional[Certificate]:
        """자격증 ID로 조회 (소유권 확인)"""
        statement = select(Certificate).where(
            Certificate.id == certificate_id,
            Certificate.creator_id == creator_id
        )
        return self.session.exec(statement).first()

    def get_by_id_public(self, certificate_id: UUID) -> Optional[Certificate]:
        """자격증 ID로 조회 (공개)"""
        return self.session.get(Certificate, certificate_id)

    def create(self, data: CertificateCreate, creator_id: UUID) -> Certificate:
        """자격증 생성"""
        certificate = Certificate(
            name=data.name,
            description=data.description,
            creator_id=creator_id
        )
        self.session.add(certificate)
        self.session.commit()
        self.session.refresh(certificate)
        return certificate

    def update(self, certificate_id: UUID, data: CertificateUpdate, creator_id: UUID) -> Certificate:
        """자격증 수정"""
        certificate = self.get_by_id(certificate_id, creator_id)
        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="자격증을 찾을 수 없습니다"
            )
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(certificate, key, value)
        
        certificate.updated_at = datetime.utcnow()
        
        self.session.add(certificate)
        self.session.commit()
        self.session.refresh(certificate)
        return certificate

    def delete(self, certificate_id: UUID, creator_id: UUID) -> bool:
        """자격증 삭제"""
        certificate = self.get_by_id(certificate_id, creator_id)
        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="자격증을 찾을 수 없습니다"
            )
        
        self.session.delete(certificate)
        self.session.commit()
        return True

    def get_with_subjects(self, certificate_id: UUID, creator_id: UUID) -> Tuple[Certificate, List[Subject]]:
        """과목 목록을 포함한 자격증 조회"""
        certificate = self.get_by_id(certificate_id, creator_id)
        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="자격증을 찾을 수 없습니다"
            )
        
        # 과목 목록 조회
        statement = select(Subject).where(
            Subject.certificate_id == certificate_id
        ).order_by(Subject.order_index)
        subjects = list(self.session.exec(statement).all())
        
        return certificate, subjects

    def get_all_public(self) -> List[Certificate]:
        """모든 자격증 조회 (공개)"""
        statement = select(Certificate)
        return list(self.session.exec(statement).all())

