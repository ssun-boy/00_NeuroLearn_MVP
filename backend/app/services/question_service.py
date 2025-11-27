from typing import List, Optional, Dict
from uuid import UUID
from sqlmodel import Session, select, func
from fastapi import HTTPException, status

from app.models.question import Question
from app.models.subject import Subject
from app.models.certificate import Certificate
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionMappingUpdate


class QuestionService:
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

    def get_all_by_subject(
        self, 
        subject_id: UUID, 
        creator_id: UUID,
        mapped_only: Optional[bool] = None
    ) -> List[Question]:
        """과목의 모든 문제 조회"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        statement = select(Question).where(Question.subject_id == subject_id)
        
        if mapped_only is True:
            statement = statement.where(Question.textbook_page.isnot(None))
        elif mapped_only is False:
            statement = statement.where(Question.textbook_page.is_(None))
        
        statement = statement.order_by(Question.order_index)
        return list(self.session.exec(statement).all())

    def get_by_id(self, question_id: UUID, creator_id: UUID) -> Optional[Question]:
        """문제 ID로 조회"""
        statement = select(Question).join(Subject).join(Certificate).where(
            Question.id == question_id,
            Certificate.creator_id == creator_id
        )
        return self.session.exec(statement).first()

    def create(self, subject_id: UUID, data: QuestionCreate, creator_id: UUID) -> Question:
        """문제 생성"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        # 정답 인덱스 유효성 검사
        if data.correct_answer >= len(data.options):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="정답 인덱스가 보기 범위를 벗어났습니다"
            )
        
        question = Question(
            subject_id=subject_id,
            content=data.content,
            options={"options": data.options},  # JSON 형태로 변환
            correct_answer=str(data.correct_answer),  # 문자열로 변환
            explanation=data.explanation,
            chapter_id=data.chapter_id,
            textbook_page=data.textbook_page,
            order_index=data.order_index
        )
        self.session.add(question)
        self.session.commit()
        self.session.refresh(question)
        return question

    def update(self, question_id: UUID, data: QuestionUpdate, creator_id: UUID) -> Question:
        """문제 수정"""
        question = self.get_by_id(question_id, creator_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="문제를 찾을 수 없습니다"
            )
        
        update_data = data.model_dump(exclude_unset=True)
        
        # options와 correct_answer 변환
        if 'options' in update_data:
            update_data['options'] = {"options": update_data['options']}
        if 'correct_answer' in update_data:
            update_data['correct_answer'] = str(update_data['correct_answer'])
        
        # 정답 인덱스 유효성 검사
        options = update_data.get('options', question.options)
        if isinstance(options, dict) and 'options' in options:
            options = options['options']
        correct_answer = update_data.get('correct_answer', question.correct_answer)
        if isinstance(correct_answer, str):
            try:
                correct_answer = int(correct_answer)
            except (ValueError, TypeError):
                correct_answer = 0
        
        if correct_answer >= len(options):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="정답 인덱스가 보기 범위를 벗어났습니다"
            )
        
        for key, value in update_data.items():
            setattr(question, key, value)
        
        self.session.add(question)
        self.session.commit()
        self.session.refresh(question)
        return question

    def delete(self, question_id: UUID, creator_id: UUID) -> bool:
        """문제 삭제"""
        question = self.get_by_id(question_id, creator_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="문제를 찾을 수 없습니다"
            )
        
        self.session.delete(question)
        self.session.commit()
        return True

    def bulk_create(
        self, 
        subject_id: UUID, 
        questions_data: List[QuestionCreate], 
        creator_id: UUID
    ) -> List[Question]:
        """문제 일괄 생성"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        created_questions = []
        for idx, data in enumerate(questions_data):
            # 정답 인덱스 유효성 검사
            if data.correct_answer >= len(data.options):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{idx+1}번째 문제: 정답 인덱스가 보기 범위를 벗어났습니다"
                )
            
            question = Question(
                subject_id=subject_id,
                content=data.content,
                options={"options": data.options},  # JSON 형태로 변환
                correct_answer=str(data.correct_answer),  # 문자열로 변환
                explanation=data.explanation,
                chapter_id=data.chapter_id,
                textbook_page=data.textbook_page,
                order_index=data.order_index if data.order_index else idx
            )
            self.session.add(question)
            created_questions.append(question)
        
        self.session.commit()
        for question in created_questions:
            self.session.refresh(question)
        
        return created_questions

    def update_mapping(
        self, 
        question_id: UUID, 
        data: QuestionMappingUpdate, 
        creator_id: UUID
    ) -> Question:
        """문제-교재 매핑 수정"""
        question = self.get_by_id(question_id, creator_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="문제를 찾을 수 없습니다"
            )
        
        question.textbook_page = data.textbook_page
        question.chapter_id = data.chapter_id
        
        self.session.add(question)
        self.session.commit()
        self.session.refresh(question)
        return question

    def bulk_update_mapping(
        self,
        subject_id: UUID,
        mappings: List[Dict],
        creator_id: UUID
    ) -> int:
        """문제-교재 매핑 일괄 수정"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        updated_count = 0
        for mapping in mappings:
            question_id = mapping.get("question_id")
            textbook_page = mapping.get("textbook_page")
            chapter_id = mapping.get("chapter_id")
            
            question = self.session.get(Question, question_id)
            if question and question.subject_id == subject_id:
                question.textbook_page = textbook_page
                question.chapter_id = chapter_id
                self.session.add(question)
                updated_count += 1
        
        self.session.commit()
        return updated_count

    def get_stats(self, subject_id: UUID, creator_id: UUID) -> Dict:
        """문제 통계 조회"""
        self._verify_subject_ownership(subject_id, creator_id)
        
        total = self.session.exec(
            select(func.count(Question.id)).where(Question.subject_id == subject_id)
        ).one()
        
        mapped = self.session.exec(
            select(func.count(Question.id)).where(
                Question.subject_id == subject_id,
                Question.textbook_page.isnot(None)
            )
        ).one()
        
        return {
            "total_count": total,
            "mapped_count": mapped,
            "unmapped_count": total - mapped
        }

