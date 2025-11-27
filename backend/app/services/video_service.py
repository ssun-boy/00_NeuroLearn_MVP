from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.models.video import Video
from app.models.subject import Subject
from app.models.certificate import Certificate
from app.schemas.video import VideoCreate, VideoUpdate


class VideoService:
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

    def get_all_by_subject(self, subject_id: UUID, creator_id: UUID) -> List[Video]:
        """과목의 모든 영상 조회"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        statement = select(Video).where(
            Video.subject_id == subject_id
        ).order_by(Video.order_index)
        return list(self.session.exec(statement).all())

    def get_by_id(self, video_id: UUID, creator_id: UUID) -> Optional[Video]:
        """영상 ID로 조회"""
        statement = select(Video).join(Subject).join(Certificate).where(
            Video.id == video_id,
            Certificate.creator_id == creator_id
        )
        return self.session.exec(statement).first()

    def create(self, subject_id: UUID, data: VideoCreate, creator_id: UUID) -> Video:
        """영상 생성"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        video = Video(
            subject_id=subject_id,
            title=data.title,
            url=data.url,
            duration_seconds=data.duration_seconds,
            order_index=data.order_index
        )
        self.session.add(video)
        self.session.commit()
        self.session.refresh(video)
        return video

    def update(self, video_id: UUID, data: VideoUpdate, creator_id: UUID) -> Video:
        """영상 수정"""
        video = self.get_by_id(video_id, creator_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="영상을 찾을 수 없습니다"
            )
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(video, key, value)
        
        self.session.add(video)
        self.session.commit()
        self.session.refresh(video)
        return video

    def delete(self, video_id: UUID, creator_id: UUID) -> bool:
        """영상 삭제"""
        video = self.get_by_id(video_id, creator_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="영상을 찾을 수 없습니다"
            )
        
        self.session.delete(video)
        self.session.commit()
        return True

    def bulk_create(
        self, 
        subject_id: UUID, 
        videos_data: List[VideoCreate], 
        creator_id: UUID
    ) -> List[Video]:
        """영상 일괄 생성"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        created_videos = []
        for data in videos_data:
            video = Video(
                subject_id=subject_id,
                title=data.title,
                url=data.url,
                duration_seconds=data.duration_seconds,
                order_index=data.order_index
            )
            self.session.add(video)
            created_videos.append(video)
        
        self.session.commit()
        for video in created_videos:
            self.session.refresh(video)
        
        return created_videos

    def reorder(self, subject_id: UUID, video_ids: List[UUID], creator_id: UUID) -> List[Video]:
        """영상 순서 변경"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        videos = []
        for index, video_id in enumerate(video_ids):
            video = self.session.get(Video, video_id)
            if video and video.subject_id == subject_id:
                video.order_index = index
                self.session.add(video)
                videos.append(video)
        
        self.session.commit()
        return videos

