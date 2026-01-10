from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from typing import List, Optional
from datetime import datetime
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tripo04os_email"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "localhost:9092"
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "noreply@tripo04os.com"
    SENDGRID_FROM_NAME: str = "Tripo04OS"
    SIMULATE_EMAIL: bool = True  # Simulate instead of sending real email


settings = Settings()

# Initialize SendGrid
sendgrid_client = (
    SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
    if settings.SENDGRID_API_KEY
    else None
)

# Email storage (simulation)
email_history = []

app = FastAPI(
    title="Tripo04OS Email Service",
    description="SendGrid email service with simulation mode",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmailRequest:
    to: str
    subject: str
    body: str
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    html: Optional[bool] = False
    category: Optional[str] = None


class BulkEmailRequest:
    recipients: List[str]
    subject: str
    body: str
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    html: Optional[bool] = False


class EmailLog:
    id: str
    to: str
    subject: str
    from_email: str
    from_name: str
    timestamp: str
    status: str
    simulated: bool
    category: Optional[str]


def generate_email_id() -> str:
    return f"email_{datetime.now().strftime('%Y%m%d%H%M%S')}_{hash(datetime.now().isoformat()) % 10000:04d}"


async def send_email_simulation(
    to: str,
    subject: str,
    body: str,
    from_email: str = None,
    from_name: str = None,
    html: bool = False,
    category: str = None,
) -> EmailLog:
    """Simulate sending email (local development)"""
    email_log = EmailLog(
        id=generate_email_id(),
        to=to,
        subject=subject,
        from_email=from_email or settings.SENDGRID_FROM_EMAIL,
        from_name=from_name or settings.SENDGRID_FROM_NAME,
        timestamp=datetime.now().isoformat(),
        status="delivered" if settings.SIMULATE_EMAIL else "sent",
        simulated=settings.SIMULATE_EMAIL,
        category=category,
    )

    email_history.append(email_log)

    # In real implementation, this would call SendGrid API
    # For local development, we just log it
    print(f"[EMAIL SIMULATION] To: {to} | Subject: {subject}")
    print(
        f"From: {from_name or settings.SENDGRID_FROM_NAME} <{from_email or settings.SENDGRID_FROM_EMAIL}>"
    )
    print(f"Type: {'HTML' if html else 'Plain Text'}")
    print(f"Category: {category or 'None'}")
    print(f"Body: {body[:200]}...")
    print(f"Timestamp: {email_log.timestamp}")
    print(f"Status: {email_log.status}")
    print("-" * 50)

    return email_log


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "email-service",
        "sendgrid": "configured" if sendgrid_client else "not configured",
        "mode": "simulation" if settings.SIMULATE_EMAIL else "production",
    }


@app.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "service": "email-service",
    }


@app.get("/api/v1/email/history")
async def get_email_history(
    limit: int = 100,
    email: Optional[str] = None,
    status: Optional[str] = None,
):
    """Get email sending history"""
    filtered_history = email_history

    if email:
        filtered_history = [e for e in filtered_history if e.to == email]

    if status:
        filtered_history = [e for e in filtered_history if e.status == status]

    return {
        "email_logs": filtered_history[-limit:],
        "total": len(filtered_history),
    }


@app.get("/api/v1/email/stats")
async def get_email_stats():
    """Get email sending statistics"""
    delivered = len([e for e in email_history if e.status == "delivered"])
    sent = len([e for e in email_history if e.status == "sent"])
    failed = len([e for e in email_history if e.status == "failed"])

    return {
        "total_sent": len(email_history),
        "delivered": delivered,
        "sent": sent,
        "failed": failed,
        "simulation_mode": settings.SIMULATE_EMAIL,
    }


@app.post("/api/v1/email/send")
async def send_single_email(request: EmailRequest):
    """Send a single email"""
    try:
        email_log = await send_email_simulation(
            to=request.to,
            subject=request.subject,
            body=request.body,
            from_email=request.from_email or settings.SENDGRID_FROM_EMAIL,
            from_name=request.from_name or settings.SENDGRID_FROM_NAME,
            html=request.html or False,
            category=request.category,
        )

        return {
            "success": True,
            "email_id": email_log.id,
            "status": email_log.status,
            "simulated": email_log.simulated,
            "timestamp": email_log.timestamp,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }, 500


@app.post("/api/v1/email/send-bulk")
async def send_bulk_email(request: BulkEmailRequest):
    """Send bulk email to multiple recipients"""
    try:
        results = []
        for recipient in request.recipients:
            email_log = await send_email_simulation(
                to=recipient,
                subject=request.subject,
                body=request.body,
                from_email=request.from_email or settings.SENDGRID_FROM_EMAIL,
                from_name=request.from_name or settings.SENDGRID_FROM_NAME,
                html=request.html or False,
            )
            results.append(
                {
                    "email": recipient,
                    "email_id": email_log.id,
                    "status": email_log.status,
                }
            )

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


# Rider-specific emails
@app.post("/api/v1/email/rider/order-created")
async def rider_order_created(email: str, order_id: str, rider_name: str):
    """Send order creation email to rider"""
    subject = "Your Tripo04OS Order Has Been Created"
    body = f"""
    Hi {rider_name},
    
    Your order #{order_id} has been created successfully!
    
    You can track your order in the app or contact our support if you have any questions.
    
    Thank you for choosing Tripo04OS!
    
    Best regards,
    The Tripo04OS Team
    """
    return await send_single_email(
        EmailRequest(
            to=email,
            subject=subject,
            body=body,
            html=False,
            category="order_created",
        )
    )


@app.post("/api/v1/email/rider/receipt")
async def rider_receipt(email: str, order_id: str, amount: float):
    """Send receipt email to rider"""
    subject = f"Receipt for Order #{order_id}"
    body = f"""
    Dear Customer,
    
    Thank you for using Tripo04OS!
    
    Order ID: {order_id}
    Amount Paid: ${amount:.2f}
    
    A detailed receipt has been attached to this email.
    
    Thank you for choosing Tripo04OS!
    
    Best regards,
    The Tripo04OS Team
    """
    return await send_single_email(
        EmailRequest(
            to=email,
            subject=subject,
            body=body,
            html=False,
            category="receipt",
        )
    )


@app.post("/api/v1/email/rider/password-reset")
async def rider_password_reset(email: str, reset_link: str):
    """Send password reset email"""
    subject = "Reset Your Tripo04OS Password"
    body = f"""
    Hello,
    
    We received a request to reset your password for your Tripo04OS account.
    
    Please click the link below to reset your password:
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request this password reset, please ignore this email.
    
    Best regards,
    The Tripo04OS Team
    """
    return await send_single_email(
        EmailRequest(
            to=email,
            subject=subject,
            body=body,
            html=False,
            category="password_reset",
        )
    )


# Driver-specific emails
@app.post("/api/v1/email/driver/welcome")
async def driver_welcome(email: str, driver_name: str):
    """Send welcome email to new driver"""
    subject = "Welcome to Tripo04OS!"
    body = f"""
    Hi {driver_name},
    
    Welcome to the Tripo04OS driver team!
    
    Your account has been approved and you can start accepting orders.
    
    Make sure to:
    - Keep your profile updated
    - Maintain a high rating
    - Accept orders in your area
    - Stay safe on the road
    
    If you have any questions, don't hesitate to reach out to our support team.
    
    Safe driving!
    
    Best regards,
    The Tripo04OS Team
    """
    return await send_single_email(
        EmailRequest(
            to=email,
            subject=subject,
            body=body,
            html=False,
            category="driver_welcome",
        )
    )


@app.post("/api/v1/email/driver/earnings")
async def driver_earnings(email: str, week: str, earnings: float, trips: int):
    """Send weekly earnings summary to driver"""
    subject = f"Your Earnings for Week {week}"
    body = f"""
    Hello,
    
    Here's your earnings summary for week {week}:
    
    Total Earnings: ${earnings:.2f}
    Total Trips: {trips}
    Average per Trip: ${earnings / trips:.2f if trips > 0 else 0}
    
    Keep up the great work!
    
    Best regards,
    The Tripo04OS Team
    """
    return await send_single_email(
        EmailRequest(
            to=email,
            subject=subject,
            body=body,
            html=False,
            category="earnings_summary",
        )
    )


@app.post("/api/v1/email/test")
async def test_email():
    """Test email sending"""
    test_email_address = "test@example.com"
    test_subject = "This is a test email from Tripo04OS Email Service"
    test_body = """
    This is a test email from the Tripo04OS Email Service.
    
    If you're seeing this, the service is working correctly!
    
    Best regards,
    The Tripo04OS Team
    """

    result = await send_single_email(
        EmailRequest(
            to=test_email_address,
            subject=test_subject,
            body=test_body,
        )
    )

    return {
        "test_result": result,
        "message": "Test email sent (simulation mode)",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8017)
