# Tripo04OS API Gateway

API Gateway implementation using Kong Gateway for the Tripo04OS multi-service transportation platform.

## Overview

The API Gateway provides:
- Centralized routing to 16 microservices
- Authentication (JWT)
- Rate limiting per service
- CORS support
- Request/response logging
- Health checks
- Load balancing

## Architecture

```
Client Apps → Kong Gateway → Microservices
                 ↓
        (Plugins: JWT, Rate Limit, CORS, Logging)
                 ↓
            Redis Cache
```

## Services Configured

### Core Services (12)
- Identity Service (8001) - Authentication & authorization
- Location Service (8002) - Geospatial data
- Order Service (8003) - Order management
- Trip Service (8004) - Trip execution
- Matching Service (8005) - Driver matching
- Pricing Service (8006) - Dynamic pricing
- Communication Service (8007) - Real-time messaging
- Safety Service (8008) - Safety features
- Reputation Service (8009) - Rating system
- Fraud Service (8010) - Fraud detection
- Subscription Service (8011) - Subscription management
- Analytics Service (8012) - Analytics & reporting

### Integration Services (4)
- Payment Service (8013) - Payment gateway
- Maps Service (8014) - Maps integration
- Notification Service (8015) - Push notifications
- SMS Service (8016) - SMS notifications

## Plugins

### Custom Plugins
- **JWT Plugin** - Token-based authentication
- **Rate Limiting Plugin** - Request throttling
- **CORS Plugin** - Cross-origin resource sharing
- **Request Logger Plugin** - Log incoming requests
- **Response Logger Plugin** - Log outgoing responses

### Rate Limiting Configuration

Per-service rate limits:
- Safety, Fraud, SMS: 50/min, 500/hour
- Identity, Matching, Pricing, Reputation, Payment, Subscription: 100/min, 1000/hour
- Order, Trip: 150/min, 1500/hour
- Location, Communication, Maps, Notification, Analytics: 200/min, 2000/hour

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Ports 8000-8002, 8443-8445 available

### Start API Gateway

```bash
cd /media/fi/NewVolume3/project01/Tripo04os

# Start Kong Gateway with PostgreSQL and Redis
docker-compose -f kong-docker-compose.yml up -d

# Or use the standalone docker-compose
cd api-gateway
docker-compose up -d
```

### Verify Installation

```bash
# Check Kong health
curl -i http://localhost:8001/health

# Check Kong status
curl -i http://localhost:8001/status

# Access Kong Manager (Admin GUI)
open http://localhost:8002

# Test a route (example)
curl -i http://localhost:8000/api/v1/auth/health
```

### Stop API Gateway

```bash
docker-compose -f kong-docker-compose.yml down

# Or in api-gateway directory
docker-compose down
```

## Configuration

### Environment Variables

```env
# Database
KONG_PG_HOST=postgres
KONG_PG_PORT=5432
KONG_PG_USER=kong
KONG_PG_PASSWORD=kong_password
KONG_PG_DATABASE=kong

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Kong
KONG_LOG_LEVEL=info
KONG_ADMIN_ACCESS_LOG=/dev/stdout
KONG_ADMIN_ERROR_LOG=/dev/stderr
KONG_PROXY_ACCESS_LOG=/dev/stdout
KONG_PROXY_ERROR_LOG=/dev/stderr

# JWT
JWT_SECRET=your-secret-key-here
```

### Plugin Configuration

Edit `/api-gateway/kong/kong.yml` to:
- Add/remove services
- Configure routes
- Adjust plugin settings
- Modify rate limits

## API Endpoints

### Gateway Endpoints
- `http://localhost:8000` - Proxy (HTTP)
- `https://localhost:8443` - Proxy (HTTPS)
- `http://localhost:8001` - Admin API
- `http://localhost:8002` - Kong Manager (Admin GUI)

### Service Routes
- `/api/v1/auth/*` - Identity Service
- `/api/v1/locations/*` - Location Service
- `/api/v1/orders/*` - Order Service
- `/api/v1/trips/*` - Trip Service
- `/api/v1/matching/*` - Matching Service
- `/api/v1/pricing/*` - Pricing Service
- `/api/v1/communication/*` - Communication Service
- `/api/v1/safety/*` - Safety Service
- `/api/v1/reputation/*` - Reputation Service
- `/api/v1/fraud/*` - Fraud Service
- `/api/v1/subscriptions/*` - Subscription Service
- `/api/v1/analytics/*` - Analytics Service
- `/api/v1/payments/*` - Payment Service
- `/api/v1/maps/*` - Maps Service
- `/api/v1/notifications/*` - Notification Service
- `/api/v1/sms/*` - SMS Service

## Monitoring

### Logs

```bash
# View Kong logs
docker logs -f kong-gateway

# View all logs
docker-compose -f kong-docker-compose.yml logs -f
```

### Health Checks

```bash
# Check service health
curl http://localhost:8000/api/v1/auth/health
curl http://localhost:8000/api/v1/orders/health
# ... etc for all services
```

### Metrics

Access metrics via:
- Prometheus integration
- Kong Manager dashboard
- Admin API `/metrics` endpoint

## Development

### Adding a New Service

1. Update `/api-gateway/kong/kong.yml`:

```yaml
services:
  - name: your-service
    url: http://your-service:8000
    tags:
      - core
      - production
    connect_timeout: 60000
    read_timeout: 60000
    routes:
      - name: your-service-routes
        paths: ["/api/v1/your-service(/|$)"]
        strip_path: true
        plugins:
          - name: rate-limiting
            config:
              minute: 100
              hour: 1000
    healthchecks:
      active:
        type: http
        http:
          path: /health
          unhealthy_threshold: 3
          healthy_threshold: 1
          http_statuses:
            - 200
```

2. Restart Kong:

```bash
docker-compose -f kong-docker-compose.yml restart kong
```

### Creating Custom Plugins

Create a new plugin in `/api-gateway/kong/plugins/your-plugin/`:

```
plugins/your-plugin/
├── handler.lua    # Plugin logic
└── schema.lua     # Plugin schema
```

Example:

```lua
-- handler.lua
local BasePlugin = require "kong.plugins.base_plugin"

local your_plugin = BasePlugin:extend()

your_plugin.PRIORITY = 1000
your_plugin.VERSION = "1.0.0"

function your_plugin:new()
  your_plugin.super.new(self, "your-plugin")
end

function your_plugin:access(conf)
  kong.log.info("Your plugin executed!")
end

return your_plugin
```

```lua
-- schema.lua
return {
  name = "your-plugin",
  fields = {
    timeout = {
      type = "number",
      default = 60000,
      required = false
    }
  }
}
```

## Security

### Authentication
- JWT authentication on protected routes
- Secret-based token validation
- Claims verification (sub, role, exp)

### Rate Limiting
- Per-service rate limits
- Redis-backed for distributed deployments
- Configurable time windows (minute, hour)

### CORS
- Configurable origins
- Allowed methods and headers
- Credentials support

## Troubleshooting

### Common Issues

**Gateway returns 502 Bad Gateway**
- Check backend service is running
- Verify service URL in kong.yml
- Check network connectivity

**Rate limiting not working**
- Verify Redis is running
- Check plugin configuration
- Review logs for errors

**JWT validation failing**
- Verify JWT_SECRET is set
- Check token format
- Ensure token is not expired

### Debug Mode

Enable debug logging:

```bash
# Set log level to debug
docker-compose -f kong-docker-compose.yml exec kong \
  kong config set KONG_LOG_LEVEL debug

# Restart Kong
docker-compose -f kong-docker-compose.yml restart kong
```

## Production Deployment

### Scalability
- Deploy Kong in DB-less mode for better performance
- Use external PostgreSQL with connection pooling
- Use Redis Cluster for distributed rate limiting
- Load balance multiple Kong instances

### High Availability
- Run multiple Kong instances behind load balancer
- Use PostgreSQL streaming replication
- Use Redis Sentinel or Cluster
- Enable health checks and automatic failover

### Security
- Enable TLS/SSL for all connections
- Use strong JWT secrets
- Restrict admin API access
- Enable request validation
- Set appropriate rate limits
- Regular security updates

## Documentation

- [Kong Documentation](https://docs.konghq.com/)
- [Kong Plugin Development](https://docs.konghq.com/gateway/latest/plugin-development/)
- [Kong Admin API](https://docs.konghq.com/gateway/latest/admin-api/)
- [Kong Manager](https://docs.konghq.com/enterprise/latest/kong-manager/)

## Support

For issues or questions:
1. Check Kong logs
2. Verify configuration in kong.yml
3. Consult Kong documentation
4. Contact the platform team

## License

Proprietary - Tripo04OS Internal Use Only
