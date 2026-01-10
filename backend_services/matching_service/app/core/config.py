"""Configuration management"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Server
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = (
        "postgresql://tripo04os:tripo04os123@localhost:5433/tripo04os_matching"
    )

    # Algorithm Weights
    ETA_WEIGHT: float = 0.35
    RATING_WEIGHT: float = 0.25
    RELIABILITY_WEIGHT: float = 0.15
    FAIRNESS_BOOST: float = 0.15
    VEHICLE_WEIGHT: float = 0.10

    # Constraints
    MAX_MATCH_DISTANCE_KM: float = 50.0
    MAX_ETA_MINUTES: int = 30
    FAIRNESS_BOOST_THRESHOLD: float = 0.3

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
