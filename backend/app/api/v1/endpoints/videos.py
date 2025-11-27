from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException
from sqlmodel import Session

from app.core.deps import get_session, get_current_active_user
from app.models.user import User
from app.schemas.video import (
    VideoCreate,
    VideoUpdate,
    VideoResponse,
    VideoBulkCreate
)
from app.schemas.auth import MessageResponse
from app.services.video_service import VideoService

router = APIRouter(
    prefix="/subjects/{subject_id}/videos",
    tags=["영상"]
)


@router.get("", response_model=List[VideoResponse])
async def list_videos(
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    과목의 영상 목록 조회
    """
    service = VideoService(session)
    return service.get_all_by_subject(subject_id, current_user.id)


@router.post("", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def create_video(
    subject_id: UUID,
    data: VideoCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    영상 등록
    """
    service = VideoService(session)
    return service.create(subject_id, data, current_user.id)


@router.post("/bulk", response_model=List[VideoResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_videos(
    subject_id: UUID,
    data: VideoBulkCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    영상 일괄 등록
    """
    service = VideoService(session)
    return service.bulk_create(subject_id, data.videos, current_user.id)


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    subject_id: UUID,
    video_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    영상 상세 조회
    """
    service = VideoService(session)
    video = service.get_by_id(video_id, current_user.id)
    if not video:
        raise HTTPException(status_code=404, detail="영상을 찾을 수 없습니다")
    return video


@router.put("/{video_id}", response_model=VideoResponse)
async def update_video(
    subject_id: UUID,
    video_id: UUID,
    data: VideoUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    영상 수정
    """
    service = VideoService(session)
    return service.update(video_id, data, current_user.id)


@router.delete("/{video_id}", response_model=MessageResponse)
async def delete_video(
    subject_id: UUID,
    video_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    영상 삭제
    """
    service = VideoService(session)
    service.delete(video_id, current_user.id)
    return MessageResponse(message="영상이 삭제되었습니다")


@router.put("/reorder", response_model=List[VideoResponse])
async def reorder_videos(
    subject_id: UUID,
    video_ids: List[UUID],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    영상 순서 변경
    """
    service = VideoService(session)
    return service.reorder(subject_id, video_ids, current_user.id)

