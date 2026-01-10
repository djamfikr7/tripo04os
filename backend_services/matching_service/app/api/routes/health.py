"""Health check endpoints"""

from fastapi import APIRouter
from app.models.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    """
    return HealthResponse(
        status="healthy",
        service="matching-service",
        version="1.0.0",
        database="connected",
    )


@router.get("/ready")
async def ready_check():
    """
    Readiness check endpoint
    """
    return {"status": "ready"}
