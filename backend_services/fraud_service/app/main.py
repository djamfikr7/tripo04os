from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tripo04os_fraud"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "localhost:9092"

settings = Settings()

app = FastAPI(
    title="Tripo04OS Fraud Service",
    description="Fraud detection and prevention service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "fraud-service",
    }

@app.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "service": "fraud-service",
    }

@app.get("/api/v1/fraud/detect")
async def detect_fraud(order_id: str):
    return {
        "order_id": order_id,
        "fraud_score": 0.15,
        "is_fraud": False,
        "reason": "Normal transaction pattern",
    }
