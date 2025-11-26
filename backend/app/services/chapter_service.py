from typing import List, Optional, Dict
from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.models.chapter import Chapter
from app.models.subject import Subject
from app.models.certificate import Certificate
from app.schemas.chapter import ChapterCreate, ChapterUpdate, ChapterMappingUpdate, ChapterVideoMappingUpdate


class ChapterService:
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

    def _calculate_depth(self, parent_id: Optional[UUID]) -> int:
        """부모 기반으로 depth 계산"""
        if parent_id is None:
            return 0
        parent = self.session.get(Chapter, parent_id)
        if parent:
            return parent.depth + 1
        return 0

    def get_all_by_subject(self, subject_id: UUID, creator_id: UUID) -> List[Chapter]:
        """과목의 모든 목차 조회 (flat)"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        statement = select(Chapter).where(
            Chapter.subject_id == subject_id
        ).order_by(Chapter.depth, Chapter.order_index)
        return list(self.session.exec(statement).all())

    def get_tree_by_subject(self, subject_id: UUID, creator_id: UUID) -> List[Dict]:
        """과목의 목차를 트리 구조로 조회"""
        chapters = self.get_all_by_subject(subject_id, creator_id)
        return self._build_tree(chapters)

    def _build_tree(self, chapters: List[Chapter]) -> List[Dict]:
        """목차 리스트를 트리 구조로 변환"""
        chapter_map = {str(c.id): {
            **c.model_dump(),
            "id": str(c.id),
            "subject_id": str(c.subject_id),
            "parent_id": str(c.parent_id) if c.parent_id else None,
            "video_id": str(c.video_id) if c.video_id else None,
            "children": []
        } for c in chapters}
        
        tree = []
        for chapter_dict in chapter_map.values():
            parent_id = chapter_dict["parent_id"]
            if parent_id and parent_id in chapter_map:
                chapter_map[parent_id]["children"].append(chapter_dict)
            elif parent_id is None:
                tree.append(chapter_dict)
        
        # 각 레벨에서 order_index로 정렬
        def sort_children(node):
            node["children"].sort(key=lambda x: x["order_index"])
            for child in node["children"]:
                sort_children(child)
        
        tree.sort(key=lambda x: x["order_index"])
        for node in tree:
            sort_children(node)
        
        return tree

    def get_by_id(self, chapter_id: UUID, creator_id: UUID) -> Optional[Chapter]:
        """목차 ID로 조회"""
        statement = select(Chapter).join(Subject).join(Certificate).where(
            Chapter.id == chapter_id,
            Certificate.creator_id == creator_id
        )
        return self.session.exec(statement).first()

    def create(self, subject_id: UUID, data: ChapterCreate, creator_id: UUID) -> Chapter:
        """목차 생성"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        # parent_id가 있으면 같은 과목인지 확인
        if data.parent_id:
            parent = self.session.get(Chapter, data.parent_id)
            if not parent or parent.subject_id != subject_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="상위 목차가 유효하지 않습니다"
                )
        
        depth = self._calculate_depth(data.parent_id)
        
        chapter = Chapter(
            subject_id=subject_id,
            parent_id=data.parent_id,
            title=data.title,
            order_index=data.order_index,
            depth=depth
        )
        self.session.add(chapter)
        self.session.commit()
        self.session.refresh(chapter)
        return chapter

    def update(self, chapter_id: UUID, data: ChapterUpdate, creator_id: UUID) -> Chapter:
        """목차 수정"""
        chapter = self.get_by_id(chapter_id, creator_id)
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="목차를 찾을 수 없습니다"
            )
        
        update_data = data.model_dump(exclude_unset=True)
        
        # parent_id 변경 시 depth 재계산
        if "parent_id" in update_data:
            update_data["depth"] = self._calculate_depth(update_data["parent_id"])
        
        for key, value in update_data.items():
            setattr(chapter, key, value)
        
        self.session.add(chapter)
        self.session.commit()
        self.session.refresh(chapter)
        return chapter

    def delete(self, chapter_id: UUID, creator_id: UUID) -> bool:
        """목차 삭제 (하위 목차도 함께 삭제)"""
        chapter = self.get_by_id(chapter_id, creator_id)
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="목차를 찾을 수 없습니다"
            )
        
        # 하위 목차 재귀 삭제
        self._delete_children(chapter_id)
        self.session.delete(chapter)
        self.session.commit()
        return True

    def _delete_children(self, parent_id: UUID):
        """하위 목차 재귀 삭제"""
        statement = select(Chapter).where(Chapter.parent_id == parent_id)
        children = self.session.exec(statement).all()
        for child in children:
            self._delete_children(child.id)
            self.session.delete(child)

    def update_textbook_mapping(
        self, 
        chapter_id: UUID, 
        data: ChapterMappingUpdate, 
        creator_id: UUID
    ) -> Chapter:
        """목차-교재 매핑 수정"""
        chapter = self.get_by_id(chapter_id, creator_id)
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="목차를 찾을 수 없습니다"
            )
        
        chapter.textbook_page = data.textbook_page
        self.session.add(chapter)
        self.session.commit()
        self.session.refresh(chapter)
        return chapter

    def update_video_mapping(
        self, 
        chapter_id: UUID, 
        data: ChapterVideoMappingUpdate, 
        creator_id: UUID
    ) -> Chapter:
        """목차-영상 매핑 수정"""
        chapter = self.get_by_id(chapter_id, creator_id)
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="목차를 찾을 수 없습니다"
            )
        
        chapter.video_id = data.video_id
        chapter.video_start_seconds = data.video_start_seconds
        self.session.add(chapter)
        self.session.commit()
        self.session.refresh(chapter)
        return chapter

    def bulk_create(
        self, 
        subject_id: UUID, 
        chapters_data: List[ChapterCreate], 
        creator_id: UUID
    ) -> List[Chapter]:
        """목차 일괄 생성"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        created_chapters = []
        for data in chapters_data:
            depth = self._calculate_depth(data.parent_id)
            chapter = Chapter(
                subject_id=subject_id,
                parent_id=data.parent_id,
                title=data.title,
                order_index=data.order_index,
                depth=depth
            )
            self.session.add(chapter)
            created_chapters.append(chapter)
        
        self.session.commit()
        for chapter in created_chapters:
            self.session.refresh(chapter)
        
        return created_chapters

