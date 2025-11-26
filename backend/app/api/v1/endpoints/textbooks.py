from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, status, HTTPException
from sqlmodel import Session

from app.core.deps import get_session, get_current_active_user
from app.models.user import User
from app.schemas.textbook import (
    TextbookCreate,
    TextbookUpdate,
    TextbookResponse,
    FileUploadResponse
)
from app.schemas.auth import MessageResponse
from app.services.textbook_service import TextbookService
from app.services.file_service import FileService


router = APIRouter(
    prefix="/subjects/{subject_id}/textbooks",
    tags=["교재"]
)


@router.get("", response_model=List[TextbookResponse])
async def list_textbooks(
    subject_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    과목의 교재 목록 조회
    """
    service = TextbookService(session)
    return service.get_all_by_subject(subject_id, current_user.id)


@router.post("/upload", response_model=FileUploadResponse)
async def upload_textbook_file(
    subject_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    교재 PDF 파일 업로드
    - 파일 업로드 후 file_url 반환
    - 이후 create 엔드포인트로 교재 정보 등록
    """
    result = await FileService.save_file(file, "textbooks")
    return FileUploadResponse(**result)


@router.post("", response_model=TextbookResponse, status_code=status.HTTP_201_CREATED)
async def create_textbook(
    subject_id: UUID,
    data: TextbookCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    교재 정보 등록 (파일 업로드 후)
    """
    service = TextbookService(session)
    return service.create(subject_id, data, current_user.id)


@router.get("/{textbook_id}", response_model=TextbookResponse)
async def get_textbook(
    subject_id: UUID,
    textbook_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    교재 상세 조회
    """
    service = TextbookService(session)
    textbook = service.get_by_id(textbook_id, current_user.id)
    if not textbook:
        raise HTTPException(status_code=404, detail="교재를 찾을 수 없습니다")
    return textbook


@router.put("/{textbook_id}", response_model=TextbookResponse)
async def update_textbook(
    subject_id: UUID,
    textbook_id: UUID,
    data: TextbookUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    교재 정보 수정
    """
    service = TextbookService(session)
    return service.update(textbook_id, data, current_user.id)


@router.delete("/{textbook_id}", response_model=MessageResponse)
async def delete_textbook(
    subject_id: UUID,
    textbook_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    교재 삭제
    """
    service = TextbookService(session)
    
    # 파일도 삭제
    textbook = service.get_by_id(textbook_id, current_user.id)
    if textbook:
        FileService.delete_file(textbook.file_url)
    
    service.delete(textbook_id, current_user.id)
    return MessageResponse(message="교재가 삭제되었습니다")

