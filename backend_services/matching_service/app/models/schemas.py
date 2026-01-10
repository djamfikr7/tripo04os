"""Pydantic models for Matching Service"""

from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
from enum import Enum


class MatchStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    COMPLETED = "COMPLETED"


class DriverAvailability(BaseModel):
    driver_id: str
    is_online: bool
    is_available: bool
    current_latitude: float
    current_longitude: float
    last_location_update: datetime
    vehicle_type: str
    is_verified: bool
    rating: float = Field(..., ge=0, le=5)
    total_trips: int = Field(..., ge=0)


class DriverMatch(BaseModel):
    order_id: str
    driver_id: str
    match_score: float = Field(..., ge=0, le=1)
    eta_score: float = Field(..., ge=0, le=1)
    rating_score: float = Field(..., ge=0, le=1)
    reliability_score: float = Field(..., ge=0, le=1)
    fairness_boost: float = Field(..., ge=0, le=1)
    vehicle_match: float = Field(..., ge=0, le=1)
    estimated_arrival_minutes: int = Field(..., ge=0)
    status: MatchStatus


class MatchRequest(BaseModel):
    order_id: str
    pickup_latitude: float
    pickup_longitude: float
    destination_latitude: float
    destination_longitude: float
    vehicle_type: Optional[str] = None
    ride_type: Optional[str] = "SOLO"
    max_distance_km: Optional[float] = 50.0
    max_eta_minutes: Optional[int] = 30


class MatchResponse(BaseModel):
    order_id: str
    driver_id: str
    match_score: float
    estimated_arrival_minutes: int
    status: str
    message: str


class AlgorithmConfig(BaseModel):
    eta_weight: float = 0.35
    rating_weight: float = 0.25
    reliability_weight: float = 0.15
    fairness_boost: float = 0.15
    vehicle_weight: float = 0.10
    max_match_distance_km: float = 50.0
    max_eta_minutes: int = 30
    fairness_boost_threshold: float = 0.3


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
