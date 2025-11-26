from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException
from sqlmodel import Session

from app.core.deps import get_session, get_current_active_user
from app.models.user import User
from app.schemas.chapter import (
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
    ChapterMappingUpdate,
    ChapterVideoMappingUpdate,
    ChapterBulkCreate
)
from app.schemas.auth import MessageResponse
from app.services.chapter_service import ChapterService


router = APIRouter(
    prefix="/subjects/{subject_id}/chapters",
    tags=["목차"]
)


@router.get("", response_model=List[ChapterResponse])
async def list_chapters(
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    과목의 목차 목록 조회 (flat)
    """
    service = ChapterService(session)
    return service.get_all_by_subject(subject_id, current_user.id)


@router.get("/tree")
async def get_chapter_tree(
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    과목의 목차를 트리 구조로 조회
    """
    service = ChapterService(session)
    return service.get_tree_by_subject(subject_id, current_user.id)


@router.post("", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    subject_id: UUID,
    data: ChapterCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    목차 생성
    """
    service = ChapterService(session)
    return service.create(subject_id, data, current_user.id)


@router.post("/bulk", response_model=List[ChapterResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_chapters(
    subject_id: UUID,
    data: ChapterBulkCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    목차 일괄 생성
    """
    service = ChapterService(session)
    return service.bulk_create(subject_id, data.chapters, current_user.id)


@router.get("/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(
    subject_id: UUID,
    chapter_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    목차 상세 조회
    """
    service = ChapterService(session)
    chapter = service.get_by_id(chapter_id, current_user.id)
    if not chapter:
        raise HTTPException(status_code=404, detail="목차를 찾을 수 없습니다")
    return chapter


@router.put("/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    subject_id: UUID,
    chapter_id: UUID,
    data: ChapterUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    목차 수정
    """
    service = ChapterService(session)
    return service.update(chapter_id, data, current_user.id)


@router.delete("/{chapter_id}", response_model=MessageResponse)
async def delete_chapter(
    subject_id: UUID,
    chapter_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    목차 삭제 (하위 목차 포함)
    """
    service = ChapterService(session)
    service.delete(chapter_id, current_user.id)
    return MessageResponse(message="목차가 삭제되었습니다")


@router.patch("/{chapter_id}/textbook-mapping", response_model=ChapterResponse)
async def update_textbook_mapping(
    subject_id: UUID,
    chapter_id: UUID,
    data: ChapterMappingUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    목차-교재 페이지 매핑 수정
    """
    service = ChapterService(session)
    return service.update_textbook_mapping(chapter_id, data, current_user.id)


@router.patch("/{chapter_id}/video-mapping", response_model=ChapterResponse)
async def update_video_mapping(
    subject_id: UUID,
    chapter_id: UUID,
    data: ChapterVideoMappingUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    목차-영상 매핑 수정
    """
    service = ChapterService(session)
    return service.update_video_mapping(chapter_id, data, current_user.id)

