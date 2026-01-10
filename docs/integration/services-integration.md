# Services Integration Guide

This document describes how all Tripo04OS services integrate with each other and the external services.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API Gateway (Port 8080)                    │
└────────────────────────┬────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬────────────────┐
        │                │                │                │
┌───────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Order      │  │   Trip       │  │   Matching   │  │   Pricing    │
│   Service    │  │   Service    │  │   Service    │  │   Service    │
│   :8001      │  │   :8003      │  │   :8005      │  │   :8006      │
└───────┬──────┘  └───────┬──────┘  └──────┬──────┘  └──────┬──────┘
        │                 │                │                │
        └────────────────┼────────────────┘                │
                         │                               │
        ┌────────────────┼────────────────┬────────────────┴────────────────┐
        │                │                │                           │
┌───────▼──────┐  ┌───────▼──────┐  ┌────────────▼──────────┐  ┌──────▼──────┐
│   Identity   │  │   Location    │  │   Payment            │  │   Maps       │
│   Service    │  │   Service    │  │   Service           │  │   Service    │
│   :8000      │  │   :8002      │  │   :8013             │  │   :8014      │
└───────┬──────┘  └───────┬──────┘  └────────────┬──────────┘  └──────┬──────┘
        │                 │                     │                      │
        └────────────────┴─────────────────────┴──────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
│   Notification│  │   SMS        │  │   Email     │
│   Service    │  │   Service    │  │   Service    │
│   :8015       │  │   :8016      │  │   :8017      │
└───────────────┘  └───────────────┘  └──────────────┘

External Services:
├── Stripe (Payment)
├── OpenStreetMap (Maps)
├── Firebase (Notifications)
├── Twilio (SMS)
└── SendGrid (Email)
```

## Core Service Interactions

### 1. Order Creation Flow

```
User App → Order Service (8001)
    ↓
    ├─→ Identity Service (8000)  [Validate user]
    ├─→ Maps Service (8014)      [Geocode addresses]
    ├─→ Pricing Service (8006)     [Calculate fare]
    └─→ Notification Service (8015) [Notify user]
```

### 2. Driver Matching Flow

```
Order Service → Matching Service (8005)
    ↓
    ├─→ Location Service (8002)    [Get nearby drivers]
    ├─→ Maps Service (8014)        [Calculate ETAs]
    ├─→ Fraud Service (8010)        [Check for fraud]
    └─→ Reputation Service (8009)   [Get driver ratings]
```

### 3. Trip Execution Flow

```
Order Service → Trip Service (8003)
    ↓
    ├─→ Payment Service (8013)     [Process payment]
    ├─→ Location Service (8002)      [Track location]
    ├─→ Maps Service (8014)         [Get route updates]
    └─→ Notification Service (8015) [Send updates]
```

## External Service Integration

### Payment Service (Port 8013)

**Provider**: Stripe
**Purpose**: Process payments, manage payment methods, handle refunds

**Integration Points**:
- Order Service: Creates payment intent when order is created
- Trip Service: Captures payment after trip completion
- Communication Service: Sends payment confirmations

**API Calls**:
```typescript
// Order Service creates payment
POST /api/v1/payments/create-intent
{
  "amount": 2500,
  "currency": "usd",
  "paymentMethodTypes": ["card"],
  "orderId": "order_123"
}

// Trip Service captures payment
POST /api/v1/payments/confirm
{
  "paymentIntentId": "pi_...",
  "paymentMethodId": "pm_..."
}
```

**Cash Payments**:
```typescript
// Initiate cash payment
POST /api/v1/payments/cash/initiate

// Driver confirms
POST /api/v1/payments/cash/driver-confirm

// Rider confirms
POST /api/v1/payments/cash/rider-confirm
```

### Maps Service (Port 8014)

**Provider**: OpenStreetMap (Nominatim + OSRM)
**Purpose**: Geocoding, routing, ETA calculation, nearby search

**Integration Points**:
- Order Service: Geocode pickup/dropoff addresses
- Matching Service: Calculate driver ETAs
- Trip Service: Get route updates, calculate distance
- Location Service: Find nearby POIs

**API Calls**:
```typescript
// Order Service geocodes address
GET /api/v1/maps/geocode?query="1600 Pennsylvania Ave"

// Matching Service gets ETA
GET /api/v1/maps/eta?start_lat=...&start_lon=...&end_lat=...&end_lon=...

// Trip Service gets route
GET /api/v1/maps/route?start_lat=...&start_lon=...&end_lat=...&end_lon=...

// Location Service finds nearby places
GET /api/v1/maps/nearby?lat=...&lon=...&category=restaurant
```

### Notification Service (Port 8015)

**Provider**: Firebase Cloud Messaging
**Purpose**: Push notifications to mobile apps

**Integration Points**:
- Order Service: Order lifecycle events
- Trip Service: Trip updates
- Safety Service: Emergency alerts
- Matching Service: New order notifications for drivers

**API Calls**:
```typescript
// Order Service notifies rider
POST /api/v1/notifications/rider/order-created
?order_id=12345&rider_token=device_token

// Trip Service notifies rider of driver arrival
POST /api/v1/notifications/rider/driver-arrived
?rider_token=device_token

// Safety Service sends emergency alert
POST /api/v1/notifications/emergency/sos
?rider_token=...&driver_token=...

// Matching Service notifies drivers
POST /api/v1/notifications/driver/new-order
?driver_token=device_token&pickup_location=...
```

**Topic Subscriptions**:
```typescript
// Subscribe driver to new orders
POST /api/v1/notifications/subscribe
?token=driver_token&topic=drivers_new_york

// Send to all drivers in area
POST /api/v1/notifications/topic
?topic=drivers_new_york&title=New Order&body=...
```

### SMS Service (Port 8016)

**Provider**: Twilio (with simulation mode)
**Purpose**: SMS notifications, OTP verification

**Integration Points**:
- Identity Service: Phone verification OTP
- Order Service: Order confirmations
- Trip Service: Trip updates
- Safety Service: Emergency alerts

**API Calls**:
```typescript
// Identity Service sends OTP
POST /api/v1/sms/otp/send
{
  "phone": "+1234567890",
  "code": "123456",
  "expiry_minutes": 5
}

// Identity Service verifies OTP
POST /api/v1/sms/otp/verify
?phone=+1234567890&code=123456

// Order Service confirms order
POST /api/v1/sms/rider/order-created
?phone=+1234567890&order_id=12345

// Safety Service emergency alert
POST /api/v1/sms/emergency/sos
?phone=+1234567890&location=...
```

### Email Service (Port 8017)

**Provider**: SendGrid (with simulation mode)
**Purpose**: Transactional emails

**Integration Points**:
- Identity Service: Password resets, verification
- Order Service: Confirmations, receipts
- Payment Service: Payment confirmations
- Communication Service: Marketing emails

**API Calls**:
```typescript
// Identity Service password reset
POST /api/v1/email/rider/password-reset
?email=user@example.com&reset_link=https://...

// Order Service order confirmation
POST /api/v1/email/rider/order-created
?email=user@example.com&order_id=12345&rider_name=John

// Order Service receipt
POST /api/v1/email/rider/receipt
?email=user@example.com&order_id=12345&amount=25.00

// Driver Service weekly earnings
POST /api/v1/email/driver/earnings
?email=driver@example.com&week=2025-01&earnings=500.00&trips=50
```

## Complete Order Lifecycle Integration

### 1. Order Creation

```
User App
    ↓ POST /api/v1/orders
Order Service (8001)
    ├─→ GET /api/v1/users/{userId}          [Identity Service: Validate user]
    ├─→ GET /api/v1/drivers/nearby         [Location Service: Get nearby drivers]
    ├─→ GET /api/v1/maps/geocode           [Maps Service: Geocode addresses]
    ├─→ GET /api/v1/pricing/calculate       [Pricing Service: Calculate fare]
    ├─→ POST /api/v1/payments/create-intent [Payment Service: Create payment intent]
    ├─→ POST /api/v1/notifications/send    [Notification Service: Notify user]
    └─→ POST /api/v1/email/send           [Email Service: Send confirmation]
```

### 2. Driver Matching

```
Order Service (8001)
    ↓ POST /api/v1/matching/find-drivers
Matching Service (8005)
    ├─→ GET /api/v1/drivers/nearby           [Location Service: Get drivers]
    ├─→ GET /api/v1/maps/eta               [Maps Service: Calculate ETAs]
    ├─→ GET /api/v1/reputation/{driverId}     [Reputation Service: Get ratings]
    ├─→ GET /api/v1/fraud/check              [Fraud Service: Check for fraud]
    └─→ POST /api/v1/notifications/multicast [Notification Service: Notify drivers]
```

### 3. Trip Start

```
Driver App
    ↓ POST /api/v1/trips/start
Trip Service (8003)
    ├─→ POST /api/v1/payments/confirm        [Payment Service: Capture payment]
    ├─→ POST /api/v1/location/update         [Location Service: Start tracking]
    ├─→ POST /api/v1/notifications/send      [Notification Service: Notify rider]
    └─→ POST /api/v1/sms/rider/driver-arrived [SMS Service: SMS notification]
```

### 4. Trip Completion

```
Driver App
    ↓ POST /api/v1/trips/complete
Trip Service (8003)
    ├─→ GET /api/v1/maps/route              [Maps Service: Get final distance]
    ├─→ POST /api/v1/pricing/final           [Pricing Service: Calculate final fare]
    ├─→ POST /api/v1/reputation/rate          [Reputation Service: Save ratings]
    ├─→ POST /api/v1/notifications/send      [Notification Service: Notify both parties]
    ├─→ POST /api/v1/sms/rider/trip-completed  [SMS Service: SMS notification]
    ├─→ POST /api/v1/email/rider/receipt       [Email Service: Send receipt]
    └─→ POST /api/v1/email/driver/earnings    [Email Service: Update earnings]
```

### 5. Emergency Handling

```
User App / Driver App
    ↓ POST /api/v1/safety/sos
Safety Service (8007)
    ├─→ POST /api/v1/location/{userId}        [Location Service: Get exact location]
    ├─→ POST /api/v1/notifications/emergency/sos [Notification Service: Push alert]
    ├─→ POST /api/v1/sms/emergency/sos         [SMS Service: SMS alert]
    ├─→ POST /api/v1/email/send               [Email Service: Email alert]
    └─→ POST /api/v1/order/{orderId}/cancel     [Order Service: Cancel if needed]
```

## Service Communication Protocols

### HTTP/REST API
- **Used By**: All services for synchronous communication
- **Format**: JSON
- **Timeouts**: 5s for internal calls, 30s for external

### Kafka Message Queue (Planned)
- **Used By**: Async communication between services
- **Topics**:
  - `orders.created`
  - `trips.started`
  - `trips.completed`
  - `payments.processed`
  - `notifications.send`
  - `locations.update`

### Redis Caching
- **Used By**: Session data, rate limiting, caching
- **Keys**:
  - `user:{userId}` - User session
  - `otp:{phone}` - OTP verification
  - `rate:{userId}` - Rate limit
  - `cache:maps:{query}` - Maps caching

## Environment Configuration

All services should have these base environment variables:

```bash
# Service Configuration
PORT=<service_port>
ENVIRONMENT=development|production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379/0

# Kafka
KAFKA_BROKERS=host:9092

# Service URLs
IDENTITY_SERVICE_URL=http://identity-service:8000
ORDER_SERVICE_URL=http://order-service:8001
TRIP_SERVICE_URL=http://trip-service:8003
LOCATION_SERVICE_URL=http://location-service:8002
MATCHING_SERVICE_URL=http://matching-service:8005
PRICING_SERVICE_URL=http://pricing-service:8006
COMMUNICATION_SERVICE_URL=http://communication-service:8004
SAFETY_SERVICE_URL=http://safety-service:8007
REPUTATION_SERVICE_URL=http://reputation-service:8009
FRAUD_SERVICE_URL=http://fraud-service:8010
SUBSCRIPTION_SERVICE_URL=http://subscription-service:8011
ANALYTICS_SERVICE_URL=http://analytics-service:8012
PAYMENT_SERVICE_URL=http://payment-service:8013
MAPS_SERVICE_URL=http://maps-service:8014
NOTIFICATION_SERVICE_URL=http://notification-service:8015
SMS_SERVICE_URL=http://sms-service:8016
EMAIL_SERVICE_URL=http://email-service:8017

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json
FIREBASE_PROJECT_ID=your-project
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@tripo04os.com

# Logging
LOG_LEVEL=debug|info|warn|error
```

## Service Health Checks

All services expose `/health` and `/ready` endpoints:

```bash
# Health check - returns service status
curl http://localhost:8000/health

# Readiness check - returns ready status
curl http://localhost:8000/ready
```

Expected response:
```json
{
  "status": "healthy" | "unhealthy",
  "service": "service-name",
  "dependencies": {
    "database": "connected",
    "redis": "connected",
    "kafka": "connected"
  }
}
```

## Monitoring and Observability

### Metrics to Track

- Request latency (p50, p95, p99)
- Error rates per service
- Throughput (requests/second)
- Database query times
- External API call success rates
- Message queue depth

### Log Levels

- **ERROR**: Critical failures
- **WARN**: Degraded functionality
- **INFO**: Normal operation
- **DEBUG**: Detailed troubleshooting

## Testing Integration

### Unit Tests
- Mock external service calls
- Test individual service logic
- Verify request/response formats

### Integration Tests
- Test service-to-service communication
- Verify end-to-end flows
- Test error handling and retries

### E2E Tests
- Full user journey simulation
- All services running
- Real external service mocks

## Troubleshooting

### Common Issues

1. **Service Unavailable**
   - Check service health endpoint
   - Verify network connectivity
   - Check service logs

2. **Payment Failed**
   - Verify Stripe credentials
   - Check payment intent status
   - Review Stripe dashboard

3. **Notifications Not Delivered**
   - Verify Firebase project ID
   - Check device tokens
   - Review FCM logs

4. **SMS Not Sent**
   - Verify Twilio credentials
   - Check phone number format
   - Review Twilio logs

5. **Maps API Errors**
   - Check rate limits
   - Verify coordinates
   - Test API directly

## Next Steps

1. Implement Kafka for async communication
2. Add comprehensive monitoring (Prometheus/Grafana)
3. Implement distributed tracing (Jaeger/Zipkin)
4. Add circuit breakers for external service calls
5. Implement retry policies with exponential backoff
6. Add load balancing for service instances

## License

Proprietary - Tripo04OS Internal Use Only
