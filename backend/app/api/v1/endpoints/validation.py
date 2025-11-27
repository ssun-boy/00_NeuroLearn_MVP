"""검수(Validation) API 엔드포인트"""
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.deps import get_session, get_current_active_user
from app.models.user import User
from app.services.validation_service import ValidationService

router = APIRouter(
    prefix="/subjects/{subject_id}/validation",
    tags=["검수"]
)


@router.get("")
async def get_full_validation(
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    전체 검수 결과 조회
    """
    service = ValidationService(session)
    return service.get_full_validation(subject_id, current_user.id)


@router.get("/chapters")
async def validate_chapters(
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    목차 검수 결과 조회
    """
    service = ValidationService(session)
    return service.validate_chapters(subject_id, current_user.id)


@router.get("/questions")
async def validate_questions(
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제 검수 결과 조회
    """
    service = ValidationService(session)
    return service.validate_questions(subject_id, current_user.id)

