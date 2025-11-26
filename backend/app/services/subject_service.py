from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.models.subject import Subject, SubjectProficiencyWeight
from app.models.certificate import Certificate
from app.schemas.subject import SubjectCreate, SubjectUpdate, ProficiencyWeightCreate


class SubjectService:
    def __init__(self, session: Session):
        self.session = session

    def _verify_certificate_ownership(self, certificate_id: UUID, creator_id: UUID) -> Certificate:
        """자격증 소유권 확인"""
        statement = select(Certificate).where(
            Certificate.id == certificate_id,
            Certificate.creator_id == creator_id
        )
        certificate = self.session.exec(statement).first()
        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="자격증을 찾을 수 없습니다"
            )
        return certificate

    def get_all_by_certificate(self, certificate_id: UUID, creator_id: UUID) -> List[Subject]:
        """자격증의 모든 과목 조회"""
        self._verify_certificate_ownership(certificate_id, creator_id)
        
        statement = select(Subject).where(
            Subject.certificate_id == certificate_id
        ).order_by(Subject.order_index)
        return list(self.session.exec(statement).all())

    def get_all_by_certificate_public(self, certificate_id: UUID) -> List[Subject]:
        """자격증의 모든 과목 조회 (공개)"""
        statement = select(Subject).where(
            Subject.certificate_id == certificate_id
        ).order_by(Subject.order_index)
        return list(self.session.exec(statement).all())

    def get_by_id(self, subject_id: UUID, creator_id: UUID) -> Optional[Subject]:
        """과목 ID로 조회 (소유권 확인)"""
        statement = select(Subject).join(Certificate).where(
            Subject.id == subject_id,
            Certificate.creator_id == creator_id
        )
        return self.session.exec(statement).first()

    def get_by_id_public(self, subject_id: UUID) -> Optional[Subject]:
        """과목 ID로 조회 (공개)"""
        return self.session.get(Subject, subject_id)

    def create(self, certificate_id: UUID, data: SubjectCreate, creator_id: UUID) -> Subject:
        """과목 생성"""
        self._verify_certificate_ownership(certificate_id, creator_id)
        
        subject = Subject(
            certificate_id=certificate_id,
            name=data.name,
            description=data.description,
            order_index=data.order_index
        )
        self.session.add(subject)
        self.session.commit()
        self.session.refresh(subject)
        
        # 기본 숙련도 가중치 생성 (1~5)
        default_weights = [
            (1, 1.4),  # 초보자: 시간 1.4배
            (2, 1.2),  # 기초: 시간 1.2배
            (3, 1.0),  # 중급: 기본 시간
            (4, 0.8),  # 숙련: 시간 0.8배
            (5, 0.6)   # 전문가: 시간 0.6배
        ]
        for level, weight in default_weights:
            pw = SubjectProficiencyWeight(
                subject_id=subject.id,
                proficiency_level=level,
                time_weight=weight
            )
            self.session.add(pw)
        self.session.commit()
        
        return subject

    def update(self, subject_id: UUID, data: SubjectUpdate, creator_id: UUID) -> Subject:
        """과목 수정"""
        subject = self.get_by_id(subject_id, creator_id)
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="과목을 찾을 수 없습니다"
            )
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(subject, key, value)
        
        self.session.add(subject)
        self.session.commit()
        self.session.refresh(subject)
        return subject

    def delete(self, subject_id: UUID, creator_id: UUID) -> bool:
        """과목 삭제"""
        subject = self.get_by_id(subject_id, creator_id)
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="과목을 찾을 수 없습니다"
            )
        
        self.session.delete(subject)
        self.session.commit()
        return True

    def reorder(self, certificate_id: UUID, subject_ids: List[UUID], creator_id: UUID) -> List[Subject]:
        """과목 순서 변경"""
        self._verify_certificate_ownership(certificate_id, creator_id)
        
        subjects = []
        for index, subject_id in enumerate(subject_ids):
            subject = self.session.get(Subject, subject_id)
            if subject and subject.certificate_id == certificate_id:
                subject.order_index = index
                self.session.add(subject)
                subjects.append(subject)
        
        self.session.commit()
        return subjects

    # ===== 숙련도 가중치 =====
    
    def get_proficiency_weights(self, subject_id: UUID, creator_id: UUID) -> List[SubjectProficiencyWeight]:
        """과목의 숙련도 가중치 조회"""
        subject = self.get_by_id(subject_id, creator_id)
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="과목을 찾을 수 없습니다"
            )
        
        statement = select(SubjectProficiencyWeight).where(
            SubjectProficiencyWeight.subject_id == subject_id
        ).order_by(SubjectProficiencyWeight.proficiency_level)
        return list(self.session.exec(statement).all())

    def get_proficiency_weights_public(self, subject_id: UUID) -> List[SubjectProficiencyWeight]:
        """과목의 숙련도 가중치 조회 (공개)"""
        statement = select(SubjectProficiencyWeight).where(
            SubjectProficiencyWeight.subject_id == subject_id
        ).order_by(SubjectProficiencyWeight.proficiency_level)
        return list(self.session.exec(statement).all())

    def update_proficiency_weight(
        self, 
        subject_id: UUID, 
        data: ProficiencyWeightCreate, 
        creator_id: UUID
    ) -> SubjectProficiencyWeight:
        """숙련도 가중치 수정"""
        subject = self.get_by_id(subject_id, creator_id)
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="과목을 찾을 수 없습니다"
            )
        
        statement = select(SubjectProficiencyWeight).where(
            SubjectProficiencyWeight.subject_id == subject_id,
            SubjectProficiencyWeight.proficiency_level == data.proficiency_level
        )
        weight = self.session.exec(statement).first()
        
        if weight:
            weight.time_weight = data.time_weight
        else:
            weight = SubjectProficiencyWeight(
                subject_id=subject_id,
                proficiency_level=data.proficiency_level,
                time_weight=data.time_weight
            )
            self.session.add(weight)
        
        self.session.commit()
        self.session.refresh(weight)
        return weight

    def bulk_update_proficiency_weights(
        self,
        subject_id: UUID,
        weights: List[ProficiencyWeightCreate],
        creator_id: UUID
    ) -> List[SubjectProficiencyWeight]:
        """숙련도 가중치 일괄 수정"""
        subject = self.get_by_id(subject_id, creator_id)
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="과목을 찾을 수 없습니다"
            )
        
        updated_weights = []
        for data in weights:
            statement = select(SubjectProficiencyWeight).where(
                SubjectProficiencyWeight.subject_id == subject_id,
                SubjectProficiencyWeight.proficiency_level == data.proficiency_level
            )
            weight = self.session.exec(statement).first()
            
            if weight:
                weight.time_weight = data.time_weight
            else:
                weight = SubjectProficiencyWeight(
                    subject_id=subject_id,
                    proficiency_level=data.proficiency_level,
                    time_weight=data.time_weight
                )
                self.session.add(weight)
            
            updated_weights.append(weight)
        
        self.session.commit()
        for w in updated_weights:
            self.session.refresh(w)
        
        return updated_weights

