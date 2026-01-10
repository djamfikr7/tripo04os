"""API endpoints for Matching Service"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.schemas import (
    MatchRequest,
    MatchResponse,
    DriverMatch,
    AlgorithmConfig,
    HealthResponse,
)
from app.services.matching_algorithm import MatchingAlgorithm
from app.services.driver_service import DriverService
from app.core.config import settings

router = APIRouter(prefix="/matching", tags=["Matching"])


@router.post("/find-drivers", response_model=List[DriverMatch])
async def find_drivers(request: MatchRequest):
    """
    Find available drivers and calculate match scores
    """
    try:
        # Get available drivers
        drivers = await DriverService.get_available_drivers(
            vehicle_type=request.vehicle_type,
            is_online=True,
            is_available=True,
            is_verified=True,
        )

        if not drivers:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No available drivers found",
            )

        # Get recent match history for fairness
        recent_matches = await DriverService.get_recent_matches(
            limit=10,
            hours_ago=24,
        )

        # Initialize algorithm with config
        algorithm = MatchingAlgorithm(
            AlgorithmConfig(
                eta_weight=settings.ETA_WEIGHT,
                rating_weight=settings.RATING_WEIGHT,
                reliability_weight=settings.RELIABILITY_WEIGHT,
                fairness_boost=settings.FAIRNESS_BOOST,
                vehicle_weight=settings.VEHICLE_WEIGHT,
                max_match_distance_km=settings.MAX_MATCH_DISTANCE_KM,
                max_eta_minutes=settings.MAX_ETA_MINUTES,
                fairness_boost_threshold=settings.FAIRNESS_BOOST_THRESHOLD,
            )
        )

        # Find best matches
        matches = algorithm.find_best_matches(
            request=request,
            available_drivers=drivers,
            recent_matches=recent_matches,
            max_matches=5,
        )

        return matches

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find drivers: {str(e)}",
        )


@router.post("/select-driver", response_model=MatchResponse)
async def select_driver(
    order_id: str,
    driver_id: str,
    match_score: float,
    estimated_arrival_minutes: int,
):
    """
    Select a specific driver for an order
    """
    try:
        # Record the match in database
        await DriverService.record_driver_match(
            order_id=order_id,
            driver_id=driver_id,
            match_score=match_score,
            eta_score=0.0,  # Calculate from request
            rating_score=0.0,  # Get from driver
            reliability_score=0.0,  # Calculate from driver
            fairness_boost=0.0,
            vehicle_match=1.0,
            estimated_arrival_minutes=estimated_arrival_minutes,
            status="PENDING",
        )

        # Update driver availability
        await DriverService.update_driver_availability(
            driver_id=driver_id,
            is_available=False,
        )

        return MatchResponse(
            order_id=order_id,
            driver_id=driver_id,
            match_score=match_score,
            estimated_arrival_minutes=estimated_arrival_minutes,
            status="PENDING",
            message="Driver selected successfully",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to select driver: {str(e)}",
        )


@router.post("/driver-response")
async def driver_response(
    order_id: str,
    driver_id: str,
    accepted: bool,
    response_time_seconds: int,
    cancellation_reason: Optional[str] = None,
):
    """
    Handle driver response to match request
    """
    try:
        # Update match record
        await DriverService.update_match_response(
            order_id=order_id,
            driver_id=driver_id,
            accepted=accepted,
            response_time_seconds=response_time_seconds,
            cancellation_reason=cancellation_reason,
            status="ACCEPTED" if accepted else "DECLINED",
        )

        # If declined, make driver available again
        if not accepted:
            await DriverService.update_driver_availability(
                driver_id=driver_id,
                is_available=True,
            )

        return {"message": "Driver response recorded"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record driver response: {str(e)}",
        )


@router.get("/config", response_model=AlgorithmConfig)
async def get_config():
    """
    Get current matching algorithm configuration
    """
    return AlgorithmConfig(
        eta_weight=settings.ETA_WEIGHT,
        rating_weight=settings.RATING_WEIGHT,
        reliability_weight=settings.RELIABILITY_WEIGHT,
        fairness_boost=settings.FAIRNESS_BOOST,
        vehicle_weight=settings.VEHICLE_WEIGHT,
        max_match_distance_km=settings.MAX_MATCH_DISTANCE_KM,
        max_eta_minutes=settings.MAX_ETA_MINUTES,
        fairness_boost_threshold=settings.FAIRNESS_BOOST_THRESHOLD,
    )
