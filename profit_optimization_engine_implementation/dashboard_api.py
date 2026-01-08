"""
Dashboard API for Profit Optimization Engine
Provides real-time metrics, charts, alerts, and optimization recommendations
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)


# Pydantic models
class MetricCard(BaseModel):
    """Metric card data."""
    title: str
    value: str
    change: float
    change_positive: bool


class ChartData(BaseModel):
    """Chart data."""
    labels: List[str]
    values: List[float]


class Alert(BaseModel):
    """Alert data."""
    id: str
    severity: str  # critical, warning, info, success
    icon: str
    title: str
    message: str
    timestamp: datetime


class Optimization(BaseModel):
    """Optimization recommendation."""
    id: str
    icon: str
    title: str
    description: str
    impact: str
    confidence: float


class DashboardMetrics(BaseModel):
    """Dashboard metrics response."""
    totalRevenue: float
    revenueChange: float
    profitMargin: float
    marginChange: float
    optimizationImpact: float
    impactChange: float
    profitLeakage: float
    leakageChange: float


class DashboardCharts(BaseModel):
    """Dashboard charts response."""
    revenue: ChartData
    margin: ChartData
    optimization: ChartData
    services: ChartData


class DashboardResponse(BaseModel):
    """Complete dashboard response."""
    metrics: DashboardMetrics
    charts: DashboardCharts
    alerts: List[Alert]
    optimizations: List[Optimization]


# Mock data generators
def generate_revenue_data() -> ChartData:
    """Generate mock revenue chart data."""
    labels = []
    values = []
    base_value = 100000
    
    for i in range(30):
        date = datetime.now() - timedelta(days=29-i)
        labels.append(date.strftime("%b %d"))
        # Add some randomness and trend
        value = base_value + (i * 1000) + random.uniform(-10000, 15000)
        values.append(round(value, 2))
    
    return ChartData(labels=labels, values=values)


def generate_margin_data() -> ChartData:
    """Generate mock profit margin chart data."""
    labels = []
    values = []
    
    for i in range(30):
        date = datetime.now() - timedelta(days=29-i)
        labels.append(date.strftime("%b %d"))
        # Margin between 25-35%
        value = 25 + (i * 0.3) + random.uniform(-2, 2)
        values.append(round(value, 2))
    
    return ChartData(labels=labels, values=values)


def generate_optimization_data() -> ChartData:
    """Generate mock optimization impact chart data."""
    labels = ["Price Optimization", "Revenue Capture", "Resource Allocation", "User Monetization"]
    values = [
        random.uniform(25000, 35000),
        random.uniform(15000, 25000),
        random.uniform(10000, 20000),
        random.uniform(5000, 15000)
    ]
    
    return ChartData(labels=labels, values=values)


def generate_service_data() -> ChartData:
    """Generate mock service type revenue chart data."""
    labels = ["RIDE", "MOTO", "FOOD", "GROCERY", "GOODS", "TRUCK_VAN"]
    values = [
        random.uniform(40000, 60000),
        random.uniform(15000, 25000),
        random.uniform(30000, 45000),
        random.uniform(20000, 30000),
        random.uniform(25000, 35000),
        random.uniform(10000, 20000)
    ]
    
    return ChartData(labels=labels, values=values)


def generate_alerts() -> List[Alert]:
    """Generate mock alerts."""
    alerts = [
        Alert(
            id="alert_001",
            severity="critical",
            icon="⚠️",
            title="High Profit Leakage Detected",
            message="Profit leakage exceeded 5% threshold in FOOD service. Immediate action recommended.",
            timestamp=datetime.now() - timedelta(minutes=5)
        ),
        Alert(
            id="alert_002",
            severity="warning",
            icon="📊",
            title="Revenue Below Forecast",
            message="RIDE service revenue is 15% below forecast for current time period.",
            timestamp=datetime.now() - timedelta(minutes=15)
        ),
        Alert(
            id="alert_003",
            severity="info",
            icon="💡",
            title="Optimization Opportunity",
            message="Dynamic pricing could increase revenue by 8% during peak hours (5-7 PM).",
            timestamp=datetime.now() - timedelta(minutes=30)
        ),
        Alert(
            id="alert_004",
            severity="success",
            icon="✅",
            title="Optimization Applied Successfully",
            message="Price optimization for GOLD tier users increased revenue by 12%.",
            timestamp=datetime.now() - timedelta(hours=1)
        ),
        Alert(
            id="alert_005",
            severity="warning",
            icon="🔥",
            title="High Demand Period Approaching",
            message="Expected 40% increase in demand for RIDE service in next 2 hours.",
            timestamp=datetime.now() - timedelta(hours=2)
        )
    ]
    
    return alerts


def generate_optimizations() -> List[Optimization]:
    """Generate mock optimization recommendations."""
    optimizations = [
        Optimization(
            id="opt_001",
            icon="💰",
            title="Increase RIDE Service Prices by 15%",
            description="Current demand is 30% above average. Increasing prices could capture additional revenue while maintaining acceptable conversion rates.",
            impact="+$12,500/day",
            confidence=0.85
        ),
        Optimization(
            id="opt_002",
            icon="🎯",
            title="Target High-Value Users with Premium Offers",
            description="1,250 users with high monetization propensity are due for offers. Personalized premium subscription offers could increase conversion by 25%.",
            impact="+$8,200/day",
            confidence=0.78
        ),
        Optimization(
            id="opt_003",
            icon="🚀",
            title="Reallocate 50 Drivers to FOOD Service",
            description="FOOD service demand is 40% above supply. Reallocating drivers from low-demand RIDE service could increase revenue by $6,500/day.",
            impact="+$6,500/day",
            confidence=0.72
        ),
        Optimization(
            id="opt_004",
            icon="📈",
            title="Apply Peak Surcharges (5-7 PM)",
            description="Peak hours have 50% higher demand. Applying 20% surcharge could increase revenue by $9,300/day with minimal impact on user satisfaction.",
            impact="+$9,300/day",
            confidence=0.81
        ),
        Optimization(
            id="opt_005",
            icon="🔄",
            title="Optimize Commission Rates for High-Volume Drivers",
            description="Top 10% of drivers generate 40% of revenue. Optimizing commission rates could increase platform profit by $4,800/day while maintaining driver satisfaction.",
            impact="+$4,800/day",
            confidence=0.75
        )
    ]
    
    return optimizations


def generate_metrics() -> DashboardMetrics:
    """Generate mock dashboard metrics."""
    return DashboardMetrics(
        totalRevenue=2847500.00,
        revenueChange=15.3,
        profitMargin=32.5,
        marginChange=8.2,
        optimizationImpact=412300.00,
        impactChange=22.7,
        profitLeakage=3.2,
        leakageChange=-1.5  # Negative is good (leakage decreased)
    )


# Create FastAPI app
app = FastAPI(
    title="Profit Optimization Dashboard API",
    description="API for real-time profit optimization dashboard",
    version="1.0.0"
)


@app.get("/dashboard/metrics", response_model=DashboardResponse)
async def get_dashboard_metrics():
    """
    Get complete dashboard data including metrics, charts, alerts, and optimizations.
    
    Returns:
        Complete dashboard response with all data
    """
    try:
        metrics = generate_metrics()
        charts = DashboardCharts(
            revenue=generate_revenue_data(),
            margin=generate_margin_data(),
            optimization=generate_optimization_data(),
            services=generate_service_data()
        )
        alerts = generate_alerts()
        optimizations = generate_optimizations()
        
        return DashboardResponse(
            metrics=metrics,
            charts=charts,
            alerts=alerts,
            optimizations=optimizations
        )
    
    except Exception as e:
        logger.error(f"Error generating dashboard metrics: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating dashboard metrics: {str(e)}"
        )


@app.get("/dashboard/metrics/summary")
async def get_metrics_summary():
    """
    Get summary of key dashboard metrics.
    
    Returns:
        Summary of key metrics
    """
    metrics = generate_metrics()
    
    return {
        "totalRevenue": metrics.totalRevenue,
        "profitMargin": metrics.profitMargin,
        "optimizationImpact": metrics.optimizationImpact,
        "profitLeakage": metrics.profitLeakage,
        "timestamp": datetime.now()
    }


@app.get("/dashboard/alerts")
async def get_alerts(severity: Optional[str] = None):
    """
    Get dashboard alerts.
    
    Args:
        severity: Optional filter by severity (critical, warning, info, success)
        
    Returns:
        List of alerts
    """
    alerts = generate_alerts()
    
    if severity:
        alerts = [alert for alert in alerts if alert.severity == severity]
    
    return alerts


@app.get("/dashboard/optimizations")
async def get_optimizations():
    """
    Get optimization recommendations.
    
    Returns:
        List of optimization recommendations
    """
    return generate_optimizations()


@app.post("/dashboard/optimizations/{optimization_id}/apply")
async def apply_optimization(optimization_id: str):
    """
    Apply an optimization recommendation.
    
    Args:
        optimization_id: ID of optimization to apply
        
    Returns:
        Confirmation of applied optimization
    """
    optimizations = generate_optimizations()
    optimization = next((opt for opt in optimizations if opt.id == optimization_id), None)
    
    if not optimization:
        raise HTTPException(
            status_code=404,
            detail=f"Optimization {optimization_id} not found"
        )
    
    # In production, this would actually apply the optimization
    logger.info(f"Applied optimization: {optimization_id}")
    
    return {
        "success": True,
        "optimization_id": optimization_id,
        "title": optimization.title,
        "impact": optimization.impact,
        "applied_at": datetime.now()
    }


@app.get("/dashboard/optimizations/{optimization_id}")
async def get_optimization_details(optimization_id: str):
    """
    Get details of a specific optimization.
    
    Args:
        optimization_id: ID of optimization
        
    Returns:
        Optimization details
    """
    optimizations = generate_optimizations()
    optimization = next((opt for opt in optimizations if opt.id == optimization_id), None)
    
    if not optimization:
        raise HTTPException(
            status_code=404,
            detail=f"Optimization {optimization_id} not found"
        )
    
    return {
        "id": optimization.id,
        "title": optimization.title,
        "description": optimization.description,
        "impact": optimization.impact,
        "confidence": optimization.confidence,
        "expected_revenue_increase": float(optimization.impact.replace("$", "").replace("/day", "").replace(",", "")),
        "implementation_complexity": "medium",
        "estimated_time_to_implement": "2-4 hours",
        "risk_level": "low",
        "dependencies": [],
        "created_at": datetime.now() - timedelta(hours=random.randint(1, 24))
    }


@app.get("/dashboard/charts/revenue")
async def get_revenue_chart():
    """Get revenue chart data."""
    return generate_revenue_data()


@app.get("/dashboard/charts/margin")
async def get_margin_chart():
    """Get profit margin chart data."""
    return generate_margin_data()


@app.get("/dashboard/charts/optimization")
async def get_optimization_chart():
    """Get optimization impact chart data."""
    return generate_optimization_data()


@app.get("/dashboard/charts/services")
async def get_services_chart():
    """Get service type revenue chart data."""
    return generate_service_data()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8003,
        log_level="info"
    )
