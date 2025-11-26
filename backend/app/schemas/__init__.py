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
]
