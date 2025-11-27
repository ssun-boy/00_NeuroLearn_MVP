"""검수(Validation) 서비스"""
from typing import List, Dict, Tuple
from uuid import UUID
from sqlmodel import Session, select, func
from fastapi import HTTPException, status

from app.models.subject import Subject
from app.models.certificate import Certificate
from app.models.chapter import Chapter
from app.models.question import Question
from app.schemas.validation import (
    ValidationStatus,
    ChapterValidationItem,
    QuestionValidationItem,
)


class ValidationService:
    """검수 서비스"""
    
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

    def validate_chapters(self, subject_id: UUID, creator_id: UUID) -> Dict:
        """목차 검수"""
        subject = self._verify_subject_ownership(subject_id, creator_id)
        
        # 모든 목차 조회
        statement = select(Chapter).where(
            Chapter.subject_id == subject_id
        ).order_by(Chapter.depth, Chapter.order_index)
        chapters = list(self.session.exec(statement).all())
        
        items = []
        ok_count = 0
        warning_count = 0
        error_count = 0
        textbook_count = 0
        video_count = 0
        
        for chapter in chapters:
            has_textbook = chapter.textbook_page is not None
            has_video = chapter.video_id is not None
            
            if has_textbook:
                textbook_count += 1
            if has_video:
                video_count += 1
            
            # 상태 판단
            if has_textbook and has_video:
                item_status = ValidationStatus.OK
                message = None
                ok_count += 1
            elif has_textbook or has_video:
                item_status = ValidationStatus.WARNING
                if not has_textbook:
                    message = "교재 매핑 누락"
                else:
                    message = "영상 매핑 누락"
                warning_count += 1
            else:
                item_status = ValidationStatus.ERROR
                message = "교재, 영상 모두 매핑 누락"
                error_count += 1
            
            items.append(ChapterValidationItem(
                id=chapter.id,
                title=chapter.title,
                depth=chapter.depth,
                has_textbook_mapping=has_textbook,
                has_video_mapping=has_video,
                textbook_page=chapter.textbook_page,
                video_start_seconds=chapter.video_start_seconds,
                status=item_status,
                message=message
            ))
        
        summary = {
            "total": len(chapters),
            "with_textbook": textbook_count,
            "with_video": video_count,
            "ok": ok_count,
            "warning": warning_count,
            "error": error_count,
            "textbook_percentage": round(textbook_count / len(chapters) * 100, 1) if chapters else 0,
            "video_percentage": round(video_count / len(chapters) * 100, 1) if chapters else 0
        }
        
        return {
            "summary": summary,
            "items": [item.model_dump() for item in items]
        }

    def validate_questions(self, subject_id: UUID, creator_id: UUID) -> Dict:
        """문제 검수"""
        subject = self._verify_subject_ownership(subject_id, creator_id)
        
        # 모든 문제 조회
        statement = select(Question).where(
            Question.subject_id == subject_id
        ).order_by(Question.order_index)
        questions = list(self.session.exec(statement).all())
        
        items = []
        ok_count = 0
        warning_count = 0
        textbook_count = 0
        
        for question in questions:
            has_textbook = question.textbook_page is not None
            
            if has_textbook:
                textbook_count += 1
            
            # 상태 판단 (문제는 교재 매핑만 검수)
            if has_textbook:
                item_status = ValidationStatus.OK
                message = None
                ok_count += 1
            else:
                item_status = ValidationStatus.WARNING
                message = "교재 매핑 누락"
                warning_count += 1
            
            items.append(QuestionValidationItem(
                id=question.id,
                content=question.content[:100] + "..." if len(question.content) > 100 else question.content,
                has_textbook_mapping=has_textbook,
                textbook_page=question.textbook_page,
                status=item_status,
                message=message
            ))
        
        summary = {
            "total": len(questions),
            "with_textbook": textbook_count,
            "ok": ok_count,
            "warning": warning_count,
            "textbook_percentage": round(textbook_count / len(questions) * 100, 1) if questions else 0
        }
        
        return {
            "summary": summary,
            "items": [item.model_dump() for item in items]
        }

    def get_full_validation(self, subject_id: UUID, creator_id: UUID) -> Dict:
        """전체 검수 결과"""
        subject = self._verify_subject_ownership(subject_id, creator_id)
        
        chapter_result = self.validate_chapters(subject_id, creator_id)
        question_result = self.validate_questions(subject_id, creator_id)
        
        # 전체 상태 판단
        chapter_summary = chapter_result["summary"]
        question_summary = question_result["summary"]
        
        total_items = chapter_summary["total"] + question_summary["total"]
        ok_items = chapter_summary["ok"] + question_summary["ok"]
        
        if total_items == 0:
            overall_status = ValidationStatus.ERROR
            completion = 0
        else:
            completion = round(ok_items / total_items * 100, 1)
            if completion >= 100:
                overall_status = ValidationStatus.OK
            elif completion >= 50:
                overall_status = ValidationStatus.WARNING
            else:
                overall_status = ValidationStatus.ERROR
        
        return {
            "subject_id": str(subject_id),
            "subject_name": subject.name,
            "chapter_validation": chapter_result,
            "question_validation": question_result,
            "overall_status": overall_status,
            "completion_percentage": completion
        }

