from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from typing import Dict, List
from datetime import datetime
import random

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tripo04os_analytics"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "localhost:9092"

settings = Settings()

app = FastAPI(
    title="Tripo04OS Analytics Service",
    description="Business analytics and reporting service",
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
        "service": "analytics-service",
    }

@app.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "service": "analytics-service",
    }

@app.get("/api/v1/analytics/daily")
async def get_daily_analytics(date: str = None):
    return {
        "date": date or datetime.now().strftime("%Y-%m-%d"),
        "total_rides": random.randint(1000, 5000),
        "total_revenue": random.uniform(5000.0, 20000.0),
        "active_users": random.randint(500, 2000),
        "active_drivers": random.randint(200, 800),
        "average_rating": round(random.uniform(4.0, 5.0), 2),
    }

@app.get("/api/v1/analytics/weekly")
async def get_weekly_analytics():
    return {
        "start_date": "2026-01-03",
        "end_date": "2026-01-09",
        "total_rides": random.randint(7000, 35000),
        "total_revenue": random.uniform(35000.0, 140000.0),
        "average_daily_rides": random.randint(1000, 5000),
        "growth_percentage": round(random.uniform(-5.0, 15.0), 2),
    }

@app.get("/api/v1/analytics/driver-performance")
async def get_driver_performance():
    return {
        "top_drivers": [
            {
                "driver_id": f"driver_{i}",
                "name": f"Driver {i}",
                "total_trips": random.randint(50, 500),
                "rating": round(random.uniform(4.0, 5.0), 2),
                "completion_rate": round(random.uniform(90.0, 100.0), 2),
            }
            for i in range(1, 11)
        ],
        "average_rating": round(random.uniform(4.2, 4.8), 2),
        "average_completion_rate": round(random.uniform(92.0, 98.0), 2),
    }

@app.get("/api/v1/analytics/revenue")
async def get_revenue_analytics(period: str = "month"):
    return {
        "period": period,
        "total_revenue": random.uniform(150000.0, 600000.0),
        "service_fees": random.uniform(15000.0, 60000.0),
        "booking_fees": random.uniform(10000.0, 40000.0),
        "net_revenue": random.uniform(125000.0, 500000.0),
        "breakdown": {
            "ride": round(random.uniform(60.0, 80.0), 1),
            "moto": round(random.uniform(5.0, 15.0), 1),
            "food": round(random.uniform(8.0, 20.0), 1),
            "grocery": round(random.uniform(3.0, 10.0), 1),
            "goods": round(random.uniform(2.0, 8.0), 1),
            "truck_van": round(random.uniform(2.0, 7.0), 1),
        },
    }
