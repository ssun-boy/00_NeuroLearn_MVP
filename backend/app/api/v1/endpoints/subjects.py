from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.core.deps import get_session, get_current_active_user, get_current_creator
from app.models.user import User
from app.schemas.subject import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse,
    ProficiencyWeightCreate,
    ProficiencyWeightResponse,
    SubjectWithWeights
)
from app.schemas.auth import MessageResponse
from app.services.subject_service import SubjectService

router = APIRouter(prefix="/certificates/{certificate_id}/subjects", tags=["과목"])


@router.get("", response_model=List[SubjectResponse])
async def list_subjects(
    certificate_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    자격증의 과목 목록 조회 (제작자 전용)
    """
    service = SubjectService(session)
    return service.get_all_by_certificate(certificate_id, current_user.id)


@router.get("/public", response_model=List[SubjectResponse])
async def list_subjects_public(
    certificate_id: UUID,
    session: Session = Depends(get_session)
):
    """
    자격증의 과목 목록 조회 (공개)
    """
    service = SubjectService(session)
    return service.get_all_by_certificate_public(certificate_id)


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    certificate_id: UUID,
    data: SubjectCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    과목 생성 (제작자 전용)
    """
    service = SubjectService(session)
    return service.create(certificate_id, data, current_user.id)


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    certificate_id: UUID,
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    과목 상세 조회 (제작자 전용)
    """
    service = SubjectService(session)
    subject = service.get_by_id(subject_id, current_user.id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="과목을 찾을 수 없습니다"
        )
    return subject


@router.get("/{subject_id}/public", response_model=SubjectResponse)
async def get_subject_public(
    certificate_id: UUID,
    subject_id: UUID,
    session: Session = Depends(get_session)
):
    """
    과목 상세 조회 (공개)
    """
    service = SubjectService(session)
    subject = service.get_by_id_public(subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="과목을 찾을 수 없습니다"
        )
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    certificate_id: UUID,
    subject_id: UUID,
    data: SubjectUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    과목 수정 (제작자 전용)
    """
    service = SubjectService(session)
    return service.update(subject_id, data, current_user.id)


@router.delete("/{subject_id}", response_model=MessageResponse)
async def delete_subject(
    certificate_id: UUID,
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    과목 삭제 (제작자 전용)
    """
    service = SubjectService(session)
    service.delete(subject_id, current_user.id)
    return MessageResponse(message="과목이 삭제되었습니다")


@router.put("/reorder", response_model=List[SubjectResponse])
async def reorder_subjects(
    certificate_id: UUID,
    subject_ids: List[UUID],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    과목 순서 변경 (제작자 전용)
    """
    service = SubjectService(session)
    return service.reorder(certificate_id, subject_ids, current_user.id)


# ===== 숙련도 가중치 =====

@router.get("/{subject_id}/weights", response_model=List[ProficiencyWeightResponse])
async def get_proficiency_weights(
    certificate_id: UUID,
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    과목의 숙련도 가중치 조회 (제작자 전용)
    """
    service = SubjectService(session)
    return service.get_proficiency_weights(subject_id, current_user.id)


@router.get("/{subject_id}/weights/public", response_model=List[ProficiencyWeightResponse])
async def get_proficiency_weights_public(
    certificate_id: UUID,
    subject_id: UUID,
    session: Session = Depends(get_session)
):
    """
    과목의 숙련도 가중치 조회 (공개)
    """
    service = SubjectService(session)
    return service.get_proficiency_weights_public(subject_id)


@router.put("/{subject_id}/weights", response_model=ProficiencyWeightResponse)
async def update_proficiency_weight(
    certificate_id: UUID,
    subject_id: UUID,
    data: ProficiencyWeightCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    숙련도 가중치 수정 (제작자 전용)
    """
    service = SubjectService(session)
    return service.update_proficiency_weight(subject_id, data, current_user.id)


@router.put("/{subject_id}/weights/bulk", response_model=List[ProficiencyWeightResponse])
async def bulk_update_proficiency_weights(
    certificate_id: UUID,
    subject_id: UUID,
    weights: List[ProficiencyWeightCreate],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    숙련도 가중치 일괄 수정 (제작자 전용)
    """
    service = SubjectService(session)
    return service.bulk_update_proficiency_weights(subject_id, weights, current_user.id)

