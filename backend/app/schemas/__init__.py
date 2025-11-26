from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    MessageResponse,
)
from app.schemas.certificate import (
    CertificateCreate,
    CertificateUpdate,
    CertificateResponse,
    CertificateWithSubjects,
)
from app.schemas.subject import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse,
    ProficiencyWeightCreate,
    ProficiencyWeightResponse,
    SubjectWithWeights,
)
from app.schemas.chapter import (
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
    ChapterTreeNode,
    ChapterMappingUpdate,
    ChapterVideoMappingUpdate,
    ChapterBulkCreate,
    ChapterMappingBulkItem,
    ChapterMappingBulkUpdate,
)
from app.schemas.textbook import (
    TextbookCreate,
    TextbookUpdate,
    TextbookResponse,
    FileUploadResponse,
)

__all__ = [
    # Auth
    "UserRegister",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
    "MessageResponse",
    # Certificate
    "CertificateCreate",
    "CertificateUpdate",
    "CertificateResponse",
    "CertificateWithSubjects",
    # Subject
    "SubjectCreate",
    "SubjectUpdate",
    "SubjectResponse",
    "ProficiencyWeightCreate",
    "ProficiencyWeightResponse",
    "SubjectWithWeights",
    # Chapter
    "ChapterCreate",
    "ChapterUpdate",
    "ChapterResponse",
    "ChapterTreeNode",
    "ChapterMappingUpdate",
    "ChapterVideoMappingUpdate",
    "ChapterBulkCreate",
    "ChapterMappingBulkItem",
    "ChapterMappingBulkUpdate",
    # Textbook
    "TextbookCreate",
    "TextbookUpdate",
    "TextbookResponse",
    "FileUploadResponse",
]
