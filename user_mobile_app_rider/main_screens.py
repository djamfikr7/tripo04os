"""
User Mobile App (Rider) - Main Screens
Implements core screens for the Tripo04OS rider mobile application
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
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


class ServiceType(BaseModel):
    """Service type enum."""
    service: str  # RIDE, MOTO, FOOD, GROCERY, GOODS, TRUCK_VAN


class VehicleType(BaseModel):
    """Vehicle type for rides."""
    vehicle_type: str  # SEDAN, SUV, LUXURY_SEDAN, LUXURY_SUV, MOTO, SCOOTER


class RideRequest(BaseModel):
    """Ride request model."""
    pickup_location: Location
    dropoff_location: Location
    service_type: ServiceType
    vehicle_type: Optional[VehicleType] = None
    scheduled_time: Optional[datetime] = None
    special_requests: List[str] = Field(default_factory=list)


class RecentLocation(BaseModel):
    """Recent location model."""
    location_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    last_used: datetime


class FavoriteDestination(BaseModel):
    """Favorite destination model."""
    destination_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    service_type: str


class ActiveRide(BaseModel):
    """Active ride model."""
    ride_id: str
    status: str  # SEARCHING, DRIVER_ASSIGNED, ARRIVING, IN_PROGRESS, COMPLETED
    driver_name: str
    driver_rating: float
    driver_photo: Optional[str] = None
    vehicle_type: str
    vehicle_plate: str
    eta_minutes: int
    pickup_location: Location
    dropoff_location: Location
    fare_estimate: float
    currency: str = "USD"


class Promotion(BaseModel):
    """Promotion model."""
    promotion_id: str
    title: str
    description: str
    discount_percentage: float
    valid_until: datetime
    code: Optional[str] = None
    min_order_value: Optional[float] = None


# Create FastAPI app
app = FastAPI(
    title="User Mobile App (Rider) - Main Screens API",
    description="API for rider mobile application main screens and components",
    version="1.0.0"
)


# In-memory storage (in production, use database)
recent_locations: List[RecentLocation] = []
favorite_destinations: List[FavoriteDestination] = []
active_rides: dict = {}
promotions: List[Promotion] = []


@app.get("/home", response_model=dict)
async def home_screen():
    """
    Home screen - Main dashboard for rider app
    Shows quick actions, recent rides, and promotions
    """
    return {
        "screen": "home",
        "title": "Where to?",
        "quick_actions": [
            {
                "id": "book_ride",
                "title": "Book a Ride",
                "icon": "🚗",
                "action": "navigate_to_booking"
            },
            {
                "id": "schedule_ride",
                "title": "Schedule Ride",
                "icon": "📅",
                "action": "navigate_to_scheduling"
            },
            {
                "id": "view_history",
                "title": "Your Trips",
                "icon": "📜",
                "action": "navigate_to_history"
            },
            {
                "id": "view_promotions",
                "title": "Promotions",
                "icon": "🎁",
                "action": "navigate_to_promotions"
            },
            {
                "id": "view_profile",
                "title": "Profile",
                "icon": "👤",
                "action": "navigate_to_profile"
            }
        ],
        "recent_locations": recent_locations[:5],
        "active_ride": get_active_ride(),
        "upcoming_scheduled_rides": get_upcoming_rides(),
        "promotions": promotions[:3]
    }


@app.get("/booking", response_model=dict)
async def booking_screen():
    """
    Booking screen - Request a ride
    Allows user to select service type, vehicle type, and locations
    """
    return {
        "screen": "booking",
        "title": "Book a Ride",
        "service_types": [
            {"type": "RIDE", "name": "Ride", "icon": "🚗", "description": "Car ride"},
            {"type": "MOTO", "name": "Moto", "icon": "🏍", "description": "Motorcycle ride"},
            {"type": "FOOD", "name": "Food Delivery", "icon": "🍔", "description": "Food delivery"},
            {"type": "GROCERY", "name": "Grocery", "icon": "🛒", "description": "Grocery delivery"},
            {"type": "GOODS", "name": "Goods", "icon": "📦", "description": "Package delivery"},
            {"type": "TRUCK_VAN", "name": "Truck/Van", "icon": "🚚", "description": "Truck or van delivery"}
        ],
        "vehicle_types": [
            {"type": "SEDAN", "name": "Sedan", "capacity": 4, "icon": "🚗"},
            {"type": "SUV", "name": "SUV", "capacity": 6, "icon": "🚙"},
            {"type": "LUXURY_SEDAN", "name": "Luxury Sedan", "capacity": 4, "icon": "⭐"},
            {"type": "LUXURY_SUV", "name": "Luxury SUV", "capacity": 6, "icon": "🌟"},
            {"type": "MOTO", "name": "Moto", "capacity": 1, "icon": "🏍"},
            {"type": "SCOOTER", "name": "Scooter", "capacity": 1, "icon": "🛴"}
        ],
        "pickup_location": None,
        "dropoff_location": None,
        "selected_service": None,
        "selected_vehicle": None,
        "scheduled_time": None,
        "special_requests": [
            "Child seat required",
            "Pet-friendly vehicle",
            "Wheelchair accessible",
            "Extra luggage space",
            "Quiet ride"
        ],
        "favorite_destinations": favorite_destinations[:5],
        "recent_locations": recent_locations[:10]
    }


@app.post("/booking/estimate", response_model=dict)
async def estimate_fare(request: RideRequest):
    """
    Get fare estimate for a ride
    """
    # In production, call Pricing Service API
    # For now, return mock estimate
    distance_km = calculate_distance(
        request.pickup_location.latitude,
        request.pickup_location.longitude,
        request.dropoff_location.latitude,
        request.dropoff_location.longitude
    )
    
    # Mock pricing calculation
    base_fare = get_base_fare(request.service_type.service)
    distance_fare = distance_km * 1.5  # $1.50 per km
    total_fare = base_fare + distance_fare
    
    return {
        "screen": "booking",
        "action": "fare_estimate",
        "pickup_location": request.pickup_location,
        "dropoff_location": request.dropoff_location,
        "distance_km": round(distance_km, 2),
        "estimated_time_minutes": int(distance_km * 2),  # 2 minutes per km
        "base_fare": round(base_fare, 2),
        "distance_fare": round(distance_fare, 2),
        "total_fare": round(total_fare, 2),
        "currency": "USD",
        "service_type": request.service_type.service,
        "vehicle_type": request.vehicle_type.vehicle_type if request.vehicle_type else None
    }


@app.post("/booking/confirm", response_model=dict)
async def confirm_booking(request: RideRequest):
    """
    Confirm and create booking
    """
    # In production, call Order Service API
    booking_id = generate_booking_id()
    
    # Create booking
    booking = {
        "booking_id": booking_id,
        "pickup_location": request.pickup_location,
        "dropoff_location": request.dropoff_location,
        "service_type": request.service_type.service,
        "vehicle_type": request.vehicle_type.vehicle_type if request.vehicle_type else "SEDAN",
        "scheduled_time": request.scheduled_time or datetime.now(),
        "status": "SEARCHING",
        "created_at": datetime.now()
    }
    
    active_rides[booking_id] = ActiveRide(
        ride_id=booking_id,
        status="SEARCHING",
        driver_name="Searching for driver...",
        driver_rating=0.0,
        driver_photo=None,
        vehicle_type=request.vehicle_type.vehicle_type if request.vehicle_type else "SEDAN",
        vehicle_plate="",
        eta_minutes=5,
        pickup_location=request.pickup_location,
        dropoff_location=request.dropoff_location,
        fare_estimate=0.0,
        currency="USD"
    )
    
    logger.info(f"Booking created: {booking_id}")
    
    return {
        "screen": "booking",
        "action": "booking_confirmed",
        "booking_id": booking_id,
        "status": "SEARCHING",
        "message": "Finding the best driver for you",
        "estimated_pickup_time": "5-10 minutes"
    }


@app.get("/booking/scheduled", response_model=dict)
async def scheduled_rides():
    """
    View scheduled rides
    """
    return {
        "screen": "scheduled_rides",
        "title": "Scheduled Rides",
        "upcoming_rides": get_upcoming_rides(),
        "past_rides": get_past_rides(),
        "total_scheduled": len(get_upcoming_rides())
    }


@app.get("/history", response_model=dict)
async def ride_history():
    """
    Ride history screen
    Shows past rides with details
    """
    return {
        "screen": "history",
        "title": "Your Trips",
        "filters": {
            "date_range": {
                "id": "date_range",
                "label": "Date Range",
                "options": [
                    {"value": "today", "label": "Today"},
                    {"value": "week", "label": "This Week"},
                    {"value": "month", "label": "This Month"},
                    {"value": "all", "label": "All Time"}
                ]
            },
            "service_type": {
                "id": "service_type",
                "label": "Service Type",
                "options": [
                    {"value": "all", "label": "All Services"},
                    {"value": "RIDE", "label": "Ride"},
                    {"value": "MOTO", "label": "Moto"},
                    {"value": "FOOD", "label": "Food"},
                    {"value": "GROCERY", "label": "Grocery"},
                    {"value": "GOODS", "label": "Goods"},
                    {"value": "TRUCK_VAN", "label": "Truck/Van"}
                ]
            },
            "status": {
                "id": "status",
                "label": "Status",
                "options": [
                    {"value": "all", "label": "All"},
                    {"value": "completed", "label": "Completed"},
                    {"value": "cancelled", "label": "Cancelled"},
                    {"value": "in_progress", "label": "In Progress"}
                ]
            }
        },
        "rides": get_past_rides(),
        "total_rides": len(get_past_rides()),
        "statistics": {
            "total_rides": len(get_past_rides()),
            "total_spent": sum(ride["fare"] for ride in get_past_rides()),
            "average_rating": sum(ride["driver_rating"] for ride in get_past_rides()) / len(get_past_rides()) if get_past_rides() else 0
        }
    }


@app.get("/promotions", response_model=dict)
async def promotions_screen():
    """
    Promotions screen
    Shows available promotions and discounts
    """
    return {
        "screen": "promotions",
        "title": "Promotions & Discounts",
        "promotions": promotions,
        "total_promotions": len(promotions)
    }


@app.get("/profile", response_model=dict)
async def profile_screen():
    """
    Profile screen
    User profile and settings
    """
    return {
        "screen": "profile",
        "title": "Profile",
        "user_info": {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+1 234 567 8900",
            "profile_picture": "https://example.com/avatar.jpg",
            "member_since": "2024-01-01",
            "rating": 4.8,
            "total_rides": 150
        },
        "payment_methods": [
            {
                "id": "card_1",
                "type": "credit_card",
                "last_four": "4242",
                "expiry": "12/25",
                "is_default": True
            },
            {
                "id": "card_2",
                "type": "credit_card",
                "last_four": "5555",
                "expiry": "06/25",
                "is_default": False
            },
            {
                "id": "paypal",
                "type": "paypal",
                "email": "john.doe@paypal.com",
                "is_default": False
            }
        ],
        "settings": {
            "notifications": {
                "push_notifications": True,
                "email_notifications": True,
                "sms_notifications": False
            },
            "preferences": {
                "preferred_service_type": "RIDE",
                "preferred_vehicle_type": "SEDAN",
                "language": "en",
                "currency": "USD"
            },
            "privacy": {
                "share_location": True,
                "share_ride_history": False,
                "allow_driver_contact": True
            }
        }
    }


@app.get("/support", response_model=dict)
async def support_screen():
    """
    Support screen
    Access to help and support
    """
    return {
        "screen": "support",
        "title": "Help & Support",
        "support_options": [
            {
                "id": "chat",
                "title": "Chat with Support",
                "icon": "💬",
                "description": "Chat with our AI-powered support team",
                "action": "open_chat"
            },
            {
                "id": "faq",
                "title": "FAQ",
                "icon": "❓",
                "description": "Frequently asked questions",
                "action": "open_faq"
            },
            {
                "id": "report_issue",
                "title": "Report an Issue",
                "icon": "🔧",
                "description": "Report a problem with your ride",
                "action": "open_report_form"
            },
            {
                "id": "call_support",
                "title": "Call Support",
                "icon": "📞",
                "description": "Call our support team",
                "action": "call_support"
            }
        ],
        "contact_info": {
            "phone": "+1 800 123 4567",
            "email": "support@tripo04os.com",
            "hours": "24/7"
        }
    }


# Helper functions
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates (Haversine formula)."""
    import math
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    lon1_rad = math.radians(lon1)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2) ** 2
    c = math.cos(lat1_rad) * math.cos(lat2_rad) * math.cos(dlat / 2)
    
    b = math.cos(lat1_rad) * math.sin(lat2_rad) * math.sin(dlat / 2)
    c2 = math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(dlat / 2)
    
    d = 2 * math.asin(math.sqrt(a + b) / 2)
    
    # Earth's radius in kilometers
    r = 6371
    
    distance = r * d
    
    return distance


def get_base_fare(service_type: str) -> float:
    """Get base fare for service type."""
    base_fares = {
        "RIDE": 15.0,
        "MOTO": 8.0,
        "FOOD": 12.0,
        "GROCERY": 10.0,
        "GOODS": 18.0,
        "TRUCK_VAN": 35.0
    }
    return base_fares.get(service_type, 15.0)


def generate_booking_id() -> str:
    """Generate unique booking ID."""
    import uuid
    return f"booking_{uuid.uuid4().hex[:8]}"


def get_active_ride() -> Optional[dict]:
    """Get active ride if exists."""
    if active_rides:
        ride_id = list(active_rides.keys())[0]
        ride = active_rides[ride_id]
        return {
            "ride_id": ride.ride_id,
            "status": ride.status,
            "driver_name": ride.driver_name,
            "driver_rating": ride.driver_rating,
            "driver_photo": ride.driver_photo,
            "vehicle_type": ride.vehicle_type,
            "vehicle_plate": ride.vehicle_plate,
            "eta_minutes": ride.eta_minutes,
            "pickup_location": ride.pickup_location,
            "dropoff_location": ride.dropoff_location,
            "fare_estimate": ride.fare_estimate,
            "currency": ride.currency
        }
    return None


def get_upcoming_rides() -> List[dict]:
    """Get upcoming scheduled rides."""
    # In production, fetch from Order Service
    # For now, return mock data
    return [
        {
            "ride_id": "scheduled_001",
            "pickup_time": datetime.now() + timedelta(hours=2),
            "pickup_location": {"latitude": 40.7128, "longitude": -74.0060, "address": "123 Main St, New York"},
            "dropoff_location": {"latitude": 40.7308, "longitude": -73.9357, "address": "JFK Airport, New York"},
            "service_type": "RIDE",
            "vehicle_type": "SEDAN",
            "status": "scheduled"
        }
    ]


def get_past_rides() -> List[dict]:
    """Get past rides."""
    # In production, fetch from Order Service
    # For now, return mock data
    return [
        {
            "ride_id": "ride_001",
            "pickup_time": datetime.now() - timedelta(days=1),
            "pickup_location": {"latitude": 40.7128, "longitude": -74.0060, "address": "123 Main St, New York"},
            "dropoff_location": {"latitude": 40.7308, "longitude": -73.9357, "address": "JFK Airport, New York"},
            "service_type": "RIDE",
            "vehicle_type": "SEDAN",
            "status": "completed",
            "driver_name": "John Smith",
            "driver_rating": 4.8,
            "driver_photo": "https://example.com/driver1.jpg",
            "vehicle_plate": "ABC 123",
            "fare": 25.50,
            "currency": "USD",
            "duration_minutes": 25
        },
        {
            "ride_id": "ride_002",
            "pickup_time": datetime.now() - timedelta(days=2),
            "pickup_location": {"latitude": 40.7128, "longitude": -74.0060, "address": "456 Park Ave, New York"},
            "dropoff_location": {"latitude": 40.7308, "longitude": -73.9357, "address": "Times Square, New York"},
            "service_type": "MOTO",
            "vehicle_type": "MOTO",
            "status": "completed",
            "driver_name": "Jane Doe",
            "driver_rating": 4.9,
            "driver_photo": "https://example.com/driver2.jpg",
            "vehicle_plate": "XYZ 456",
            "fare": 12.00,
            "currency": "USD",
            "duration_minutes": 15
        }
    ]


# Initialize sample data
def initialize_sample_data():
    """Initialize sample data for demonstration."""
    global recent_locations, favorite_destinations, promotions
    
    # Sample recent locations
    recent_locations = [
        RecentLocation(
            location_id="loc_001",
            name="Home",
            address="123 Main St, Apt 4B, New York, NY 10001",
            latitude=40.7128,
            longitude=-74.0060,
            city="New York",
            country="USA",
            last_used=datetime.now() - timedelta(hours=2)
        ),
        RecentLocation(
            location_id="loc_002",
            name="Office",
            address="456 Park Ave, New York, NY 10011",
            latitude=40.7308,
            longitude=-73.9357,
            city="New York",
            country="USA",
            last_used=datetime.now() - timedelta(hours=5)
        ),
        RecentLocation(
            location_id="loc_003",
            name="Gym",
            address="789 5th Ave, New York, NY 10019",
            latitude=40.7308,
            longitude=-73.9357,
            city="New York",
            country="USA",
            last_used=datetime.now() - timedelta(hours=1)
        )
    ]
    
    # Sample favorite destinations
    favorite_destinations = [
        FavoriteDestination(
            destination_id="dest_001",
            name="JFK Airport",
            address="JFK Airport, Queens, NY 11430",
            latitude=40.6413,
            longitude=-73.7781,
            service_type="RIDE"
        ),
        FavoriteDestination(
            destination_id="dest_002",
            name="LGA Airport",
            address="LGA Airport, Queens, NY 11371",
            latitude=40.7769,
            longitude=-73.8740,
            service_type="RIDE"
        ),
        FavoriteDestination(
            destination_id="dest_003",
            name="Grand Central Terminal",
            address="89 E 42nd St, New York, NY 10017",
            latitude=40.7527,
            longitude=-73.9774,
            service_type="RIDE"
        )
    ]
    
    # Sample promotions
    promotions = [
        Promotion(
            promotion_id="promo_001",
            title="20% Off Your Next Ride",
            description="Get 20% off your next ride booked through the app",
            discount_percentage=20.0,
            valid_until=datetime.now() + timedelta(days=7),
            code="NEXT20",
            min_order_value=15.0
        ),
        Promotion(
            promotion_id="promo_002",
            title="Free Delivery on Your First Order",
            description="Get free delivery on your first food order",
            discount_percentage=100.0,
            valid_until=datetime.now() + timedelta(days=30),
            code="FIRSTFREE",
            min_order_value=10.0
        ),
        Promotion(
            promotion_id="promo_003",
            title="Weekend Special",
            description="15% off all rides on weekends",
            discount_percentage=15.0,
            valid_until=datetime.now() + timedelta(days=14),
            code="WEEKEND15"
            min_order_value=None
        )
    ]


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
        "service": "user-mobile-app-rider"
        "endpoints": [
            "/home",
            "/booking",
            "/booking/estimate",
            "/booking/confirm",
            "/booking/scheduled",
            "/history",
            "/promotions",
            "/profile",
            "/support"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting User Mobile App (Rider) API...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8010,
        log_level="info"
    )
