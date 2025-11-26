from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.core.deps import get_session, get_current_active_user, get_current_creator
from app.models.user import User
from app.schemas.certificate import (
    CertificateCreate,
    CertificateUpdate,
    CertificateResponse,
    CertificateWithSubjects
)
from app.schemas.subject import SubjectResponse
from app.schemas.auth import MessageResponse
from app.services.certificate_service import CertificateService

router = APIRouter(prefix="/certificates", tags=["자격증"])


@router.get("", response_model=List[CertificateResponse])
async def list_certificates(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    내 자격증 목록 조회 (제작자 전용)
    """
    service = CertificateService(session)
    return service.get_all_by_creator(current_user.id)


@router.post("", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
async def create_certificate(
    data: CertificateCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    자격증 생성 (제작자 전용)
    """
    service = CertificateService(session)
    return service.create(data, current_user.id)


@router.get("/public", response_model=List[CertificateResponse])
async def list_public_certificates(
    session: Session = Depends(get_session)
):
    """
    모든 자격증 목록 조회 (공개)
    """
    service = CertificateService(session)
    return service.get_all_public()


@router.get("/{certificate_id}", response_model=CertificateResponse)
async def get_certificate(
    certificate_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    자격증 상세 조회 (제작자 전용)
    """
    service = CertificateService(session)
    certificate = service.get_by_id(certificate_id, current_user.id)
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="자격증을 찾을 수 없습니다"
        )
    return certificate


@router.get("/{certificate_id}/public", response_model=CertificateResponse)
async def get_certificate_public(
    certificate_id: UUID,
    session: Session = Depends(get_session)
):
    """
    자격증 상세 조회 (공개)
    """
    service = CertificateService(session)
    certificate = service.get_by_id_public(certificate_id)
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="자격증을 찾을 수 없습니다"
        )
    return certificate


@router.get("/{certificate_id}/with-subjects")
async def get_certificate_with_subjects(
    certificate_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    과목 목록을 포함한 자격증 조회 (제작자 전용)
    """
    service = CertificateService(session)
    certificate, subjects = service.get_with_subjects(certificate_id, current_user.id)
    
    return {
        **CertificateResponse.model_validate(certificate).model_dump(),
        "subjects": [SubjectResponse.model_validate(s) for s in subjects]
    }


@router.put("/{certificate_id}", response_model=CertificateResponse)
async def update_certificate(
    certificate_id: UUID,
    data: CertificateUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    자격증 수정 (제작자 전용)
    """
    service = CertificateService(session)
    return service.update(certificate_id, data, current_user.id)


@router.delete("/{certificate_id}", response_model=MessageResponse)
async def delete_certificate(
    certificate_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_creator)
):
    """
    자격증 삭제 (제작자 전용)
    """
    service = CertificateService(session)
    service.delete(certificate_id, current_user.id)
    return MessageResponse(message="자격증이 삭제되었습니다")

