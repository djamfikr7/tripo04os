# SMS Service

Tripo04OS SMS Service - Send SMS messages via Twilio with simulation mode for local development.

## Overview

The SMS Service is a FastAPI-based microservice that provides:
- **Single SMS**: Send individual messages
- **Bulk SMS**: Send to multiple recipients
- **OTP**: Generate and send one-time passwords
- **Rider Notifications**: Order lifecycle SMS for riders
- **Driver Notifications**: Order and trip SMS for drivers
- **Emergency Alerts**: SOS notifications with high priority

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **SMS Provider**: Twilio (production)
- **Development**: Simulation mode (local)

## Features

### SMS Types

1. **Single Messages**: Send to one recipient
2. **Bulk Messages**: Send to multiple recipients at once
3. **OTP Messages**: Generate and send verification codes
4. **Priority Messages**: Normal, high, and urgent priority

### Use Cases

- Phone number verification (OTP)
- Order notifications (created, driver assigned, arrived)
- Trip notifications (started, completed)
- Emergency alerts (SOS)
- Promotional messages

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/api/v1/sms/history` | Get SMS history |
| GET | `/api/v1/sms/stats` | Get SMS statistics |
| POST | `/api/v1/sms/send` | Send single SMS |
| POST | `/api/v1/sms/send-bulk` | Send bulk SMS |
| POST | `/api/v1/sms/otp/send` | Send OTP |
| POST | `/api/v1/sms/otp/verify` | Verify OTP |
| GET | `/api/v1/sms/test` | Test SMS sending |

### Rider-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sms/rider/order-created` | Order created notification |
| POST | `/api/v1/sms/rider/driver-assigned` | Driver assigned notification |
| POST | `/api/v1/sms/rider/driver-arrived` | Driver arrived notification |
| POST | `/api/v1/sms/rider/trip-started` | Trip started notification |
| POST | `/api/v1/sms/rider/trip-completed` | Trip completed notification |

### Driver-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sms/driver/new-order` | New order notification |
| POST | `/api/v1/sms/driver/order-accepted` | Order accepted notification |
| POST | `/api/v1/sms/driver/trip-completed` | Trip completed notification |

### Emergency Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sms/emergency/sos` | Emergency SOS notification |

## Quick Start

### Prerequisites

- Python 3.11+
- Twilio account (for production)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### Twilio Setup

1. Create a Twilio account
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Add credentials to `.env`

### Development

```bash
# Run in development mode (simulation)
uvicorn app.main:app --host 0.0.0.0 --port 8016 --reload
```

### Production

```bash
# Run with uvicorn (production mode)
SIMULATE_SMS=false uvicorn app.main:app --host 0.0.0.0 --port 8016 --workers 4
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `postgresql://...` | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection string |
| `KAFKA_BROKERS` | No | `localhost:9092` | Kafka brokers |
| `SIMULATE_SMS` | No | `true` | Simulate SMS instead of sending |
| `TWILIO_ACCOUNT_SID` | No | - | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | No | - | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | No | - | Twilio phone number |
| `PORT` | No | 8016 | Service port |

## Usage Examples

### Send Single SMS

```bash
curl -X POST "http://localhost:8016/api/v1/sms/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from Tripo04OS!",
    "from_number": "Tripo04OS",
    "priority": "normal"
  }'
```

Response:
```json
{
  "success": true,
  "sms_id": "sms_20260110120000_1234",
  "status": "delivered",
  "simulated": true,
  "timestamp": "2026-01-10T12:00:00"
}
```

### Send Bulk SMS

```bash
curl -X POST "http://localhost:8016/api/v1/sms/send-bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["+1234567890", "+1987654321"],
    "message": "Special offer: 50% off your next ride!",
    "from_number": "Tripo04OS"
  }'
```

### Send OTP

```bash
curl -X POST "http://localhost:8016/api/v1/sms/otp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "code": "123456",
    "expiry_minutes": 5
  }'
```

Response:
```json
{
  "success": true,
  "sms_id": "sms_20260110120000_5678",
  "otp": "123456",
  "expiry_minutes": 5,
  "timestamp": "2026-01-10T12:00:00"
}
```

### Rider Order Created Notification

```bash
curl -X POST "http://localhost:8016/api/v1/sms/rider/order-created?phone=+1234567890&order_id=12345"
```

### Test SMS

```bash
curl http://localhost:8016/api/v1/sms/test
```

## Integration with Other Services

### Identity Service
- Sends OTP for phone verification
- Handles user authentication flows

### Order Service
- Sends order creation confirmation
- Notifies rider of order status changes

### Trip Service
- Sends trip updates to both parties
- Sends completion notifications

### Safety Service
- Sends emergency SOS notifications
- High priority alerts

## SMS Priorities

| Priority | Use Case | Description |
|----------|-----------|-------------|
| Normal | Promotions, confirmations | Standard delivery speed |
| High | Order alerts, driver updates | Faster delivery |
| Urgent | Emergency SOS | Immediate delivery |

## OTP Flow

1. User requests phone verification
2. Service generates 6-digit OTP
3. Service sends OTP via SMS
4. User enters OTP in app
5. Service verifies OTP code
6. Access granted if valid

## Rate Limiting

Twilio has rate limits:
- **Free tier**: Limited messages per day
- **Production**: Higher limits with paid plans
- **Recommended**: Implement rate limiting per phone number

## Monitoring

### Health Check

```bash
curl http://localhost:8016/health
```

Response:
```json
{
  "status": "healthy",
  "service": "sms-service",
  "mode": "simulation"
}
```

### Get SMS Statistics

```bash
curl http://localhost:8016/api/v1/sms/stats
```

Response:
```json
{
  "total_sent": 100,
  "delivered": 95,
  "sent": 0,
  "failed": 5,
  "simulation_mode": true
}
```

### Get SMS History

```bash
curl "http://localhost:8016/api/v1/sms/history?limit=10&phone=+1234567890"
```

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Docker

```bash
docker build -t sms-service .
docker run -p 8016:8016 \
  -e TWILIO_ACCOUNT_SID=ACxxx \
  -e TWILIO_AUTH_TOKEN=xxx \
  -e TWILIO_PHONE_NUMBER=+1234567890 \
  -e SIMULATE_SMS=false \
  sms-service
```

## Troubleshooting

### SMS Not Sending
- Check Twilio credentials
- Verify phone number format (+1XXXXXXXXXX)
- Check account balance
- Review Twilio console for errors

### OTP Verification Fails
- Ensure OTP is stored correctly in Redis/database
- Check OTP expiry time
- Verify OTP format (6 digits)

### Simulation Mode
- `SIMULATE_SMS=true` enables simulation
- Messages are logged instead of sent
- Useful for local development

## Security

- Never commit Twilio credentials to version control
- Use environment variables for sensitive data
- Implement rate limiting
- Validate phone number formats
- Log all SMS sends for audit trail

## Best Practices

1. **OTP Storage**: Store OTPs in Redis with TTL
2. **Rate Limiting**: Limit SMS per phone number
3. **Message Length**: Keep messages under 160 characters
4. **International Numbers**: Format with country code (+1)
5. **Error Handling**: Handle Twilio API errors gracefully
6. **Simulation Mode**: Use simulation for development/testing

## License

Proprietary - Tripo04OS Internal Use Only
