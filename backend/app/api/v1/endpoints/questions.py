from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.core.deps import get_session, get_current_active_user
from app.models.user import User
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionBulkCreate,
    QuestionMappingUpdate,
    QuestionMappingBulkUpdate,
    QuestionStats
)
from app.schemas.auth import MessageResponse
from app.services.question_service import QuestionService


router = APIRouter(
    prefix="/subjects/{subject_id}/questions",
    tags=["문제"]
)


@router.get("", response_model=List[QuestionResponse])
async def list_questions(
    subject_id: UUID,
    mapped_only: Optional[bool] = Query(None, description="True: 매핑된 문제만, False: 미매핑만, None: 전체"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    과목의 문제 목록 조회
    """
    service = QuestionService(session)
    return service.get_all_by_subject(subject_id, current_user.id, mapped_only)


@router.get("/stats", response_model=QuestionStats)
async def get_question_stats(
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제 통계 조회
    """
    service = QuestionService(session)
    return service.get_stats(subject_id, current_user.id)


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    subject_id: UUID,
    data: QuestionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제 등록
    """
    service = QuestionService(session)
    return service.create(subject_id, data, current_user.id)


@router.post("/bulk", response_model=List[QuestionResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_questions(
    subject_id: UUID,
    data: QuestionBulkCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제 일괄 등록
    """
    service = QuestionService(session)
    return service.bulk_create(subject_id, data.questions, current_user.id)


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    subject_id: UUID,
    question_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제 상세 조회
    """
    service = QuestionService(session)
    question = service.get_by_id(question_id, current_user.id)
    if not question:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다")
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    subject_id: UUID,
    question_id: UUID,
    data: QuestionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제 수정
    """
    service = QuestionService(session)
    return service.update(question_id, data, current_user.id)


@router.delete("/{question_id}", response_model=MessageResponse)
async def delete_question(
    subject_id: UUID,
    question_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제 삭제
    """
    service = QuestionService(session)
    service.delete(question_id, current_user.id)
    return MessageResponse(message="문제가 삭제되었습니다")


@router.patch("/{question_id}/mapping", response_model=QuestionResponse)
async def update_question_mapping(
    subject_id: UUID,
    question_id: UUID,
    data: QuestionMappingUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제-교재 매핑 수정
    """
    service = QuestionService(session)
    return service.update_mapping(question_id, data, current_user.id)


@router.patch("/bulk-mapping")
async def bulk_update_question_mapping(
    subject_id: UUID,
    data: QuestionMappingBulkUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    문제-교재 매핑 일괄 수정
    """
    service = QuestionService(session)
    updated_count = service.bulk_update_mapping(
        subject_id,
        [m.model_dump() for m in data.mappings],
        current_user.id
    )
    return {"updated_count": updated_count}

