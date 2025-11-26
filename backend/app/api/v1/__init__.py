from fastapi import APIRouter
from app.api.v1.endpoints import auth, certificates, subjects

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(certificates.router)
api_router.include_router(subjects.router)

