"""
User Mobile App (Rider) - Ride Tracking Screens
Implements ride tracking screens for the Tripo04OS rider mobile application
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


# Pydantic models for API requests/responses
class Location(BaseModel):
    """Location data model."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class DriverInfo(BaseModel):
    """Driver information model."""
    driver_id: str
    name: str
    phone: str
    rating: float
    total_rides: int
    photo_url: Optional[str] = None
    vehicle_type: str
    vehicle_plate: str
    vehicle_color: str


class RideStatus(BaseModel):
    """Ride status model."""
    ride_id: str
    status: str  # SEARCHING, DRIVER_ASSIGNED, ARRIVING, IN_PROGRESS, COMPLETED, CANCELLED
    current_location: Optional[Location] = None
    driver_info: Optional[DriverInfo] = None
    eta_minutes: int
    distance_remaining_km: float
    fare_estimate: float
    currency: str = "USD"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class RoutePoint(BaseModel):
    """Route point model."""
    latitude: float
    longitude: float
    timestamp: datetime
    speed_kmh: Optional[float] = None


class RouteInfo(BaseModel):
    """Route information model."""
    route_id: str
    pickup_location: Location
    dropoff_location: Location
    current_location: Location
    distance_remaining_km: float
    eta_minutes: int
    route_points: List[RoutePoint]
    estimated_arrival_time: datetime


class SafetyFeature(BaseModel):
    """Safety feature model."""
    feature_id: str
    name: str
    icon: str
    description: str
    action: str
    available: bool


class EmergencyContact(BaseModel):
    """Emergency contact model."""
    contact_id: str
    name: str
    phone: str
    relationship: str


# Create FastAPI app
app = FastAPI(
    title="User Mobile App (Rider) - Ride Tracking API",
    description="API for rider mobile application ride tracking screens",
    version="1.0.0"
)


# In-memory storage (in production, use database)
active_rides: dict = {}
emergency_contacts: List[EmergencyContact] = []
ride_history: List[dict] = []


@app.get("/tracking/{ride_id}", response_model=dict)
async def track_ride(ride_id: str):
    """
    Track active ride
    Real-time ride tracking with driver location and ETA
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    return {
        "screen": "ride_tracking",
        "title": "Your Ride",
        "ride_id": ride_id,
        "status": ride_status.status,
        "driver_info": ride_status.driver_info,
        "current_location": ride_status.current_location,
        "eta_minutes": ride_status.eta_minutes,
        "distance_remaining_km": ride_status.distance_remaining_km,
        "pickup_location": ride_status.pickup_location,
        "dropoff_location": ride_status.dropoff_location,
        "fare_estimate": ride_status.fare_estimate,
        "currency": ride_status.currency,
        "started_at": ride_status.started_at,
        "estimated_arrival": datetime.now() + timedelta(minutes=ride_status.eta_minutes),
        "actions": get_ride_actions(ride_status.status),
        "safety_features": get_safety_features()
    }


@app.get("/tracking/{ride_id}/driver", response_model=dict)
async def get_driver_info(ride_id: str):
    """
    Get driver information for active ride
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    if not ride_status.driver_info:
        raise HTTPException(status_code=400, detail="Driver not yet assigned")
    
    driver = ride_status.driver_info
    
    return {
        "screen": "driver_info",
        "title": "Your Driver",
        "driver": {
            "driver_id": driver.driver_id,
            "name": driver.name,
            "phone": driver.phone,
            "rating": driver.rating,
            "total_rides": driver.total_rides,
            "photo_url": driver.photo_url,
            "vehicle": {
                "type": driver.vehicle_type,
                "plate": driver.vehicle_plate,
                "color": driver.vehicle_color
            }
        },
        "actions": [
            {
                "id": "call_driver",
                "title": "Call Driver",
                "icon": "📞",
                "action": f"tel:{driver.phone}"
            },
            {
                "id": "message_driver",
                "title": "Message Driver",
                "icon": "💬",
                "action": "open_chat"
            },
            {
                "id": "share_trip",
                "title": "Share Trip",
                "icon": "🔗",
                "action": "share_trip_link"
            }
        ]
    }


@app.get("/tracking/{ride_id}/route", response_model=dict)
async def get_route(ride_id: str):
    """
    Get route information for active ride
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    # Generate route points (in production, fetch from Navigation Service)
    route_points = generate_route_points(
        ride_status.current_location,
        ride_status.dropoff_location,
        ride_status.distance_remaining_km
    )
    
    return {
        "screen": "route_info",
        "title": "Route",
        "ride_id": ride_id,
        "pickup_location": ride_status.pickup_location,
        "dropoff_location": ride_status.dropoff_location,
        "current_location": ride_status.current_location,
        "distance_remaining_km": ride_status.distance_remaining_km,
        "eta_minutes": ride_status.eta_minutes,
        "estimated_arrival_time": datetime.now() + timedelta(minutes=ride_status.eta_minutes),
        "route_points": route_points,
        "traffic_info": {
            "traffic_level": "moderate",
            "delay_minutes": 2,
            "alternative_routes": 0
        }
    }


@app.get("/tracking/{ride_id}/map", response_model=dict)
async def get_map_view(ride_id: str):
    """
    Get map view for active ride
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    return {
        "screen": "map_view",
        "title": "Live Map",
        "ride_id": ride_id,
        "map_config": {
            "center": {
                "latitude": ride_status.current_location.latitude,
                "longitude": ride_status.current_location.longitude
            },
            "zoom": 15,
            "show_driver": True,
            "show_pickup": True,
            "show_dropoff": True,
            "show_route": True
        },
        "markers": [
            {
                "id": "driver",
                "type": "driver",
                "latitude": ride_status.current_location.latitude,
                "longitude": ride_status.current_location.longitude,
                "icon": "🚗",
                "label": "Driver"
            },
            {
                "id": "pickup",
                "type": "pickup",
                "latitude": ride_status.pickup_location.latitude,
                "longitude": ride_status.pickup_location.longitude,
                "icon": "📍",
                "label": "Pickup"
            },
            {
                "id": "dropoff",
                "type": "dropoff",
                "latitude": ride_status.dropoff_location.latitude,
                "longitude": ride_status.dropoff_location.longitude,
                "icon": "🏁",
                "label": "Destination"
            }
        ],
        "route": {
            "polyline": generate_polyline(
                ride_status.current_location,
                ride_status.dropoff_location
            ),
            "color": "#0066FF",
            "width": 5
        }
    }


@app.get("/tracking/{ride_id}/status", response_model=dict)
async def get_ride_status(ride_id: str):
    """
    Get ride status updates
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    status_messages = {
        "SEARCHING": "Finding the best driver for you...",
        "DRIVER_ASSIGNED": "Your driver is on the way!",
        "ARRIVING": "Driver is arriving at your location",
        "IN_PROGRESS": "You're on your way!",
        "COMPLETED": "Ride completed. Thank you!",
        "CANCELLED": "Ride cancelled."
    }
    
    return {
        "screen": "ride_status",
        "title": "Ride Status",
        "ride_id": ride_id,
        "status": ride_status.status,
        "message": status_messages.get(ride_status.status, "Status unknown"),
        "progress": get_ride_progress(ride_status.status),
        "eta_minutes": ride_status.eta_minutes,
        "distance_remaining_km": ride_status.distance_remaining_km,
        "fare_estimate": ride_status.fare_estimate,
        "currency": ride_status.currency,
        "timestamp": datetime.now()
    }


@app.get("/tracking/{ride_id}/safety", response_model=dict)
async def get_safety_screen(ride_id: str):
    """
    Get safety screen for active ride
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    return {
        "screen": "safety",
        "title": "Safety Center",
        "ride_id": ride_id,
        "safety_features": get_safety_features(),
        "emergency_contacts": emergency_contacts,
        "ride_info": {
            "driver_name": ride_status.driver_info.name if ride_status.driver_info else None,
            "driver_phone": ride_status.driver_info.phone if ride_status.driver_info else None,
            "vehicle_plate": ride_status.driver_info.vehicle_plate if ride_status.driver_info else None,
            "current_location": ride_status.current_location,
            "share_link": f"https://tripo04os.com/share/{ride_id}"
        },
        "actions": [
            {
                "id": "share_trip",
                "title": "Share Trip Status",
                "icon": "🔗",
                "description": "Share your trip with trusted contacts",
                "action": "share_trip"
            },
            {
                "id": "call_emergency",
                "title": "Call Emergency Services",
                "icon": "🚨",
                "description": "Call 911 or local emergency number",
                "action": "tel:911"
            },
            {
                "id": "report_issue",
                "title": "Report an Issue",
                "icon": "🔧",
                "description": "Report a safety concern",
                "action": "report_issue"
            }
        ]
    }


@app.post("/tracking/{ride_id}/share", response_model=dict)
async def share_trip(ride_id: str, contacts: List[str]):
    """
    Share trip status with contacts
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    share_link = f"https://tripo04os.com/share/{ride_id}"
    
    return {
        "screen": "trip_shared",
        "title": "Trip Shared",
        "message": "Trip status shared successfully",
        "share_link": share_link,
        "contacts": contacts,
        "ride_id": ride_id,
        "valid_until": ride_status.completed_at or datetime.now() + timedelta(hours=2)
    }


@app.post("/tracking/{ride_id}/emergency", response_model=dict)
async def emergency_alert(ride_id: str, alert_type: str, message: Optional[str] = None):
    """
    Send emergency alert
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    # In production, send to Safety Service and notify emergency contacts
    logger.warning(f"Emergency alert for ride {ride_id}: {alert_type}")
    
    return {
        "screen": "emergency_alert_sent",
        "title": "Emergency Alert Sent",
        "message": "Your emergency alert has been sent",
        "alert_type": alert_type,
        "message": message,
        "ride_id": ride_id,
        "timestamp": datetime.now(),
        "contacts_notified": len(emergency_contacts)
    }


@app.post("/tracking/{ride_id}/cancel", response_model=dict)
async def cancel_ride(ride_id: str, reason: Optional[str] = None):
    """
    Cancel active ride
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    if ride_status.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or cancelled ride")
    
    # Update ride status
    ride_status.status = "CANCELLED"
    ride_status.cancelled_at = datetime.now()
    ride_status.cancel_reason = reason
    
    logger.info(f"Ride cancelled: {ride_id}, Reason: {reason}")
    
    return {
        "screen": "ride_cancelled",
        "title": "Ride Cancelled",
        "message": "Your ride has been cancelled",
        "ride_id": ride_id,
        "reason": reason,
        "refund_policy": "Full refund will be processed within 3-5 business days"
    }


@app.get("/tracking/{ride_id}/completion", response_model=dict)
async def ride_completion(ride_id: str):
    """
    Ride completion screen
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    if ride_status.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Ride not completed")
    
    return {
        "screen": "ride_completion",
        "title": "Ride Completed!",
        "message": "Thank you for riding with Tripo04OS",
        "ride_id": ride_id,
        "driver_info": ride_status.driver_info,
        "fare": ride_status.fare_estimate,
        "currency": ride_status.currency,
        "duration_minutes": calculate_duration(ride_status.started_at, ride_status.completed_at),
        "distance_km": ride_status.distance_remaining_km,  # This should be total distance
        "actions": [
            {
                "id": "rate_driver",
                "title": "Rate Your Driver",
                "icon": "⭐",
                "action": "rate_driver"
            },
            {
                "id": "add_tip",
                "title": "Add Tip",
                "icon": "💰",
                "action": "add_tip"
            },
            {
                "id": "book_again",
                "title": "Book Again",
                "icon": "🚗",
                "action": "book_again"
            },
            {
                "id": "view_receipt",
                "title": "View Receipt",
                "icon": "🧾",
                "action": "view_receipt"
            }
        ]
    }


@app.post("/tracking/{ride_id}/rate", response_model=dict)
async def rate_driver(ride_id: str, rating: int, feedback: Optional[str] = None):
    """
    Rate driver for completed ride
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    if ride_status.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Can only rate completed rides")
    
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # In production, send to Driver Service to update driver rating
    logger.info(f"Driver rated for ride {ride_id}: {rating}/5")
    
    return {
        "screen": "driver_rated",
        "title": "Thank You!",
        "message": "Your feedback helps us improve",
        "ride_id": ride_id,
        "rating": rating,
        "feedback": feedback,
        "driver_name": ride_status.driver_info.name if ride_status.driver_info else None
    }


@app.post("/tracking/{ride_id}/tip", response_model=dict)
async def add_tip(ride_id: str, tip_amount: float, tip_percentage: Optional[float] = None):
    """
    Add tip for driver
    """
    if ride_id not in active_rides:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride_status = active_rides[ride_id]
    
    if ride_status.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Can only tip for completed rides")
    
    total_fare = ride_status.fare_estimate + tip_amount
    
    logger.info(f"Tip added for ride {ride_id}: ${tip_amount}")
    
    return {
        "screen": "tip_added",
        "title": "Tip Added",
        "message": "Thank you for your generosity!",
        "ride_id": ride_id,
        "tip_amount": tip_amount,
        "tip_percentage": tip_percentage,
        "original_fare": ride_status.fare_estimate,
        "total_fare": total_fare,
        "currency": ride_status.currency
    }


# Helper functions
def get_ride_actions(status: str) -> List[dict]:
    """Get available actions based on ride status."""
    actions = []
    
    if status == "SEARCHING":
        actions.append({
            "id": "cancel",
            "title": "Cancel Ride",
            "icon": "❌",
            "action": "cancel_ride"
        })
    elif status in ["DRIVER_ASSIGNED", "ARRIVING"]:
        actions.extend([
            {
                "id": "call_driver",
                "title": "Call Driver",
                "icon": "📞",
                "action": "call_driver"
            },
            {
                "id": "message_driver",
                "title": "Message Driver",
                "icon": "💬",
                "action": "message_driver"
            },
            {
                "id": "cancel",
                "title": "Cancel Ride",
                "icon": "❌",
                "action": "cancel_ride"
            }
        ])
    elif status == "IN_PROGRESS":
        actions.extend([
            {
                "id": "call_driver",
                "title": "Call Driver",
                "icon": "📞",
                "action": "call_driver"
            },
            {
                "id": "share_trip",
                "title": "Share Trip",
                "icon": "🔗",
                "action": "share_trip"
            },
            {
                "id": "emergency",
                "title": "Emergency",
                "icon": "🚨",
                "action": "emergency"
            }
        ])
    elif status == "COMPLETED":
        actions.extend([
            {
                "id": "rate_driver",
                "title": "Rate Driver",
                "icon": "⭐",
                "action": "rate_driver"
            },
            {
                "id": "add_tip",
                "title": "Add Tip",
                "icon": "💰",
                "action": "add_tip"
            },
            {
                "id": "book_again",
                "title": "Book Again",
                "icon": "🚗",
                "action": "book_again"
            }
        ])
    
    return actions


def get_safety_features() -> List[SafetyFeature]:
    """Get available safety features."""
    return [
        SafetyFeature(
            feature_id="share_trip",
            name="Share Trip",
            icon="🔗",
            description="Share your trip status with trusted contacts",
            action="share_trip",
            available=True
        ),
        SafetyFeature(
            feature_id="emergency_contacts",
            name="Emergency Contacts",
            icon="📱",
            description="Quick access to emergency contacts",
            action="view_emergency_contacts",
            available=True
        ),
        SafetyFeature(
            feature_id="call_emergency",
            name="Call Emergency",
            icon="🚨",
            description="Call emergency services directly",
            action="call_emergency",
            available=True
        ),
        SafetyFeature(
            feature_id="report_issue",
            name="Report Issue",
            icon="🔧",
            description="Report a safety concern",
            action="report_issue",
            available=True
        ),
        SafetyFeature(
            feature_id="ride_check",
            name="Ride Check",
            icon="✅",
            description="Verify driver and vehicle details",
            action="ride_check",
            available=True
        ),
        SafetyFeature(
            feature_id="driver_verification",
            name="Driver Verification",
            icon="🆔",
            description="All drivers are verified and insured",
            action="view_verification",
            available=True
        )
    ]


def get_ride_progress(status: str) -> dict:
    """Get ride progress based on status."""
    progress = {
        "SEARCHING": {"step": 1, "total": 5, "percentage": 20},
        "DRIVER_ASSIGNED": {"step": 2, "total": 5, "percentage": 40},
        "ARRIVING": {"step": 3, "total": 5, "percentage": 60},
        "IN_PROGRESS": {"step": 4, "total": 5, "percentage": 80},
        "COMPLETED": {"step": 5, "total": 5, "percentage": 100},
        "CANCELLED": {"step": 0, "total": 5, "percentage": 0}
    }
    return progress.get(status, {"step": 0, "total": 5, "percentage": 0})


def generate_route_points(start: Location, end: Location, distance_km: float) -> List[RoutePoint]:
    """Generate route points (simplified)."""
    # In production, fetch from Navigation Service
    points = []
    num_points = max(5, int(distance_km * 2))
    
    for i in range(num_points):
        lat = start.latitude + (end.latitude - start.latitude) * (i / num_points)
        lon = start.longitude + (end.longitude - start.longitude) * (i / num_points)
        points.append(RoutePoint(
            latitude=lat,
            longitude=lon,
            timestamp=datetime.now() + timedelta(minutes=i * 2),
            speed_kmh=40.0
        ))
    
    return points


def generate_polyline(start: Location, end: Location) -> str:
    """Generate polyline (simplified)."""
    # In production, use proper polyline encoding
    return f"{start.latitude},{start.longitude}|{end.latitude},{end.longitude}"


def calculate_duration(start: Optional[datetime], end: Optional[datetime]) -> int:
    """Calculate duration in minutes."""
    if start and end:
        duration = end - start
        return int(duration.total_seconds() / 60)
    return 0


# Initialize sample data
def initialize_sample_data():
    """Initialize sample data for demonstration."""
    global active_rides, emergency_contacts
    
    # Sample emergency contacts
    emergency_contacts = [
        EmergencyContact(
            contact_id="contact_001",
            name="Jane Doe",
            phone="+1 234 567 8901",
            relationship="Spouse"
        ),
        EmergencyContact(
            contact_id="contact_002",
            name="John Smith",
            phone="+1 234 567 8902",
            relationship="Friend"
        )
    ]
    
    # Sample active ride
    active_rides["ride_001"] = RideStatus(
        ride_id="ride_001",
        status="IN_PROGRESS",
        current_location=Location(
            latitude=40.7218,
            longitude=-74.0206,
            address="En route to destination",
            city="New York",
            country="USA"
        ),
        driver_info=DriverInfo(
            driver_id="driver_001",
            name="John Smith",
            phone="+1 555 123 4567",
            rating=4.8,
            total_rides=1250,
            photo_url="https://example.com/driver1.jpg",
            vehicle_type="SEDAN",
            vehicle_plate="ABC 123",
            vehicle_color="White"
        ),
        eta_minutes=15,
        distance_remaining_km=8.5,
        fare_estimate=25.50,
        currency="USD",
        started_at=datetime.now() - timedelta(minutes=10),
        completed_at=None,
        pickup_location=Location(
            latitude=40.7128,
            longitude=-74.0060,
            address="123 Main St, New York",
            city="New York",
            country="USA"
        ),
        dropoff_location=Location(
            latitude=40.7308,
            longitude=-73.9357,
            address="JFK Airport, New York",
            city="New York",
            country="USA"
        )
    )


# Initialize data on startup
initialize_sample_data()


# Health check endpoint
@app.get("/health", response_model=dict)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "service": "user-mobile-app-rider-ride-tracking",
        "endpoints": [
            "/tracking/{ride_id}",
            "/tracking/{ride_id}/driver",
            "/tracking/{ride_id}/route",
            "/tracking/{ride_id}/map",
            "/tracking/{ride_id}/status",
            "/tracking/{ride_id}/safety",
            "/tracking/{ride_id}/share",
            "/tracking/{ride_id}/emergency",
            "/tracking/{ride_id}/cancel",
            "/tracking/{ride_id}/completion",
            "/tracking/{ride_id}/rate",
            "/tracking/{ride_id}/tip"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting User Mobile App (Rider) Ride Tracking API...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8012,
        log_level="info"
    )
