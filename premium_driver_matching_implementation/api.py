"""
Premium Driver Matching API
FastAPI endpoints for premium driver matching service
"""

from fastapi import FastAPI, HTTPException, Depends, status, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from contextlib import asynccontextmanager

from algorithms import (
    PremiumDriverMatcher,
    DriverProfile,
    MatchingRequest,
    MatchingScore,
    calculate_fairness_score
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Global matcher instance
matcher = PremiumDriverMatcher()


# Pydantic models for API requests/responses
class DriverProfileCreate(BaseModel):
    """Request model for creating a driver profile."""
    driver_id: str = Field(..., description="Unique driver identifier")
    avg_rating_30d: float = Field(..., ge=1.0, le=5.0, description="Average rating over last 30 days")
    avg_rating_90d: float = Field(..., ge=1.0, le=5.0, description="Average rating over last 90 days")
    avg_rating_lifetime: float = Field(..., ge=1.0, le=5.0, description="Lifetime average rating")
    total_rides: int = Field(..., ge=0, description="Total number of rides")
    completion_rate_30d: float = Field(..., ge=0.0, le=1.0, description="Completion rate over last 30 days")
    acceptance_rate_30d: float = Field(..., ge=0.0, le=1.0, description="Acceptance rate over last 30 days")
    eta_accuracy_30d: float = Field(..., ge=0.0, le=1.0, description="ETA accuracy over last 30 days")
    fairness_boost: float = Field(default=0.0, ge=0.0, le=1.0, description="Fairness boost factor")
    is_available: bool = Field(default=True, description="Driver availability status")
    service_types: List[str] = Field(default_factory=list, description="Service types driver offers")
    specialties: List[str] = Field(default_factory=list, description="Driver specialties")
    vehicle_features: List[str] = Field(default_factory=list, description="Vehicle features")


class DriverProfileUpdate(BaseModel):
    """Request model for updating a driver profile."""
    avg_rating_30d: Optional[float] = Field(None, ge=1.0, le=5.0)
    avg_rating_90d: Optional[float] = Field(None, ge=1.0, le=5.0)
    avg_rating_lifetime: Optional[float] = Field(None, ge=1.0, le=5.0)
    total_rides: Optional[int] = Field(None, ge=0)
    completion_rate_30d: Optional[float] = Field(None, ge=0.0, le=1.0)
    acceptance_rate_30d: Optional[float] = Field(None, ge=0.0, le=1.0)
    eta_accuracy_30d: Optional[float] = Field(None, ge=0.0, le=1.0)
    fairness_boost: Optional[float] = Field(None, ge=0.0, le=1.0)
    is_available: Optional[bool] = None
    service_types: Optional[List[str]] = None
    specialties: Optional[List[str]] = None
    vehicle_features: Optional[List[str]] = None


class MatchingRequestCreate(BaseModel):
    """Request model for creating a matching request."""
    order_id: str = Field(..., description="Unique order identifier")
    pickup_location: List[float] = Field(..., min_items=2, max_items=2, description="Pickup coordinates [lat, lon]")
    dropoff_location: List[float] = Field(..., min_items=2, max_items=2, description="Dropoff coordinates [lat, lon]")
    service_type: str = Field(..., description="Service type (RIDE, MOTO, FOOD, GROCERY, GOODS, TRUCK_VAN)")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled pickup time (for scheduled rides)")
    user_tier: Optional[str] = Field(None, description="User premium tier (BRONZE, SILVER, GOLD, PLATINUM)")
    user_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict, description="User preferences")
    premium_required: bool = Field(default=False, description="Whether premium driver is required")
    special_requirements: List[str] = Field(default_factory=list, description="Special requirements")
    
    @validator('pickup_location', 'dropoff_location')
    def validate_coordinates(cls, v):
        """Validate coordinates are within valid ranges."""
        lat, lon = v
        if not (-90 <= lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180 <= lon <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v
    
    @validator('service_type')
    def validate_service_type(cls, v):
        """Validate service type is supported."""
        valid_types = ["RIDE", "MOTO", "FOOD", "GROCERY", "GOODS", "TRUCK_VAN"]
        if v not in valid_types:
            raise ValueError(f"Service type must be one of {valid_types}")
        return v
    
    @validator('user_tier')
    def validate_user_tier(cls, v):
        """Validate user tier if provided."""
        if v is not None:
            valid_tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"]
            if v not in valid_tiers:
                raise ValueError(f"User tier must be one of {valid_tiers}")
        return v


class MatchingResponse(BaseModel):
    """Response model for matching results."""
    order_id: str
    matched_drivers: List[Dict[str, Any]]
    total_candidates: int
    timestamp: datetime


class DriverProfileResponse(BaseModel):
    """Response model for driver profile."""
    driver_id: str
    avg_rating_30d: float
    avg_rating_90d: float
    avg_rating_lifetime: float
    total_rides: int
    completion_rate_30d: float
    acceptance_rate_30d: float
    eta_accuracy_30d: float
    fairness_boost: float
    is_available: bool
    service_types: List[str]
    specialties: List[str]
    vehicle_features: List[str]
    last_updated: datetime


class PricingRequest(BaseModel):
    """Request model for premium pricing calculation."""
    base_fare: float = Field(..., gt=0, description="Standard base fare")
    driver_tier: str = Field(..., description="Driver premium tier (BRONZE, SILVER, GOLD, PLATINUM)")
    service_type: str = Field(..., description="Service type")
    
    @validator('driver_tier')
    def validate_driver_tier(cls, v):
        """Validate driver tier."""
        valid_tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"]
        if v not in valid_tiers:
            raise ValueError(f"Driver tier must be one of {valid_tiers}")
        return v


class PricingResponse(BaseModel):
    """Response model for premium pricing."""
    base_fare: float
    premium_fee: float
    multiplier: float
    total_fare: float
    savings: float
    savings_percentage: float


class RecommendationsResponse(BaseModel):
    """Response model for driver recommendations."""
    driver_id: str
    recommendations: List[str]


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    timestamp: datetime
    version: str
    total_drivers: int


# In-memory storage (in production, use database)
driver_profiles_store: Dict[str, DriverProfile] = {}


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Premium Driver Matching API")
    logger.info("Loading driver profiles...")
    # Load driver profiles from database (in production)
    logger.info(f"Loaded {len(driver_profiles_store)} driver profiles")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Premium Driver Matching API")


# Create FastAPI app
app = FastAPI(
    title="Premium Driver Matching API",
    description="API for premium driver matching and pricing",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper functions
def driver_profile_to_response(profile: DriverProfile) -> DriverProfileResponse:
    """Convert DriverProfile to DriverProfileResponse."""
    return DriverProfileResponse(
        driver_id=profile.driver_id,
        avg_rating_30d=profile.avg_rating_30d,
        avg_rating_90d=profile.avg_rating_90d,
        avg_rating_lifetime=profile.avg_rating_lifetime,
        total_rides=profile.total_rides,
        completion_rate_30d=profile.completion_rate_30d,
        acceptance_rate_30d=profile.acceptance_rate_30d,
        eta_accuracy_30d=profile.eta_accuracy_30d,
        fairness_boost=profile.fairness_boost,
        is_available=profile.is_available if hasattr(profile, 'is_available') else True,
        service_types=profile.service_types if hasattr(profile, 'service_types') else [],
        specialties=profile.specialties if hasattr(profile, 'specialties') else [],
        vehicle_features=profile.vehicle_features if hasattr(profile, 'vehicle_features') else [],
        last_updated=profile.last_updated if hasattr(profile, 'last_updated') else datetime.now()
    )


def matching_score_to_dict(score: MatchingScore) -> Dict[str, Any]:
    """Convert MatchingScore to dictionary."""
    return {
        "driver_id": score.driver_id,
        "score": score.score,
        "eta_score": score.eta_score,
        "rating_score": score.rating_score,
        "reliability_score": score.reliability_score,
        "fairness_boost": score.fairness_boost,
        "vehicle_match": score.vehicle_match,
        "total_score": score.total_score
    }


# API Endpoints

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        total_drivers=len(driver_profiles_store)
    )


@app.post("/drivers", response_model=DriverProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_driver_profile(profile: DriverProfileCreate):
    """
    Create a new driver profile.
    
    Args:
        profile: Driver profile data
        
    Returns:
        Created driver profile
    """
    # Check if driver already exists
    if profile.driver_id in driver_profiles_store:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driver profile {profile.driver_id} already exists"
        )
    
    # Create driver profile
    driver_profile = DriverProfile(
        driver_id=profile.driver_id,
        avg_rating_30d=profile.avg_rating_30d,
        avg_rating_90d=profile.avg_rating_90d,
        avg_rating_lifetime=profile.avg_rating_lifetime,
        total_rides=profile.total_rides,
        completion_rate_30d=profile.completion_rate_30d,
        acceptance_rate_30d=profile.acceptance_rate_30d,
        eta_accuracy_30d=profile.eta_accuracy_30d,
        fairness_boost=profile.fairness_boost,
        last_updated=datetime.now()
    )
    
    # Add additional attributes
    driver_profile.is_available = profile.is_available
    driver_profile.service_types = profile.service_types
    driver_profile.specialties = profile.specialties
    driver_profile.vehicle_features = profile.vehicle_features
    
    # Store profile
    driver_profiles_store[profile.driver_id] = driver_profile
    
    logger.info(f"Created driver profile: {profile.driver_id}")
    
    return driver_profile_to_response(driver_profile)


@app.get("/drivers/{driver_id}", response_model=DriverProfileResponse)
async def get_driver_profile(driver_id: str = Path(..., description="Driver ID")):
    """
    Get a driver profile by ID.
    
    Args:
        driver_id: Driver identifier
        
    Returns:
        Driver profile
    """
    if driver_id not in driver_profiles_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver profile {driver_id} not found"
        )
    
    return driver_profile_to_response(driver_profiles_store[driver_id])


@app.put("/drivers/{driver_id}", response_model=DriverProfileResponse)
async def update_driver_profile(
    driver_id: str = Path(..., description="Driver ID"),
    profile: DriverProfileUpdate = None
):
    """
    Update a driver profile.
    
    Args:
        driver_id: Driver identifier
        profile: Updated profile data
        
    Returns:
        Updated driver profile
    """
    if driver_id not in driver_profiles_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver profile {driver_id} not found"
        )
    
    # Get existing profile
    existing_profile = driver_profiles_store[driver_id]
    
    # Update fields
    if profile.avg_rating_30d is not None:
        existing_profile.avg_rating_30d = profile.avg_rating_30d
    if profile.avg_rating_90d is not None:
        existing_profile.avg_rating_90d = profile.avg_rating_90d
    if profile.avg_rating_lifetime is not None:
        existing_profile.avg_rating_lifetime = profile.avg_rating_lifetime
    if profile.total_rides is not None:
        existing_profile.total_rides = profile.total_rides
    if profile.completion_rate_30d is not None:
        existing_profile.completion_rate_30d = profile.completion_rate_30d
    if profile.acceptance_rate_30d is not None:
        existing_profile.acceptance_rate_30d = profile.acceptance_rate_30d
    if profile.eta_accuracy_30d is not None:
        existing_profile.eta_accuracy_30d = profile.eta_accuracy_30d
    if profile.fairness_boost is not None:
        existing_profile.fairness_boost = profile.fairness_boost
    if profile.is_available is not None:
        existing_profile.is_available = profile.is_available
    if profile.service_types is not None:
        existing_profile.service_types = profile.service_types
    if profile.specialties is not None:
        existing_profile.specialties = profile.specialties
    if profile.vehicle_features is not None:
        existing_profile.vehicle_features = profile.vehicle_features
    
    existing_profile.last_updated = datetime.now()
    
    logger.info(f"Updated driver profile: {driver_id}")
    
    return driver_profile_to_response(existing_profile)


@app.delete("/drivers/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver_profile(driver_id: str = Path(..., description="Driver ID")):
    """
    Delete a driver profile.
    
    Args:
        driver_id: Driver identifier
    """
    if driver_id not in driver_profiles_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver profile {driver_id} not found"
        )
    
    del driver_profiles_store[driver_id]
    
    logger.info(f"Deleted driver profile: {driver_id}")


@app.get("/drivers", response_model=List[DriverProfileResponse])
async def list_drivers(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    service_type: Optional[str] = Query(None, description="Filter by service type"),
    is_available: Optional[bool] = Query(None, description="Filter by availability"),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0, description="Minimum rating")
):
    """
    List driver profiles with optional filters.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        service_type: Filter by service type
        is_available: Filter by availability
        min_rating: Minimum rating
        
    Returns:
        List of driver profiles
    """
    profiles = list(driver_profiles_store.values())
    
    # Apply filters
    if service_type:
        profiles = [p for p in profiles if service_type in (getattr(p, 'service_types', []))]
    
    if is_available is not None:
        profiles = [p for p in profiles if getattr(p, 'is_available', True) == is_available]
    
    if min_rating:
        profiles = [p for p in profiles if p.avg_rating_30d >= min_rating]
    
    # Apply pagination
    profiles = profiles[skip:skip + limit]
    
    return [driver_profile_to_response(p) for p in profiles]


@app.post("/match", response_model=MatchingResponse)
async def match_drivers(request: MatchingRequestCreate):
    """
    Match drivers for a ride request.
    
    Args:
        request: Matching request data
        
    Returns:
        Ranked list of matched drivers
    """
    # Create matching request
    matching_request = MatchingRequest(
        order_id=request.order_id,
        pickup_location=tuple(request.pickup_location),
        dropoff_location=tuple(request.dropoff_location),
        service_type=request.service_type,
        scheduled_at=request.scheduled_at,
        user_tier=request.user_tier,
        user_preferences=request.user_preferences or {},
        premium_required=request.premium_required
    )
    
    # Add special requirements to user preferences
    if request.special_requirements:
        matching_request.user_preferences["special_requirements"] = request.special_requirements
    
    # Get all available drivers
    available_drivers = list(driver_profiles_store.values())
    
    # Filter eligible drivers
    eligible_drivers = matcher.filter_eligible_drivers(available_drivers, matching_request)
    
    # Rank drivers
    ranked_drivers = matcher.rank_drivers(matching_request, eligible_drivers, max_drivers=10)
    
    # Convert to response format
    matched_drivers = [matching_score_to_dict(score) for score in ranked_drivers]
    
    logger.info(f"Matched {len(matched_drivers)} drivers for order {request.order_id}")
    
    return MatchingResponse(
        order_id=request.order_id,
        matched_drivers=matched_drivers,
        total_candidates=len(eligible_drivers),
        timestamp=datetime.now()
    )


@app.post("/pricing", response_model=PricingResponse)
async def calculate_pricing(pricing_request: PricingRequest):
    """
    Calculate premium pricing.
    
    Args:
        pricing_request: Pricing request data
        
    Returns:
        Pricing breakdown
    """
    pricing = matcher.apply_premium_pricing(
        base_fare=pricing_request.base_fare,
        driver_tier=pricing_request.driver_tier,
        service_type=pricing_request.service_type
    )
    
    return PricingResponse(**pricing)


@app.get("/drivers/{driver_id}/recommendations", response_model=RecommendationsResponse)
async def get_driver_recommendations(driver_id: str = Path(..., description="Driver ID")):
    """
    Get recommendations for improving driver quality.
    
    Args:
        driver_id: Driver identifier
        
    Returns:
        List of recommendations
    """
    if driver_id not in driver_profiles_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver profile {driver_id} not found"
        )
    
    driver_profile = driver_profiles_store[driver_id]
    
    # Create a dummy request for recommendations
    request = MatchingRequest(
        order_id="dummy_order",
        pickup_location=(0.0, 0.0),
        dropoff_location=(0.0, 0.0),
        service_type="RIDE"
    )
    
    # Get recommendations
    recommendations = matcher.get_driver_recommendations(driver_profile, request)
    
    return RecommendationsResponse(
        driver_id=driver_id,
        recommendations=recommendations
    )


@app.get("/fairness")
async def calculate_fairness_scores():
    """
    Calculate fairness scores for all drivers.
    
    Returns:
        Dictionary of driver_id -> fairness score
    """
    profiles = list(driver_profiles_store.values())
    
    # In production, get recent assignments from database
    recent_assignments = {p.driver_id: 0 for p in profiles}
    
    fairness_scores = calculate_fairness_score(profiles, recent_assignments)
    
    return fairness_scores


@app.get("/stats")
async def get_statistics():
    """
    Get driver matching statistics.
    
    Returns:
        Statistics summary
    """
    profiles = list(driver_profiles_store.values())
    
    if not profiles:
        return {
            "total_drivers": 0,
            "available_drivers": 0,
            "avg_rating": 0.0,
            "avg_completion_rate": 0.0,
            "avg_acceptance_rate": 0.0
        }
    
    available_drivers = [p for p in profiles if getattr(p, 'is_available', True)]
    
    return {
        "total_drivers": len(profiles),
        "available_drivers": len(available_drivers),
        "avg_rating": sum(p.avg_rating_30d for p in profiles) / len(profiles),
        "avg_completion_rate": sum(p.completion_rate_30d for p in profiles) / len(profiles),
        "avg_acceptance_rate": sum(p.acceptance_rate_30d for p in profiles) / len(profiles)
    }


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# Run the application
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
