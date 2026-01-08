"""
User Mobile App (Rider) - Booking Flow Screens
Implements booking flow screens for the Tripo04OS rider mobile application
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


class ServiceType(BaseModel):
    """Service type enum."""
    service: str  # RIDE, MOTO, FOOD, GROCERY, GOODS, TRUCK_VAN


class VehicleType(BaseModel):
    """Vehicle type for rides."""
    vehicle_type: str  # SEDAN, SUV, LUXURY_SEDAN, LUXURY_SUV, MOTO, SCOOTER


class BookingRequest(BaseModel):
    """Booking request model."""
    pickup_location: Location
    dropoff_location: Location
    service_type: ServiceType
    vehicle_type: Optional[VehicleType] = None
    scheduled_time: Optional[datetime] = None
    special_requests: List[str] = Field(default_factory=list)
    promo_code: Optional[str] = None
    payment_method_id: Optional[str] = None


class FareEstimate(BaseModel):
    """Fare estimate model."""
    base_fare: float
    distance_fare: float
    time_fare: float
    total_fare: float
    currency: str = "USD"
    distance_km: float
    estimated_time_minutes: int
    breakdown: Dict[str, float]


class DriverOption(BaseModel):
    """Driver option model."""
    driver_id: str
    name: str
    rating: float
    total_rides: int
    vehicle_type: str
    vehicle_plate: str
    photo_url: Optional[str] = None
    eta_minutes: int
    fare_estimate: float


class BookingConfirmation(BaseModel):
    """Booking confirmation model."""
    booking_id: str
    pickup_location: Location
    dropoff_location: Location
    service_type: str
    vehicle_type: str
    scheduled_time: datetime
    estimated_pickup_time: datetime
    fare_estimate: float
    currency: str = "USD"
    status: str = "CONFIRMED"


# Create FastAPI app
app = FastAPI(
    title="User Mobile App (Rider) - Booking Flow API",
    description="API for rider mobile application booking flow screens",
    version="1.0.0"
)


# In-memory storage (in production, use database)
bookings: dict = {}
promo_codes: dict = {
    "NEXT20": {"discount": 0.20, "min_order": 15.0, "expires": datetime.now() + timedelta(days=7)},
    "FIRSTFREE": {"discount": 1.0, "min_order": 10.0, "expires": datetime.now() + timedelta(days=30)},
    "WEEKEND15": {"discount": 0.15, "min_order": 0.0, "expires": datetime.now() + timedelta(days=14)}
}


@app.get("/booking/step1_select_service", response_model=dict)
async def step1_select_service():
    """
    Step 1: Select Service Type
    User chooses the type of service they need
    """
    return {
        "step": 1,
        "screen": "select_service",
        "title": "What do you need?",
        "subtitle": "Choose a service to get started",
        "service_types": [
            {
                "type": "RIDE",
                "name": "Ride",
                "icon": "🚗",
                "description": "Get a ride to your destination",
                "estimated_time": "5-10 min pickup",
                "popular": True
            },
            {
                "type": "MOTO",
                "name": "Moto",
                "icon": "🏍",
                "description": "Fast motorcycle ride",
                "estimated_time": "3-5 min pickup",
                "popular": False
            },
            {
                "type": "FOOD",
                "name": "Food Delivery",
                "icon": "🍔",
                "description": "Order food from your favorite restaurants",
                "estimated_time": "20-40 min delivery",
                "popular": True
            },
            {
                "type": "GROCERY",
                "name": "Grocery",
                "icon": "🛒",
                "description": "Get groceries delivered to your door",
                "estimated_time": "30-60 min delivery",
                "popular": False
            },
            {
                "type": "GOODS",
                "name": "Goods",
                "icon": "📦",
                "description": "Send packages and parcels",
                "estimated_time": "15-30 min pickup",
                "popular": False
            },
            {
                "type": "TRUCK_VAN",
                "name": "Truck/Van",
                "icon": "🚚",
                "description": "Large item delivery or moving",
                "estimated_time": "10-20 min pickup",
                "popular": False
            }
        ],
        "selected_service": None,
        "next_step": "/booking/step2_select_vehicle"
    }


@app.get("/booking/step2_select_vehicle", response_model=dict)
async def step2_select_vehicle(service_type: str = "RIDE"):
    """
    Step 2: Select Vehicle Type
    User chooses the type of vehicle for their ride
    """
    vehicle_options = get_vehicle_options(service_type)
    
    return {
        "step": 2,
        "screen": "select_vehicle",
        "title": "Choose your ride",
        "subtitle": f"Vehicle options for {service_type}",
        "service_type": service_type,
        "vehicle_types": vehicle_options,
        "selected_vehicle": None,
        "previous_step": "/booking/step1_select_service",
        "next_step": "/booking/step3_enter_locations"
    }


@app.get("/booking/step3_enter_locations", response_model=dict)
async def step3_enter_locations(service_type: str = "RIDE", vehicle_type: str = "SEDAN"):
    """
    Step 3: Enter Pickup and Dropoff Locations
    User enters their pickup and dropoff locations
    """
    return {
        "step": 3,
        "screen": "enter_locations",
        "title": "Where to?",
        "subtitle": "Enter your pickup and dropoff locations",
        "service_type": service_type,
        "vehicle_type": vehicle_type,
        "pickup_location": {
            "placeholder": "Enter pickup location",
            "current_location": "Use current location",
            "recent_locations": get_recent_locations(),
            "favorite_destinations": get_favorite_destinations()
        },
        "dropoff_location": {
            "placeholder": "Enter destination",
            "recent_locations": get_recent_locations(),
            "favorite_destinations": get_favorite_destinations()
        },
        "previous_step": "/booking/step2_select_vehicle",
        "next_step": "/booking/step4_estimate_fare"
    }


@app.post("/booking/step4_estimate_fare", response_model=dict)
async def step4_estimate_fare(
    pickup_location: Location,
    dropoff_location: Location,
    service_type: str = "RIDE",
    vehicle_type: str = "SEDAN"
):
    """
    Step 4: Fare Estimate
    Display fare estimate based on locations and selections
    """
    # Calculate distance and fare
    distance_km = calculate_distance(
        pickup_location.latitude,
        pickup_location.longitude,
        dropoff_location.latitude,
        dropoff_location.longitude
    )
    
    fare_estimate = calculate_fare(service_type, vehicle_type, distance_km)
    
    return {
        "step": 4,
        "screen": "fare_estimate",
        "title": "Fare Estimate",
        "subtitle": "Your estimated fare",
        "service_type": service_type,
        "vehicle_type": vehicle_type,
        "pickup_location": pickup_location,
        "dropoff_location": dropoff_location,
        "distance_km": round(distance_km, 2),
        "estimated_time_minutes": estimate_time(service_type, distance_km),
        "fare_estimate": fare_estimate,
        "promo_code": {
            "placeholder": "Enter promo code",
            "available_promos": get_available_promos()
        },
        "previous_step": "/booking/step3_enter_locations",
        "next_step": "/booking/step5_select_payment"
    }


@app.post("/booking/step5_select_payment", response_model=dict)
async def step5_select_payment(
    pickup_location: Location,
    dropoff_location: Location,
    service_type: str = "RIDE",
    vehicle_type: str = "SEDAN",
    promo_code: Optional[str] = None
):
    """
    Step 5: Select Payment Method
    User selects their preferred payment method
    """
    # Calculate fare with promo code if provided
    distance_km = calculate_distance(
        pickup_location.latitude,
        pickup_location.longitude,
        dropoff_location.latitude,
        dropoff_location.longitude
    )
    
    fare_estimate = calculate_fare(service_type, vehicle_type, distance_km)
    
    # Apply promo code discount
    discount = 0.0
    if promo_code and promo_code in promo_codes:
        promo = promo_codes[promo_code]
        if fare_estimate >= promo["min_order"]:
            discount = fare_estimate * promo["discount"]
    
    final_fare = fare_estimate - discount
    
    return {
        "step": 5,
        "screen": "select_payment",
        "title": "Payment Method",
        "subtitle": "Choose how you want to pay",
        "service_type": service_type,
        "vehicle_type": vehicle_type,
        "pickup_location": pickup_location,
        "dropoff_location": dropoff_location,
        "fare_estimate": fare_estimate,
        "discount": discount,
        "final_fare": final_fare,
        "currency": "USD",
        "payment_methods": get_payment_methods(),
        "selected_payment_method": None,
        "previous_step": "/booking/step4_estimate_fare",
        "next_step": "/booking/step6_review_confirm"
    }


@app.post("/booking/step6_review_confirm", response_model=dict)
async def step6_review_confirm(request: BookingRequest):
    """
    Step 6: Review and Confirm
    User reviews booking details and confirms
    """
    # Calculate fare
    distance_km = calculate_distance(
        request.pickup_location.latitude,
        request.pickup_location.longitude,
        request.dropoff_location.latitude,
        request.dropoff_location.longitude
    )
    
    fare_estimate = calculate_fare(request.service_type.service, request.vehicle_type.vehicle_type if request.vehicle_type else "SEDAN", distance_km)
    
    # Apply promo code discount
    discount = 0.0
    if request.promo_code and request.promo_code in promo_codes:
        promo = promo_codes[request.promo_code]
        if fare_estimate >= promo["min_order"]:
            discount = fare_estimate * promo["discount"]
    
    final_fare = fare_estimate - discount
    
    return {
        "step": 6,
        "screen": "review_confirm",
        "title": "Review Your Booking",
        "subtitle": "Please review your booking details",
        "booking_details": {
            "service_type": request.service_type.service,
            "vehicle_type": request.vehicle_type.vehicle_type if request.vehicle_type else "SEDAN",
            "pickup_location": request.pickup_location,
            "dropoff_location": request.dropoff_location,
            "scheduled_time": request.scheduled_time or datetime.now(),
            "special_requests": request.special_requests
        },
        "fare_breakdown": {
            "distance_km": round(distance_km, 2),
            "estimated_time_minutes": estimate_time(request.service_type.service, distance_km),
            "base_fare": get_base_fare(request.service_type.service),
            "distance_fare": distance_km * 1.5,
            "promo_discount": discount,
            "total_fare": final_fare,
            "currency": "USD"
        },
        "payment_method": get_payment_method(request.payment_method_id),
        "terms_and_conditions": {
            "cancellation_policy": "Free cancellation up to 5 minutes after booking",
            "refund_policy": "Full refund if cancelled before pickup",
            "safety_guidelines": "All drivers are verified and insured"
        },
        "previous_step": "/booking/step5_select_payment",
        "confirm_action": "/booking/confirm_booking"
    }


@app.post("/booking/confirm_booking", response_model=dict)
async def confirm_booking(request: BookingRequest):
    """
    Confirm Booking
    Finalize the booking and create the order
    """
    # Generate booking ID
    booking_id = generate_booking_id()
    
    # Calculate fare
    distance_km = calculate_distance(
        request.pickup_location.latitude,
        request.pickup_location.longitude,
        request.dropoff_location.latitude,
        request.dropoff_location.longitude
    )
    
    fare_estimate = calculate_fare(request.service_type.service, request.vehicle_type.vehicle_type if request.vehicle_type else "SEDAN", distance_km)
    
    # Apply promo code discount
    discount = 0.0
    if request.promo_code and request.promo_code in promo_codes:
        promo = promo_codes[request.promo_code]
        if fare_estimate >= promo["min_order"]:
            discount = fare_estimate * promo["discount"]
    
    final_fare = fare_estimate - discount
    
    # Create booking
    booking = {
        "booking_id": booking_id,
        "pickup_location": request.pickup_location,
        "dropoff_location": request.dropoff_location,
        "service_type": request.service_type.service,
        "vehicle_type": request.vehicle_type.vehicle_type if request.vehicle_type else "SEDAN",
        "scheduled_time": request.scheduled_time or datetime.now(),
        "special_requests": request.special_requests,
        "promo_code": request.promo_code,
        "payment_method_id": request.payment_method_id,
        "distance_km": distance_km,
        "estimated_time_minutes": estimate_time(request.service_type.service, distance_km),
        "fare_estimate": final_fare,
        "discount": discount,
        "currency": "USD",
        "status": "SEARCHING",
        "created_at": datetime.now()
    }
    
    bookings[booking_id] = booking
    
    logger.info(f"Booking confirmed: {booking_id}")
    
    return {
        "screen": "booking_confirmed",
        "title": "Booking Confirmed!",
        "message": "Finding the best driver for you",
        "booking": booking,
        "next_action": "/tracking/ride",
        "estimated_pickup_time": "5-10 minutes"
    }


@app.get("/booking/schedule", response_model=dict)
async def schedule_booking():
    """
    Schedule a future ride
    """
    return {
        "screen": "schedule_booking",
        "title": "Schedule a Ride",
        "subtitle": "Book a ride for later",
        "date_picker": {
            "min_date": datetime.now(),
            "max_date": datetime.now() + timedelta(days=30)
        },
        "time_picker": {
            "min_time": "00:00",
            "max_time": "23:59",
            "interval_minutes": 15
        },
        "service_types": [
            {"type": "RIDE", "name": "Ride", "icon": "🚗"},
            {"type": "MOTO", "name": "Moto", "icon": "🏍"}
        ],
        "vehicle_types": [
            {"type": "SEDAN", "name": "Sedan", "capacity": 4},
            {"type": "SUV", "name": "SUV", "capacity": 6}
        ],
        "scheduled_rides": get_scheduled_rides()
    }


@app.post("/booking/schedule", response_model=dict)
async def create_scheduled_booking(request: BookingRequest):
    """
    Create a scheduled booking
    """
    if not request.scheduled_time:
        raise HTTPException(status_code=400, detail="Scheduled time is required for scheduled bookings")
    
    booking_id = generate_booking_id()
    
    # Calculate fare
    distance_km = calculate_distance(
        request.pickup_location.latitude,
        request.pickup_location.longitude,
        request.dropoff_location.latitude,
        request.dropoff_location.longitude
    )
    
    fare_estimate = calculate_fare(request.service_type.service, request.vehicle_type.vehicle_type if request.vehicle_type else "SEDAN", distance_km)
    
    # Apply promo code discount
    discount = 0.0
    if request.promo_code and request.promo_code in promo_codes:
        promo = promo_codes[request.promo_code]
        if fare_estimate >= promo["min_order"]:
            discount = fare_estimate * promo["discount"]
    
    final_fare = fare_estimate - discount
    
    # Create booking
    booking = {
        "booking_id": booking_id,
        "pickup_location": request.pickup_location,
        "dropoff_location": request.dropoff_location,
        "service_type": request.service_type.service,
        "vehicle_type": request.vehicle_type.vehicle_type if request.vehicle_type else "SEDAN",
        "scheduled_time": request.scheduled_time,
        "special_requests": request.special_requests,
        "promo_code": request.promo_code,
        "payment_method_id": request.payment_method_id,
        "distance_km": distance_km,
        "estimated_time_minutes": estimate_time(request.service_type.service, distance_km),
        "fare_estimate": final_fare,
        "discount": discount,
        "currency": "USD",
        "status": "SCHEDULED",
        "created_at": datetime.now()
    }
    
    bookings[booking_id] = booking
    
    logger.info(f"Scheduled booking created: {booking_id}")
    
    return {
        "screen": "scheduled_booking_confirmed",
        "title": "Ride Scheduled!",
        "message": "Your ride has been scheduled",
        "booking": booking,
        "scheduled_for": request.scheduled_time.strftime("%A, %B %d, %Y at %I:%M %p")
    }


@app.get("/booking/{booking_id}", response_model=dict)
async def get_booking(booking_id: str):
    """
    Get booking details by ID
    """
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {
        "booking": bookings[booking_id]
    }


@app.put("/booking/{booking_id}/cancel", response_model=dict)
async def cancel_booking(booking_id: str):
    """
    Cancel a booking
    """
    if booking_id not in bookings:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking = bookings[booking_id]
    
    if booking["status"] in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or cancelled booking")
    
    booking["status"] = "CANCELLED"
    booking["cancelled_at"] = datetime.now()
    
    logger.info(f"Booking cancelled: {booking_id}")
    
    return {
        "screen": "booking_cancelled",
        "title": "Booking Cancelled",
        "message": "Your booking has been cancelled",
        "booking_id": booking_id,
        "refund_policy": "Full refund will be processed within 3-5 business days"
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
    
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    # Earth's radius in kilometers
    r = 6371
    
    distance = r * c
    
    return distance


def calculate_fare(service_type: str, vehicle_type: str, distance_km: float) -> float:
    """Calculate fare based on service type, vehicle type, and distance."""
    base_fare = get_base_fare(service_type)
    distance_fare = distance_km * get_distance_rate(service_type, vehicle_type)
    total_fare = base_fare + distance_fare
    
    # Apply vehicle type multiplier
    vehicle_multiplier = get_vehicle_multiplier(vehicle_type)
    total_fare *= vehicle_multiplier
    
    return round(total_fare, 2)


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


def get_distance_rate(service_type: str, vehicle_type: str) -> float:
    """Get distance rate per km."""
    distance_rates = {
        "RIDE": 1.5,
        "MOTO": 1.0,
        "FOOD": 1.2,
        "GROCERY": 1.0,
        "GOODS": 2.0,
        "TRUCK_VAN": 3.0
    }
    return distance_rates.get(service_type, 1.5)


def get_vehicle_multiplier(vehicle_type: str) -> float:
    """Get vehicle type multiplier."""
    multipliers = {
        "SEDAN": 1.0,
        "SUV": 1.3,
        "LUXURY_SEDAN": 1.8,
        "LUXURY_SUV": 2.2,
        "MOTO": 0.7,
        "SCOOTER": 0.6
    }
    return multipliers.get(vehicle_type, 1.0)


def estimate_time(service_type: str, distance_km: float) -> int:
    """Estimate travel time in minutes."""
    time_per_km = {
        "RIDE": 2.0,
        "MOTO": 1.5,
        "FOOD": 2.5,
        "GROCERY": 2.5,
        "GOODS": 2.0,
        "TRUCK_VAN": 2.5
    }
    rate = time_per_km.get(service_type, 2.0)
    return int(distance_km * rate)


def get_vehicle_options(service_type: str) -> List[dict]:
    """Get available vehicle options for service type."""
    if service_type == "RIDE":
        return [
            {
                "type": "SEDAN",
                "name": "Sedan",
                "icon": "🚗",
                "capacity": 4,
                "description": "Standard car",
                "base_fare": 15.0,
                "popular": True
            },
            {
                "type": "SUV",
                "name": "SUV",
                "icon": "🚙",
                "capacity": 6,
                "description": "Larger vehicle",
                "base_fare": 19.5,
                "popular": False
            },
            {
                "type": "LUXURY_SEDAN",
                "name": "Luxury Sedan",
                "icon": "⭐",
                "capacity": 4,
                "description": "Premium car",
                "base_fare": 27.0,
                "popular": False
            },
            {
                "type": "LUXURY_SUV",
                "name": "Luxury SUV",
                "icon": "🌟",
                "capacity": 6,
                "description": "Premium SUV",
                "base_fare": 33.0,
                "popular": False
            }
        ]
    elif service_type == "MOTO":
        return [
            {
                "type": "MOTO",
                "name": "Moto",
                "icon": "🏍",
                "capacity": 1,
                "description": "Motorcycle",
                "base_fare": 8.0,
                "popular": True
            },
            {
                "type": "SCOOTER",
                "name": "Scooter",
                "icon": "🛴",
                "capacity": 1,
                "description": "Electric scooter",
                "base_fare": 6.0,
                "popular": False
            }
        ]
    elif service_type == "FOOD":
        return [
            {
                "type": "STANDARD",
                "name": "Standard Delivery",
                "icon": "🛵",
                "capacity": 1,
                "description": "Standard delivery",
                "base_fare": 12.0,
                "popular": True
            },
            {
                "type": "EXPRESS",
                "name": "Express Delivery",
                "icon": "⚡",
                "capacity": 1,
                "description": "Fast delivery",
                "base_fare": 18.0,
                "popular": False
            }
        ]
    elif service_type == "GROCERY":
        return [
            {
                "type": "STANDARD",
                "name": "Standard Delivery",
                "icon": "🛒",
                "capacity": 1,
                "description": "Standard delivery",
                "base_fare": 10.0,
                "popular": True
            },
            {
                "type": "LARGE",
                "name": "Large Order",
                "icon": "📦",
                "capacity": 1,
                "description": "Large order delivery",
                "base_fare": 15.0,
                "popular": False
            }
        ]
    elif service_type == "GOODS":
        return [
            {
                "type": "STANDARD",
                "name": "Standard",
                "icon": "📦",
                "capacity": 1,
                "description": "Standard package",
                "base_fare": 18.0,
                "popular": True
            },
            {
                "type": "LARGE",
                "name": "Large",
                "icon": "📦",
                "capacity": 1,
                "description": "Large package",
                "base_fare": 25.0,
                "popular": False
            }
        ]
    elif service_type == "TRUCK_VAN":
        return [
            {
                "type": "TRUCK",
                "name": "Truck",
                "icon": "🚚",
                "capacity": 1,
                "description": "Truck delivery",
                "base_fare": 35.0,
                "popular": True
            },
            {
                "type": "VAN",
                "name": "Van",
                "icon": "🚐",
                "capacity": 1,
                "description": "Van delivery",
                "base_fare": 30.0,
                "popular": False
            }
        ]
    return []


def get_recent_locations() -> List[dict]:
    """Get recent locations."""
    return [
        {
            "location_id": "loc_001",
            "name": "Home",
            "address": "123 Main St, Apt 4B, New York, NY 10001",
            "latitude": 40.7128,
            "longitude": -74.0060
        },
        {
            "location_id": "loc_002",
            "name": "Office",
            "address": "456 Park Ave, New York, NY 10011",
            "latitude": 40.7308,
            "longitude": -73.9357
        },
        {
            "location_id": "loc_003",
            "name": "Gym",
            "address": "789 5th Ave, New York, NY 10019",
            "latitude": 40.7308,
            "longitude": -73.9357
        }
    ]


def get_favorite_destinations() -> List[dict]:
    """Get favorite destinations."""
    return [
        {
            "destination_id": "dest_001",
            "name": "JFK Airport",
            "address": "JFK Airport, Queens, NY 11430",
            "latitude": 40.6413,
            "longitude": -73.7781
        },
        {
            "destination_id": "dest_002",
            "name": "LGA Airport",
            "address": "LGA Airport, Queens, NY 11371",
            "latitude": 40.7769,
            "longitude": -73.8740
        }
    ]


def get_available_promos() -> List[dict]:
    """Get available promo codes."""
    return [
        {
            "code": "NEXT20",
            "title": "20% Off Your Next Ride",
            "description": "Get 20% off your next ride",
            "discount": 0.20,
            "min_order": 15.0
        },
        {
            "code": "WEEKEND15",
            "title": "Weekend Special",
            "description": "15% off all rides on weekends",
            "discount": 0.15,
            "min_order": 0.0
        }
    ]


def get_payment_methods() -> List[dict]:
    """Get available payment methods."""
    return [
        {
            "id": "card_1",
            "type": "credit_card",
            "name": "Visa ending in 4242",
            "icon": "💳",
            "is_default": True
        },
        {
            "id": "card_2",
            "type": "credit_card",
            "name": "Mastercard ending in 5555",
            "icon": "💳",
            "is_default": False
        },
        {
            "id": "paypal",
            "type": "paypal",
            "name": "PayPal",
            "icon": "🅿️",
            "is_default": False
        },
        {
            "id": "apple_pay",
            "type": "apple_pay",
            "name": "Apple Pay",
            "icon": "🍎",
            "is_default": False
        },
        {
            "id": "google_pay",
            "type": "google_pay",
            "name": "Google Pay",
            "icon": "🔵",
            "is_default": False
        },
        {
            "id": "cash",
            "type": "cash",
            "name": "Cash",
            "icon": "💵",
            "is_default": False
        }
    ]


def get_payment_method(payment_method_id: Optional[str]) -> Optional[dict]:
    """Get payment method by ID."""
    if not payment_method_id:
        return get_payment_methods()[0]  # Return default
    
    for method in get_payment_methods():
        if method["id"] == payment_method_id:
            return method
    
    return get_payment_methods()[0]  # Return default if not found


def get_scheduled_rides() -> List[dict]:
    """Get scheduled rides."""
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


def generate_booking_id() -> str:
    """Generate unique booking ID."""
    import uuid
    return f"booking_{uuid.uuid4().hex[:8]}"


# Health check endpoint
@app.get("/health", response_model=dict)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "service": "user-mobile-app-rider-booking-flow",
        "endpoints": [
            "/booking/step1_select_service",
            "/booking/step2_select_vehicle",
            "/booking/step3_enter_locations",
            "/booking/step4_estimate_fare",
            "/booking/step5_select_payment",
            "/booking/step6_review_confirm",
            "/booking/confirm_booking",
            "/booking/schedule",
            "/booking/{booking_id}",
            "/booking/{booking_id}/cancel"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting User Mobile App (Rider) Booking Flow API...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8011,
        log_level="info"
    )
