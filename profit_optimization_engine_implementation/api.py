"""
Profit Optimization Engine API
FastAPI endpoints for profit optimization service
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
    ProfitOptimizationEngine,
    UserMonetizationPredictor,
    RevenueCaptureOptimizer,
    OptimizationObjective,
    ServiceType,
    PremiumTier,
    MarketConditions,
    UserProfile,
    OptimizationResult
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Global instances
optimization_engine = ProfitOptimizationEngine()
monetization_predictor = UserMonetizationPredictor()
revenue_optimizer = RevenueCaptureOptimizer()


# Pydantic models for API requests/responses
class MarketConditionsCreate(BaseModel):
    """Request model for market conditions."""
    demand_level: float = Field(..., ge=0.0, le=1.0, description="Demand level (0-1)")
    supply_level: float = Field(..., ge=0.0, le=1.0, description="Supply level (0-1)")
    competitor_pricing: Dict[str, float] = Field(default_factory=dict, description="Competitor pricing by service type")
    time_of_day: int = Field(..., ge=0, le=23, description="Time of day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0-6, Monday=0)")
    is_holiday: bool = Field(default=False, description="Whether it's a holiday")
    weather_impact: float = Field(default=0.0, ge=-1.0, le=1.0, description="Weather impact (-1 to 1)")
    event_impact: float = Field(default=0.0, ge=0.0, le=1.0, description="Event impact (0-1)")


class UserProfileCreate(BaseModel):
    """Request model for user profile."""
    user_id: str = Field(..., description="User ID")
    user_tier: Optional[str] = Field(None, description="User premium tier (BRONZE, SILVER, GOLD, PLATINUM)")
    avg_order_value: float = Field(..., gt=0, description="Average order value")
    order_frequency: float = Field(..., ge=0, description="Orders per week")
    churn_risk: float = Field(..., ge=0.0, le=1.0, description="Churn risk (0-1)")
    monetization_propensity: float = Field(..., ge=0.0, le=1.0, description="Monetization propensity (0-1)")
    price_sensitivity: float = Field(..., ge=0.0, le=1.0, description="Price sensitivity (0-1)")
    loyalty_score: float = Field(..., ge=0.0, le=1.0, description="Loyalty score (0-1)")
    behavior_segment: str = Field(..., description="Behavior segment")
    lifetime_value: float = Field(..., ge=0, description="Lifetime value")
    
    @validator('user_tier')
    def validate_user_tier(cls, v):
        """Validate user tier if provided."""
        if v is not None:
            valid_tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"]
            if v not in valid_tiers:
                raise ValueError(f"User tier must be one of {valid_tiers}")
        return v


class PriceOptimizationRequest(BaseModel):
    """Request model for price optimization."""
    service_type: str = Field(..., description="Service type (RIDE, MOTO, FOOD, GROCERY, GOODS, TRUCK_VAN)")
    market_conditions: MarketConditionsCreate
    user_profile: Optional[UserProfileCreate] = None
    objective: str = Field(default="balanced", description="Optimization objective (maximize_profit, maximize_revenue, maximize_user_satisfaction, balanced)")
    
    @validator('service_type')
    def validate_service_type(cls, v):
        """Validate service type."""
        valid_types = ["RIDE", "MOTO", "FOOD", "GROCERY", "GOODS", "TRUCK_VAN"]
        if v not in valid_types:
            raise ValueError(f"Service type must be one of {valid_types}")
        return v
    
    @validator('objective')
    def validate_objective(cls, v):
        """Validate optimization objective."""
        valid_objectives = ["maximize_profit", "maximize_revenue", "maximize_user_satisfaction", "balanced"]
        if v not in valid_objectives:
            raise ValueError(f"Objective must be one of {valid_objectives}")
        return v


class PriceOptimizationResponse(BaseModel):
    """Response model for price optimization."""
    service_type: str
    recommended_price: float
    expected_revenue: float
    expected_profit: float
    confidence_score: float
    optimization_factors: Dict[str, float]
    alternative_options: List[Dict[str, Any]]
    timestamp: datetime


class MonetizationRequest(BaseModel):
    """Request model for monetization prediction."""
    user_profile: UserProfileCreate
    service_type: str = Field(..., description="Service type")
    order_history: List[Dict[str, Any]] = Field(default_factory=list, description="Order history")


class MonetizationResponse(BaseModel):
    """Response model for monetization prediction."""
    user_id: str
    monetization_propensity: float
    monetization_type: str
    optimal_timing: Dict[str, Any]
    personalized_offer: Dict[str, Any]
    expected_conversion_rate: float
    confidence_score: float
    timestamp: datetime


class RevenueOptimizationRequest(BaseModel):
    """Request model for revenue optimization."""
    market_conditions: MarketConditionsCreate
    service_type: str = Field(..., description="Service type")
    order_value: float = Field(..., gt=0, description="Order value")


class RevenueOptimizationResponse(BaseModel):
    """Response model for revenue optimization."""
    order_value: float
    base_fee: float
    service_fee: float
    peak_fee: float
    surge_fee: float
    total_fees: float
    net_revenue: float
    fee_percentage: float
    timestamp: datetime


class ResourceAllocationRequest(BaseModel):
    """Request model for resource allocation optimization."""
    market_conditions: MarketConditionsCreate
    available_resources: Dict[str, int] = Field(..., description="Available resources by service type")
    demand_forecast: Dict[str, int] = Field(..., description="Demand forecast by service type")


class ResourceAllocationResponse(BaseModel):
    """Response model for resource allocation optimization."""
    recommendations: Dict[str, Dict[str, Any]]
    timestamp: datetime


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    timestamp: datetime
    version: str
    services: Dict[str, str]


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Profit Optimization Engine API")
    logger.info("Initializing optimization engines...")
    # Load models and data (in production)
    logger.info("Optimization engines initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Profit Optimization Engine API")


# Create FastAPI app
app = FastAPI(
    title="Profit Optimization Engine API",
    description="API for AI-powered profit optimization and revenue capture",
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
def convert_market_conditions(conditions: MarketConditionsCreate) -> MarketConditions:
    """Convert API model to internal model."""
    return MarketConditions(
        demand_level=conditions.demand_level,
        supply_level=conditions.supply_level,
        competitor_pricing=conditions.competitor_pricing,
        time_of_day=conditions.time_of_day,
        day_of_week=conditions.day_of_week,
        is_holiday=conditions.is_holiday,
        weather_impact=conditions.weather_impact,
        event_impact=conditions.event_impact
    )


def convert_user_profile(profile: UserProfileCreate) -> UserProfile:
    """Convert API model to internal model."""
    tier = None
    if profile.user_tier:
        tier = PremiumTier(profile.user_tier)
    
    return UserProfile(
        user_id=profile.user_id,
        user_tier=tier,
        avg_order_value=profile.avg_order_value,
        order_frequency=profile.order_frequency,
        churn_risk=profile.churn_risk,
        monetization_propensity=profile.monetization_propensity,
        price_sensitivity=profile.price_sensitivity,
        loyalty_score=profile.loyalty_score,
        behavior_segment=profile.behavior_segment,
        lifetime_value=profile.lifetime_value
    )


# API Endpoints

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        services={
            "optimization_engine": "running",
            "monetization_predictor": "running",
            "revenue_optimizer": "running"
        }
    )


@app.post("/optimize/price", response_model=PriceOptimizationResponse)
async def optimize_price(request: PriceOptimizationRequest):
    """
    Optimize price for a service.
    
    Args:
        request: Price optimization request
        
    Returns:
        Optimized price with recommendations
    """
    try:
        # Convert models
        market_conditions = convert_market_conditions(request.market_conditions)
        user_profile = None
        if request.user_profile:
            user_profile = convert_user_profile(request.user_profile)
        
        # Convert objective
        objective_map = {
            "maximize_profit": OptimizationObjective.MAXIMIZE_PROFIT,
            "maximize_revenue": OptimizationObjective.MAXIMIZE_REVENUE,
            "maximize_user_satisfaction": OptimizationObjective.MAXIMIZE_USER_SATISFACTION,
            "balanced": OptimizationObjective.BALANCED
        }
        objective = objective_map.get(request.objective, OptimizationObjective.BALANCED)
        
        # Calculate optimal price
        result = optimization_engine.calculate_optimal_price(
            service_type=request.service_type,
            market_conditions=market_conditions,
            user_profile=user_profile,
            objective=objective
        )
        
        logger.info(f"Optimized price for {request.service_type}: ${result.recommended_price:.2f}")
        
        return PriceOptimizationResponse(
            service_type=request.service_type,
            recommended_price=result.recommended_price,
            expected_revenue=result.expected_revenue,
            expected_profit=result.expected_profit,
            confidence_score=result.confidence_score,
            optimization_factors=result.optimization_factors,
            alternative_options=result.alternative_options,
            timestamp=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Error optimizing price: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error optimizing price: {str(e)}"
        )


@app.post("/optimize/monetization", response_model=MonetizationResponse)
async def predict_monetization(request: MonetizationRequest):
    """
    Predict monetization opportunity for a user.
    
    Args:
        request: Monetization prediction request
        
    Returns:
        Monetization prediction with recommendations
    """
    try:
        # Convert user profile
        user_profile = convert_user_profile(request.user_profile)
        
        # Predict monetization opportunity
        result = monetization_predictor.predict_monetization_opportunity(
            user_profile=user_profile,
            service_type=request.service_type,
            order_history=request.order_history
        )
        
        logger.info(f"Predicted monetization for user {user_profile.user_id}: {result['monetization_type']}")
        
        return MonetizationResponse(
            user_id=result['user_id'],
            monetization_propensity=result['monetization_propensity'],
            monetization_type=result['monetization_type'],
            optimal_timing=result['optimal_timing'],
            personalized_offer=result['personalized_offer'],
            expected_conversion_rate=result['expected_conversion_rate'],
            confidence_score=result['confidence_score'],
            timestamp=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Error predicting monetization: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error predicting monetization: {str(e)}"
        )


@app.post("/optimize/revenue", response_model=RevenueOptimizationResponse)
async def optimize_revenue(request: RevenueOptimizationRequest):
    """
    Optimize revenue capture for an order.
    
    Args:
        request: Revenue optimization request
        
    Returns:
        Optimized fee structure
    """
    try:
        # Convert market conditions
        market_conditions = convert_market_conditions(request.market_conditions)
        
        # Optimize fees
        result = revenue_optimizer.optimize_fees(
            market_conditions=market_conditions,
            service_type=request.service_type,
            order_value=request.order_value
        )
        
        logger.info(f"Optimized revenue for order value ${request.order_value:.2f}: ${result['total_fees']:.2f} fees")
        
        return RevenueOptimizationResponse(
            order_value=result['order_value'],
            base_fee=result['base_fee'],
            service_fee=result['service_fee'],
            peak_fee=result['peak_fee'],
            surge_fee=result['surge_fee'],
            total_fees=result['total_fees'],
            net_revenue=result['net_revenue'],
            fee_percentage=result['fee_percentage'],
            timestamp=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Error optimizing revenue: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error optimizing revenue: {str(e)}"
        )


@app.post("/optimize/resources", response_model=ResourceAllocationResponse)
async def optimize_resources(request: ResourceAllocationRequest):
    """
    Optimize resource allocation across service types.
    
    Args:
        request: Resource allocation optimization request
        
    Returns:
        Optimized allocation recommendations
    """
    try:
        # Convert market conditions
        market_conditions = convert_market_conditions(request.market_conditions)
        
        # Optimize resource allocation
        result = optimization_engine.optimize_resource_allocation(
            market_conditions=market_conditions,
            available_resources=request.available_resources,
            demand_forecast=request.demand_forecast
        )
        
        logger.info(f"Optimized resource allocation for {len(result)} service types")
        
        return ResourceAllocationResponse(
            recommendations=result,
            timestamp=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Error optimizing resources: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error optimizing resources: {str(e)}"
        )


@app.get("/service-types")
async def get_service_types():
    """Get list of supported service types."""
    return {
        "service_types": [st.value for st in ServiceType],
        "base_prices": optimization_engine.base_prices
    }


@app.get("/premium-tiers")
async def get_premium_tiers():
    """Get list of premium tiers and their multipliers."""
    return {
        "premium_tiers": [pt.value for pt in PremiumTier],
        "multipliers": optimization_engine.tier_multipliers
    }


@app.get("/optimization-objectives")
async def get_optimization_objectives():
    """Get list of optimization objectives."""
    return {
        "objectives": [obj.value for obj in OptimizationObjective],
        "weights": {obj.value: weights for obj, weights in optimization_engine.optimization_weights.items()}
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
        port=8002,
        log_level="info"
    )
