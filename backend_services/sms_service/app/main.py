from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from typing import List, Optional
from datetime import datetime
import json
import asyncio

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tripo04os_sms"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "localhost:9092"
    SIMULATE_SMS: bool = True  # Simulate instead of sending real SMS
    SMS_LOG_FILE: str = "sms_logs.json"

settings = Settings()

# SMS storage (simulation)
sms_history = []

app = FastAPI(
    title="Tripo04OS SMS Service",
    description="Local SMS simulation service (no Twilio)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SMSRequest:
    to: str
    message: str
    from_number: Optional[str] = "Tripo04OS"
    priority: Optional[str] = "normal"  # normal, high, urgent

class OTPRequest:
    phone: str
    code: str
    expiry_minutes: int = 5

class BulkSMSRequest:
    recipients: List[str]
    message: str
    from_number: Optional[str] = "Tripo04OS"

class SMSLog:
    id: str
    to: str
    message: str
    from_number: str
    timestamp: str
    status: str
    simulated: bool
    priority: str

def generate_sms_id() -> str:
    return f"sms_{datetime.now().strftime('%Y%m%d%H%M%S')}_{hash(datetime.now().isoformat()) % 10000:04d}"

async def send_sms_simulation(to: str, message: str, from_number: str = "Tripo04OS", priority: str = "normal") -> SMSLog:
    """Simulate sending SMS (local development)"""
    sms_log = SMSLog(
        id=generate_sms_id(),
        to=to,
        message=message,
        from_number=from_number,
        timestamp=datetime.now().isoformat(),
        status="delivered" if settings.SIMULATE_SMS else "sent",
        simulated=settings.SIMULATE_SMS,
        priority=priority,
    )
    
    sms_history.append(sms_log)
    
    # In real implementation, this would call Twilio API
    # For local development, we just log it
    print(f"[SMS SIMULATION] To: {to} | From: {from_number} | Priority: {priority}")
    print(f"Message: {message}")
    print(f"Timestamp: {sms_log.timestamp}")
    print(f"Status: {sms_log.status}")
    print("-" * 50)
    
    return sms_log

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    import random
    return f"{random.randint(100000, 999999)}"

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "sms-service",
        "mode": "simulation" if settings.SIMULATE_SMS else "production",
    }

@app.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "service": "sms-service",
    }

@app.get("/api/v1/sms/history")
async def get_sms_history(
    limit: int = 100,
    phone: Optional[str] = None,
    status: Optional[str] = None,
):
    """Get SMS sending history"""
    filtered_history = sms_history
    
    if phone:
        filtered_history = [sms for sms in filtered_history if sms.to == phone]
    
    if status:
        filtered_history = [sms for sms in filtered_history if sms.status == status]
    
    return {
        "sms_logs": filtered_history[-limit:],
        "total": len(filtered_history),
    }

@app.get("/api/v1/sms/stats")
async def get_sms_stats():
    """Get SMS sending statistics"""
    delivered = len([sms for sms in sms_history if sms.status == "delivered"])
    sent = len([sms for sms in sms_history if sms.status == "sent"])
    failed = len([sms for sms in sms_history if sms.status == "failed"])
    
    return {
        "total_sent": len(sms_history),
        "delivered": delivered,
        "sent": sent,
        "failed": failed,
        "simulation_mode": settings.SIMULATE_SMS,
    }

@app.post("/api/v1/sms/send")
async def send_single_sms(request: SMSRequest):
    """Send a single SMS"""
    try:
        sms_log = await send_sms_simulation(
            to=request.to,
            message=request.message,
            from_number=request.from_number or "Tripo04OS",
            priority=request.priority or "normal",
        )
        
        return {
            "success": True,
            "sms_id": sms_log.id,
            "status": sms_log.status,
            "simulated": sms_log.simulated,
            "timestamp": sms_log.timestamp,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }, 500

@app.post("/api/v1/sms/send-bulk")
async def send_bulk_sms(request: BulkSMSRequest):
    """Send bulk SMS to multiple recipients"""
    try:
        results = []
        for recipient in request.recipients:
            sms_log = await send_sms_simulation(
                to=recipient,
                message=request.message,
                from_number=request.from_number or "Tripo04OS",
                priority="normal",
            )
            results.append({
                "phone": recipient,
                "sms_id": sms_log.id,
                "status": sms_log.status,
            })
        
        return {
            "success": True,
            "total_sent": len(results),
            "results": results,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }, 500

@app.post("/api/v1/sms/otp/send")
async def send_otp(request: OTPRequest):
    """Send OTP for phone verification"""
    otp = generate_otp()
    message = f"Your Tripo04OS verification code is: {otp}\nValid for {request.expiry_minutes} minutes."
    
    sms_log = await send_sms_simulation(
        to=request.phone,
        message=message,
        from_number="Tripo04OS Verify",
        priority="high",
    )
    
    # Store OTP in Redis or database for verification
    # For simulation, we'll return it
    return {
        "success": True,
        "sms_id": sms_log.id,
        "otp": otp,  # In production, don't return this
        "expiry_minutes": request.expiry_minutes,
        "timestamp": sms_log.timestamp,
    }

@app.post("/api/v1/sms/otp/verify")
async def verify_otp(phone: str, code: str):
    """Verify OTP code"""
    # In production, check Redis/database
    # For simulation, always return success
    return {
        "success": True,
        "verified": True,
        "phone": phone,
        "timestamp": datetime.now().isoformat(),
    }

# Rider-specific SMS notifications
@app.post("/api/v1/sms/rider/order-created")
async def rider_order_created(phone: str, order_id: str):
    """Send order creation SMS to rider"""
    message = f"Your Tripo04OS order #{order_id} has been created successfully. Track your ride in the app."
    return await send_single_sms(SMSRequest(to=phone, message=message))

@app.post("/api/v1/sms/rider/driver-assigned")
async def rider_driver_assigned(phone: str, driver_name: str, order_id: str):
    """Send driver assignment SMS to rider"""
    message = f"{driver_name} is on the way! Track your order #{order_id} in the app."
    return await send_single_sms(SMSRequest(to=phone, message=message, priority="high"))

@app.post("/api/v1/sms/rider/driver-arrived")
async def rider_driver_arrived(phone: str):
    """Send driver arrival SMS to rider"""
    message = "Your driver has arrived at the pickup location. Please be ready!"
    return await send_single_sms(SMSRequest(to=phone, message=message, priority="high"))

@app.post("/api/v1/sms/rider/trip-started")
async def rider_trip_started(phone: str):
    """Send trip started SMS to rider"""
    message = "Your trip has started. Enjoy your ride with Tripo04OS!"
    return await send_single_sms(SMSRequest(to=phone, message=message))

@app.post("/api/v1/sms/rider/trip-completed")
async def rider_trip_completed(phone: str, order_id: str):
    """Send trip completion SMS to rider"""
    message = f"Your trip has been completed. Thank you for choosing Tripo04OS! Order #{order_id}"
    return await send_single_sms(SMSRequest(to=phone, message=message))

# Driver-specific SMS notifications
@app.post("/api/v1/sms/driver/new-order")
async def driver_new_order(phone: str, pickup_location: str, order_id: str):
    """Send new order SMS to driver"""
    message = f"New order available from {pickup_location}. Order ID: {order_id}. Open your app to accept."
    return await send_single_sms(SMSRequest(to=phone, message=message, priority="high"))

@app.post("/api/v1/sms/driver/order-accepted")
async def driver_order_accepted(phone: str, order_id: str):
    """Send order accepted SMS to driver"""
    message = f"You've accepted order #{order_id}. Navigate to pickup location."
    return await send_single_sms(SMSRequest(to=phone, message=message))

@app.post("/api/v1/sms/driver/trip-completed")
async def driver_trip_completed(phone: str, fare: float, order_id: str):
    """Send trip completion SMS to driver"""
    message = f"Trip completed. Order #{order_id}. Fare: ${fare:.2f}. Earnings: No new orders nearby. Keep your app open!"
    return await send_single_sms(SMSRequest(to=phone, message=message))

# Emergency SMS
@app.post("/api/v1/sms/emergency/sos")
async def emergency_sos(phone: str, location: dict):
    """Send emergency SOS SMS"""
    message = f"EMERGENCY SOS ACTIVATED at location: {location.get('address', 'Unknown coordinates')}. Emergency team has been alerted."
    return await send_single_sms(SMSRequest(to=phone, message=message, priority="urgent"))

@app.get("/api/v1/sms/test")
async def test_sms():
    """Test SMS sending"""
    test_phone = "+1234567890"
    test_message = "This is a test SMS from Tripo04OS SMS Service"
    
    result = await send_single_sms(SMSRequest(to=test_phone, message=test_message))
    
    return {
        "test_result": result,
        "message": "Test SMS sent (simulation mode)",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8016)
