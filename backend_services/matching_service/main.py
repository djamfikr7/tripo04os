"""Application entry point for Matching Service"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import matching, health
from app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tripo04OS Matching Service",
    description="Driver matching and scoring service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(matching.router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Matching Service")
    logger.info(f"Environment: {settings.ENVIRONMENT}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Matching Service")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8005,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
    )
