from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from typing import Optional, List
from datetime import datetime
import json
import firebase_admin
from firebase_admin import credentials, messaging

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tripo04os_notification"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "localhost:9092"
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"
    FIREBASE_PROJECT_ID: str = ""

settings = Settings()

# Initialize Firebase Admin
try:
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred, options={
        'projectId': settings.FIREBASE_PROJECT_ID,
    })
    firebase_initialized = True
except Exception as e:
    print(f"Firebase initialization failed: {e}")
    firebase_initialized = False

app = FastAPI(
    title="Tripo04OS Notification Service",
    description="Firebase push notifications service",
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
        "service": "notification-service",
        "firebase": "initialized" if firebase_initialized else "not initialized",
    }

@app.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "service": "notification-service",
    }

class PushNotificationRequest:
    token: str
    title: str
    body: str
    data: Optional[dict] = None
    sound: Optional[str] = "default"
    badge: Optional[int] = None

class MulticastNotificationRequest:
    tokens: List[str]
    title: str
    body: str
    data: Optional[dict] = None
    sound: Optional[str] = "default"

class TopicNotificationRequest:
    topic: str
    title: str
    body: str
    data: Optional[dict] = None

@app.post("/api/v1/notifications/send")
async def send_push_notification(request: PushNotificationRequest):
    """Send push notification to a single device"""
    if not firebase_initialized:
        return {"error": "Firebase not initialized"}, 503
    
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=request.title,
                body=request.body,
            ),
            token=request.token,
            data=request.data or {},
            sound=request.sound,
        )
        
        response = messaging.send(message)
        return {
            "success": True,
            "message_id": response,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }, 500

@app.post("/api/v1/notifications/multicast")
async def send_multicast_notification(request: MulticastNotificationRequest):
    """Send push notification to multiple devices"""
    if not firebase_initialized:
        return {"error": "Firebase not initialized"}, 503
    
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=request.title,
                body=request.body,
            ),
            tokens=request.tokens,
            data=request.data or {},
            sound=request.sound,
        )
        
        response = messaging.send_multicast(message)
        return {
            "success": True,
            "success_count": response.success_count,
            "failure_count": response.failure_count,
            "results": [
                {
                    "message_id": r.message_id,
                    "error": r.exception,
                }
                for r in response.responses
            ],
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }, 500

@app.post("/api/v1/notifications/topic")
async def send_topic_notification(request: TopicNotificationRequest):
    """Send push notification to a topic"""
    if not firebase_initialized:
        return {"error": "Firebase not initialized"}, 503
    
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=request.title,
                body=request.body,
            ),
            topic=request.topic,
            data=request.data or {},
        )
        
        response = messaging.send(message)
        return {
            "success": True,
            "message_id": response,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }, 500

# Rider-specific notifications
@app.post("/api/v1/notifications/rider/order-created")
async def rider_order_created(order_id: str, rider_token: str):
    """Notify rider when order is created"""
    return await send_push_notification(PushNotificationRequest(
        token=rider_token,
        title="Order Created",
        body=f"Your order has been created successfully",
        data={"order_id": order_id, "type": "order_created"},
    ))

@app.post("/api/v1/notifications/rider/driver-assigned")
async def rider_driver_assigned(order_id: str, driver_name: str, rider_token: str):
    """Notify rider when driver is assigned"""
    return await send_push_notification(PushNotificationRequest(
        token=rider_token,
        title="Driver Assigned",
        body=f"{driver_name} is on the way to pick you up",
        data={"order_id": order_id, "driver_name": driver_name, "type": "driver_assigned"},
    ))

@app.post("/api/v1/notifications/rider/driver-arrived")
async def rider_driver_arrived(order_id: str, rider_token: str):
    """Notify rider when driver arrives"""
    return await send_push_notification(PushNotificationRequest(
        token=rider_token,
        title="Driver Arrived",
        body="Your driver has arrived at pickup location",
        data={"order_id": order_id, "type": "driver_arrived"},
    ))

@app.post("/api/v1/notifications/rider/trip-started")
async def rider_trip_started(order_id: str, rider_token: str):
    """Notify rider when trip starts"""
    return await send_push_notification(PushNotificationRequest(
        token=rider_token,
        title="Trip Started",
        body="Enjoy your ride!",
        data={"order_id": order_id, "type": "trip_started"},
    ))

@app.post("/api/v1/notifications/rider/trip-completed")
async def rider_trip_completed(order_id: str, rider_token: str):
    """Notify rider when trip is completed"""
    return await send_push_notification(PushNotificationRequest(
        token=rider_token,
        title="Trip Completed",
        body="Please rate your driver",
        data={"order_id": order_id, "type": "trip_completed"},
    ))

# Driver-specific notifications
@app.post("/api/v1/notifications/driver/new-order")
async def driver_new_order(order_id: str, pickup_location: str, driver_token: str):
    """Notify driver of new order"""
    return await send_push_notification(PushNotificationRequest(
        token=driver_token,
        title="New Order Available",
        body=f"New order from {pickup_location}",
        data={"order_id": order_id, "type": "new_order"},
    ))

@app.post("/api/v1/notifications/driver/order-accepted")
async def driver_order_accepted(order_id: str, rider_name: str, driver_token: str):
    """Notify driver when order is accepted"""
    return await send_push_notification(PushNotificationRequest(
        token=driver_token,
        title="Order Accepted",
        body=f"You've accepted the order for {rider_name}",
        data={"order_id": order_id, "rider_name": rider_name, "type": "order_accepted"},
    ))

@app.post("/api/v1/notifications/driver/trip-completed")
async def driver_trip_completed(order_id: str, fare: float, driver_token: str):
    """Notify driver when trip is completed"""
    return await send_push_notification(PushNotificationRequest(
        token=driver_token,
        title="Trip Completed",
        body=f"Trip completed. Fare: ${fare:.2f}",
        data={"order_id": order_id, "fare": fare, "type": "trip_completed"},
    ))

# Emergency notifications
@app.post("/api/v1/notifications/emergency/sos")
async def emergency_sos(order_id: str, location: dict, rider_token: str, driver_token: str):
    """Send emergency SOS notification"""
    notification = {
        "title": "EMERGENCY: SOS Activated",
        "body": "Emergency alert triggered",
        "data": {"order_id": order_id, "location": location, "type": "emergency_sos"},
    }
    
    # Send to both rider and driver
    await send_push_notification(PushNotificationRequest(
        token=rider_token,
        **notification,
        sound="emergency.mp3",
    ))
    
    await send_push_notification(PushNotificationRequest(
        token=driver_token,
        **notification,
        sound="emergency.mp3",
    ))

# Topic subscriptions
@app.post("/api/v1/notifications/subscribe")
async def subscribe_to_topic(token: str, topic: str):
    """Subscribe a device to a topic"""
    if not firebase_initialized:
        return {"error": "Firebase not initialized"}, 503
    
    try:
        response = messaging.subscribe_to_topic([token], topic)
        return {
            "success": True,
            "topic": topic,
            "errors": response.errors,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }, 500

@app.post("/api/v1/notifications/unsubscribe")
async def unsubscribe_from_topic(token: str, topic: str):
    """Unsubscribe a device from a topic"""
    if not firebase_initialized:
        return {"error": "Firebase not initialized"}, 503
    
    try:
        response = messaging.unsubscribe_from_topic([token], topic)
        return {
            "success": True,
            "topic": topic,
            "errors": response.errors,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }, 500
