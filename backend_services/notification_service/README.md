# Notification Service

Tripo04OS Notification Service - Firebase Cloud Messaging for push notifications to mobile and web clients.

## Overview

The Notification Service is a FastAPI-based microservice that provides:
- **Push Notifications**: Send notifications to iOS and Android devices via Firebase
- **Multicast Messaging**: Send bulk notifications to multiple devices
- **Topic Messaging**: Subscribe devices to topics and send targeted broadcasts
- **Rider Notifications**: Order lifecycle notifications for riders
- **Driver Notifications**: Order and trip notifications for drivers
- **Emergency Alerts**: SOS notifications with high priority

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Push Service**: Firebase Cloud Messaging (FCM)
- **HTTP Client**: httpx

## Features

### Push Notification Types

1. **Single Device**: Send notification to one device
2. **Multicast**: Send to multiple devices at once
3. **Topic**: Subscribe to topics and send to all subscribers

### Use Cases

- Order created, accepted, started, completed
- Driver assigned, arrived
- Emergency SOS alerts
- Marketing and promotional messages

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| POST | `/api/v1/notifications/send` | Send single notification |
| POST | `/api/v1/notifications/multicast` | Send multicast notification |
| POST | `/api/v1/notifications/topic` | Send topic notification |
| POST | `/api/v1/notifications/subscribe` | Subscribe to topic |
| POST | `/api/v1/notifications/unsubscribe` | Unsubscribe from topic |

### Rider-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications/rider/order-created` | Order created notification |
| POST | `/api/v1/notifications/rider/driver-assigned` | Driver assigned notification |
| POST | `/api/v1/notifications/rider/driver-arrived` | Driver arrived notification |
| POST | `/api/v1/notifications/rider/trip-started` | Trip started notification |
| POST | `/api/v1/notifications/rider/trip-completed` | Trip completed notification |

### Driver-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications/driver/new-order` | New order notification |
| POST | `/api/v1/notifications/driver/order-accepted` | Order accepted notification |
| POST | `/api/v1/notifications/driver/trip-completed` | Trip completed notification |

### Emergency Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications/emergency/sos` | Emergency SOS notification |

## Quick Start

### Prerequisites

- Python 3.11+
- Firebase project with FCM enabled
- Firebase service account credentials

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Download Firebase credentials
# Place firebase-credentials.json in the project root
```

### Firebase Setup

1. Go to Firebase Console
2. Create a new project or select existing
3. Enable Cloud Messaging
4. Generate service account key
5. Save as `firebase-credentials.json`

### Development

```bash
# Run in development mode
uvicorn app.main:app --host 0.0.0.0 --port 8015 --reload
```

### Production

```bash
# Run with uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8015 --workers 4
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `postgresql://...` | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection string |
| `KAFKA_BROKERS` | No | `localhost:9092` | Kafka brokers |
| `FIREBASE_CREDENTIALS_PATH` | Yes | `firebase-credentials.json` | Firebase service account file |
| `FIREBASE_PROJECT_ID` | Yes | - | Firebase project ID |
| `PORT` | No | 8015 | Service port |

### Firebase Credentials

Create a `firebase-credentials.json` file:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Usage Examples

### Send Single Notification

```bash
curl -X POST "http://localhost:8015/api/v1/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "device_fcm_token",
    "title": "Hello",
    "body": "This is a test notification",
    "data": {"order_id": "12345"},
    "sound": "default"
  }'
```

Response:
```json
{
  "success": true,
  "message_id": "projects/xxx/messages/xxx",
  "timestamp": "2026-01-10T12:00:00"
}
```

### Send Multicast Notification

```bash
curl -X POST "http://localhost:8015/api/v1/notifications/multicast" \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": ["token1", "token2", "token3"],
    "title": "Promotion",
    "body": "50% off your next ride!",
    "sound": "default"
  }'
```

### Send Topic Notification

```bash
curl -X POST "http://localhost:8015/api/v1/notifications/topic" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "new_orders",
    "title": "New Order",
    "body": "New order available in your area",
    "data": {"order_id": "12345"}
  }'
```

### Subscribe to Topic

```bash
curl -X POST "http://localhost:8015/api/v1/notifications/subscribe?token=device_token&topic=new_orders"
```

### Rider Order Created Notification

```bash
curl -X POST "http://localhost:8015/api/v1/notifications/rider/order-created?order_id=12345&rider_token=device_token"
```

## Integration with Other Services

### Order Service
- Calls notification endpoints on order lifecycle events
- Notifies rider when order is created
- Notifies driver when new order is available

### Trip Service
- Notifies rider on driver assignment
- Notifies rider on driver arrival
- Notifies both parties on trip completion

### Safety Service
- Sends emergency SOS notifications
- High priority notifications for safety alerts

## Topic Structure

### Driver Topics
- `drivers_{city}`: All drivers in a city
- `drivers_online`: Currently online drivers
- `new_orders_{area}`: Orders in specific area

### Rider Topics
- `riders_{city}`: All riders in a city
- `promotions`: Marketing notifications

## Notification Priority

| Priority | Use Case | Sound |
|----------|-----------|-------|
| Normal | Updates, confirmations | default |
| High | Order alerts | default |
| Urgent | Emergency SOS | emergency.mp3 |

## Error Handling

The service handles common Firebase FCM errors:
- Invalid registration token
- Message rate exceeded
- Authentication errors
- Device not registered

## Monitoring

### Health Check

```bash
curl http://localhost:8015/health
```

Response:
```json
{
  "status": "healthy",
  "service": "notification-service",
  "firebase": "initialized"
}
```

### Readiness Check

```bash
curl http://localhost:8015/ready
```

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Docker

```bash
docker build -t notification-service .
docker run -p 8015:8015 \
  -v $(pwd)/firebase-credentials.json:/app/firebase-credentials.json \
  -e FIREBASE_PROJECT_ID=your-project-id \
  notification-service
```

## Troubleshooting

### Firebase Not Initialized
- Check `firebase-credentials.json` file exists
- Verify Firebase project ID in environment
- Check service account permissions

### Notifications Not Delivered
- Verify device tokens are valid
- Check Firebase Console for delivery status
- Ensure app is in foreground/background appropriately

### High Latency
- Check Firebase project quotas
- Review notification queue size
- Consider increasing worker count

## Security

- Never commit `firebase-credentials.json` to version control
- Use environment variables for sensitive data
- Implement token validation and authorization
- Rate limit notification endpoints

## Best Practices

1. **Batch Notifications**: Use multicast for multiple devices
2. **Topic Subscriptions**: Group users by interest
3. **Data Payloads**: Keep data payloads small (< 4KB)
4. **Error Handling**: Always handle Firebase errors gracefully
5. **Token Refresh**: Handle token refresh from clients
6. **Rate Limiting**: Implement rate limiting for API endpoints

## License

Proprietary - Tripo04OS Internal Use Only
