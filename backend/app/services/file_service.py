import os
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


class FileService:
    @staticmethod
    def validate_file(file: UploadFile, allowed_types: set = None) -> None:
        """파일 유효성 검사"""
        if allowed_types is None:
            allowed_types = settings.ALLOWED_EXTENSIONS
        
        # 파일 확장자 확인
        file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
        if file_ext not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"허용되지 않는 파일 형식입니다. 허용: {allowed_types}"
            )

    @staticmethod
    async def save_file(
        file: UploadFile, 
        subfolder: str = "textbooks"
    ) -> dict:
        """파일 저장 후 정보 반환"""
        # 파일 유효성 검사
        FileService.validate_file(file, {"pdf"} if subfolder == "textbooks" else None)
        
        # 고유 파일명 생성
        file_ext = file.filename.split(".")[-1].lower() if file.filename else "pdf"
        unique_filename = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}"
        
        # 저장 경로
        save_dir = f"{settings.UPLOAD_DIR}/{subfolder}"
        os.makedirs(save_dir, exist_ok=True)
        file_path = f"{save_dir}/{unique_filename}"
        
        # 파일 저장
        content = await file.read()
        
        # 파일 크기 확인
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"파일 크기가 너무 큽니다. 최대: {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # 상대 경로를 URL로 반환
        file_url = f"/uploads/{subfolder}/{unique_filename}"
        
        return {
            "file_url": file_url,
            "file_name": file.filename,
            "file_size": len(content)
        }

    @staticmethod
    def delete_file(file_url: str) -> bool:
        """파일 삭제"""
        # URL에서 경로 추출
        if file_url.startswith("/uploads/"):
            file_path = file_url.replace("/uploads/", f"{settings.UPLOAD_DIR}/")
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        return False

