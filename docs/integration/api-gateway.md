# API Gateway Integration Guide

Complete guide for integrating Tripo04OS applications with Kong API Gateway.

## Overview

Kong API Gateway provides centralized routing, authentication, rate limiting, and logging for all 16 microservices.

## Architecture

```
[Client Applications]
        ↓
[Kong API Gateway]
        ↓
[Kubernetes Services]
    (16 microservices)
```

## Services and Routes

### Service Configuration

**16 Microservices Routes:**

| Service | Internal Port | Kong Route | Rate Limit (min) |
|---------|---------------|-----------|-------------------|
| Identity Service | 8001 | /v1/identity | 100 |
| Location Service | 8002 | /v1/location | 200 |
| Order Service | 8003 | /v1/order | 150 |
| Trip Service | 8004 | /v1/trip | 150 |
| Matching Service | 8005 | /v1/matching | 100 |
| Pricing Service | 8006 | /v1/pricing | 100 |
| Communication Service | 8007 | /v1/communication | 200 |
| Safety Service | 8008 | /v1/safety | 50 |
| Reputation Service | 8009 | /v1/reputation | 100 |
| Fraud Service | 8010 | /v1/fraud | 50 |
| Subscription Service | 8011 | /v1/subscription | 100 |
| Analytics Service | 8012 | /v1/analytics | 200 |
| Payment Service | 8013 | /v1/payment | 100 |
| Maps Service | 8014 | /v1/maps | 200 |
| Notification Service | 8015 | /v1/notification | 200 |
| SMS Service | 8016 | /v1/sms | 50 |

## Deployment

### Kubernetes Deployment

Kong Gateway is deployed to Kubernetes with configuration from `api-gateway/kong/kong.yml`.

#### Deploy Kong

```bash
# Apply Kong configuration
kubectl apply -f api-gateway/kong/deployment.yaml

# Apply Kong services and routes
kubectl apply -f api-gateway/kong/kong.yml

# Wait for Kong to be ready
kubectl rollout status deployment/kong
```

#### Verify Kong

```bash
# Check Kong pods
kubectl get pods -l app=kong

# Check Kong services
kubectl get svc -l app=kong

# Get Kong admin URL
kubectl get svc kong-admin -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### Docker Compose (Local Development)

```bash
# Start Kong and services
cd api-gateway
docker-compose up -d

# View logs
docker-compose logs -f kong
```

## Client Integration

### Flutter Apps (Rider & Driver)

Configure API Gateway URL in Flutter apps:

```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String baseUrl =
      kDebugMode ? 'http://localhost:8000' : 'https://api.tripo04os.com';
  static const Duration timeout = Duration(seconds: 30);
}
```

### React Apps (Admin Dashboard & Web Interface)

Configure API Gateway URL in React apps:

```typescript
// src/config/api.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL ||
  'https://api.tripo04os.com';

export const API_ENDPOINTS = {
  identity: `${API_BASE_URL}/v1/identity`,
  location: `${API_BASE_URL}/v1/location`,
  order: `${API_BASE_URL}/v1/order`,
  trip: `${API_BASE_URL}/v1/trip`,
  // ... other services
};
```

## Authentication Flow

### 1. Registration

```
Client → Kong (/v1/identity/register)
       ↓
    JWT Plugin (skips for register)
       ↓
Identity Service
       ↓
    JWT Plugin (generate token)
       ↓
Client (receives token)
```

### 2. Login

```
Client → Kong (/v1/identity/login)
       ↓
    JWT Plugin (skips for login)
       ↓
Identity Service
       ↓
    JWT Plugin (validate credentials)
       ↓
Client (receives JWT token)
```

### 3. Authenticated Requests

```
Client → Kong (/v1/order) [Authorization: Bearer <token>]
       ↓
    JWT Plugin (validate token)
       ↓
Rate Limiting Plugin (check limits)
       ↓
CORS Plugin (validate origin)
       ↓
Target Service
```

## API Endpoints

### Identity Service

```bash
# Register
POST /v1/identity/register
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "rider"
}

# Login
POST /v1/identity/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}

# Refresh Token
POST /v1/identity/refresh
Content-Type: application/json
{
  "refreshToken": "<refresh_token>"
}
```

### Order Service

```bash
# Create Order
POST /v1/order
Authorization: Bearer <jwt_token>
Content-Type: application/json
{
  "serviceType": "ride",
  "vertical": "RIDE",
  "pickupLocation": {
    "address": "123 Main St",
    "lat": 40.7128,
    "lng": -74.006
  },
  "dropoffLocation": {
    "address": "456 Oak Ave",
    "lat": 40.758,
    "lng": -73.9855
  },
  "vehicleType": "economy",
  "scheduledFor": null
}

# Get Order Status
GET /v1/order/<order_id>
Authorization: Bearer <jwt_token>
```

### Trip Service

```bash
# Start Trip
POST /v1/trip/<order_id>/start
Authorization: Bearer <jwt_token>

# Complete Trip
POST /v1/trip/<trip_id>/complete
Authorization: Bearer <jwt_token>
Content-Type: application/json
{
  "finalFare": 15.50,
  "distance": 5.2,
  "duration": 12
}

# Rate Trip
POST /v1/trip/<trip_id>/rate
Authorization: Bearer <jwt_token>
Content-Type: application/json
{
  "rating": 5,
  "comment": "Great trip!"
}
```

### Payment Service

```bash
# Create Payment Intent
POST /v1/payment/intent
Authorization: Bearer <jwt_token>
Content-Type: application/json
{
  "orderId": "<order_id>",
  "amount": 15.50,
  "currency": "USD",
  "paymentMethod": "card"
}

# Confirm Payment
POST /v1/payment/confirm
Authorization: Bearer <jwt_token>
Content-Type: application/json
{
  "paymentIntentId": "<stripe_pi_id>",
  "orderId": "<order_id>"
}
```

## Rate Limiting

### Per-Service Limits

**Critical Services (50/min):**
- Safety Service
- Fraud Service
- SMS Service

**Standard Services (100/min):**
- Identity Service
- Matching Service
- Pricing Service
- Payment Service
- Subscription Service
- Reputation Service

**Core Services (150/min):**
- Order Service
- Trip Service

**High-Frequency Services (200/min):**
- Location Service
- Communication Service
- Maps Service
- Notification Service
- Analytics Service

### Exceeded Limits Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "Specific error details"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Invalid or missing authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |

## Webhooks

### Payment Webhooks

Kong forwards Stripe webhooks to Payment Service:

```
Stripe → Kong (/v1/payment/webhook)
        ↓
    Webhook Plugin (verify signature)
        ↓
Payment Service
        ↓
Process payment status
```

### Notification Webhooks

Services send events to Notification Service:

```
Any Service → Kong (/v1/notification/send)
           ↓
    JWT Plugin (internal auth)
           ↓
Notification Service
           ↓
Send via FCM/SMS
```

## Monitoring

### Kong Admin API

```bash
# Get service health
curl -s http://localhost:8001/health

# Get service stats
curl -s http://localhost:8001/stats

# Get active connections
curl -s http://localhost:8001/connections
```

### Prometheus Metrics

Kong exposes Prometheus metrics at `/metrics`:

```yaml
# Prometheus scrape config
- job_name: 'kong'
  metrics_path: '/metrics'
  static_configs:
    - targets: ['kong-admin:8001']
```

### Key Metrics

- **Request Rate**: Requests per second per service
- **Latency**: P50, P95, P99 response times
- **Error Rate**: 4xx and 5xx error rates
- **Rate Limit Hits**: Number of requests blocked by rate limiting

## Troubleshooting

### Service Unreachable

```bash
# Check service status in Kong
curl -s http://localhost:8001/services/identity-service

# Check route status
curl -s http://localhost:8001/routes/v1-identity

# Check upstream health
curl -s http://identity-service:8001/health
```

### Rate Limiting Too Strict

```bash
# Update rate limit
curl -X PATCH http://localhost:8001/services/identity-service/plugins/rate-limiting \
  -d '{"config":{"minute":200}}'

# Test new limit
for i in {1..200}; do curl -s http://localhost:8000/v1/identity/me; done
```

### JWT Authentication Issues

```bash
# Verify JWT plugin is enabled
curl -s http://localhost:8001/services/identity-service/plugins/jwt

# Get plugin configuration
curl -s http://localhost:8001/services/identity-service/plugins/jwt

# Reconfigure JWT secret
curl -X PATCH http://localhost:8001/services/identity-service/plugins/jwt \
  -d '{"config":{"secret":"new-secret"}}'
```

## Best Practices

1. **Use HTTPS in Production**
   ```bash
   # Configure SSL in Kong
   curl -X PATCH http://localhost:8001/ \
     -d '{"tags":["ssl"],"config":{"cert":"/path/to/cert.pem","key":"/path/to/key.pem"}}'
   ```

2. **Implement Proper Authentication**
   - Always use JWT tokens
   - Include tokens in Authorization header
   - Refresh tokens before expiration

3. **Handle Rate Limits Gracefully**
   - Implement exponential backoff
   - Show user-friendly error messages
   - Cache responses when possible

4. **Monitor Gateway Performance**
   - Set up Prometheus scraping
   - Configure alerts for high error rates
   - Review logs regularly

5. **Version Your API**
   - Use semantic versioning
   - Document breaking changes
   - Maintain backward compatibility when possible

## Migration

### Updating Service Routes

```bash
# Update upstream target
curl -X PATCH http://localhost:8001/upstreams/identity-service \
  -d '{"targets":[{"target":"new-identity-service:8001"}]}'

# Update route path
curl -X PATCH http://localhost:8001/routes/v1-identity \
  -d '{"paths":["/v2/identity"],"strip_path":true}'
```

### Blue-Green Deployment

```bash
# Add new upstream for green deployment
curl -X POST http://localhost:8001/upstreams \
  -d '{"name":"identity-service-green","tags":["green"]}'

# Add target to green upstream
curl -X POST http://localhost:8001/upstreams/identity-service-green/targets \
  -d '{"target":"identity-service-green:8001"}'

# Update route to use green upstream
curl -X PATCH http://localhost:8001/routes/v1-identity \
  -d '{"upstream_id":"identity-service-green"}'

# Monitor green deployment
# Rollback if needed
curl -X PATCH http://localhost:8001/routes/v1-identity \
  -d '{"upstream_id":"identity-service-blue"}'
```

## Support

For API Gateway issues:
- Check Kong logs: `kubectl logs -f deployment/kong`
- Review Kong Admin API responses
- Verify service health checks
- Consult Kong documentation

## License

Proprietary - Tripo04OS Internal Use Only

---

**End of API Gateway Integration Guide**
