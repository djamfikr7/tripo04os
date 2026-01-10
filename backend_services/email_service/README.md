# Email Service

Tripo04OS Email Service - Send transactional emails via SendGrid with simulation mode for local development.

## Overview

The Email Service is a FastAPI-based microservice that provides:
- **Single Email**: Send individual messages
- **Bulk Email**: Send to multiple recipients
- **HTML Support**: Both plain text and HTML emails
- **Categorization**: Email categories for tracking
- **Rider Emails**: Order confirmations, receipts, password resets
- **Driver Emails**: Welcome messages, earnings summaries

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Email Provider**: SendGrid (production)
- **Development**: Simulation mode (local)

## Features

### Email Types

1. **Single Messages**: Send to one recipient
2. **Bulk Messages**: Send to multiple recipients at once
3. **HTML Emails**: Rich content emails
4. **Plain Text**: Simple text emails
5. **Categorized**: Track by email type

### Use Cases

- Order confirmations and receipts
- Password reset emails
- Welcome emails for drivers
- Weekly earnings summaries
- Promotional emails

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/api/v1/email/history` | Get email history |
| GET | `/api/v1/email/stats` | Get email statistics |
| POST | `/api/v1/email/send` | Send single email |
| POST | `/api/v1/email/send-bulk` | Send bulk email |
| POST | `/api/v1/email/test` | Test email sending |

### Rider-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/email/rider/order-created` | Order created notification |
| POST | `/api/v1/email/rider/receipt` | Send receipt |
| POST | `/api/v1/email/rider/password-reset` | Password reset email |

### Driver-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/email/driver/welcome` | Welcome new driver |
| POST | `/api/v1/email/driver/earnings` | Weekly earnings summary |

## Quick Start

### Prerequisites

- Python 3.11+
- SendGrid account (for production)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### SendGrid Setup

1. Create a SendGrid account
2. Generate API key
3. Configure sender identity (email domain)
4. Add credentials to `.env`

### Development

```bash
# Run in development mode (simulation)
uvicorn app.main:app --host 0.0.0.0 --port 8017 --reload
```

### Production

```bash
# Run with uvicorn (production mode)
SIMULATE_EMAIL=false uvicorn app.main:app --host 0.0.0.0 --port 8017 --workers 4
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `postgresql://...` | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection string |
| `KAFKA_BROKERS` | No | `localhost:9092` | Kafka brokers |
| `SENDGRID_API_KEY` | No | - | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | No | `noreply@tripo04os.com` | Default sender email |
| `SENDGRID_FROM_NAME` | No | `Tripo04OS` | Default sender name |
| `SIMULATE_EMAIL` | No | `true` | Simulate email instead of sending |
| `PORT` | No | 8017 | Service port |

## Usage Examples

### Send Single Email

```bash
curl -X POST "http://localhost:8017/api/v1/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Hello from Tripo04OS",
    "body": "This is a test email",
    "from_name": "Tripo04OS",
    "category": "test"
  }'
```

Response:
```json
{
  "success": true,
  "email_id": "email_20260110120000_1234",
  "status": "delivered",
  "simulated": true,
  "timestamp": "2026-01-10T12:00:00"
}
```

### Send Bulk Email

```bash
curl -X POST "http://localhost:8017/api/v1/email/send-bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["user1@example.com", "user2@example.com"],
    "subject": "Special Offer",
    "body": "50% off your next ride!",
    "from_name": "Tripo04OS"
  }'
```

### Send HTML Email

```bash
curl -X POST "http://localhost:8017/api/v1/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Welcome to Tripo04OS",
    "body": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
    "html": true,
    "category": "welcome"
  }'
```

### Rider Order Created Email

```bash
curl -X POST "http://localhost:8017/api/v1/email/rider/order-created?email=user@example.com&order_id=12345&rider_name=John"
```

### Driver Welcome Email

```bash
curl -X POST "http://localhost:8017/api/v1/email/driver/welcome?email=driver@example.com&driver_name=Jane"
```

### Test Email

```bash
curl http://localhost:8017/api/v1/email/test
```

## Integration with Other Services

### Identity Service
- Sends password reset emails
- Sends welcome emails for new users
- Handles email verification

### Order Service
- Sends order confirmation emails
- Sends receipts after payment
- Sends cancellation notifications

### Payment Service
- Sends payment confirmation emails
- Sends refund notifications
- Sends billing statements

## Email Categories

| Category | Description |
|-----------|-------------|
| `order_created` | Order confirmation |
| `receipt` | Payment receipt |
| `password_reset` | Password reset |
| `driver_welcome` | New driver onboarding |
| `earnings_summary` | Weekly earnings |
| `promotion` | Marketing emails |
| `welcome` | User welcome |

## Simulation Mode

When `SIMULATE_EMAIL=true`:
- Emails are logged to console instead of sent
- Useful for local development
- Prevents accidental email sends
- Stores email history in memory

## Monitoring

### Health Check

```bash
curl http://localhost:8017/health
```

Response:
```json
{
  "status": "healthy",
  "service": "email-service",
  "sendgrid": "configured",
  "mode": "simulation"
}
```

### Get Email Statistics

```bash
curl http://localhost:8017/api/v1/email/stats
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

### Get Email History

```bash
curl "http://localhost:8017/api/v1/email/history?limit=10&email=user@example.com"
```

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Docker

```bash
docker build -t email-service .
docker run -p 8017:8017 \
  -e SENDGRID_API_KEY=SG.xxx \
  -e SENDGRID_FROM_EMAIL=noreply@tripo04os.com \
  -e SENDGRID_FROM_NAME=Tripo04OS \
  -e SIMULATE_EMAIL=false \
  email-service
```

## Troubleshooting

### Emails Not Sending
- Check SendGrid API key
- Verify sender email is verified
- Check recipient email format
- Review SendGrid dashboard for delivery status

### Simulation Mode
- `SIMULATE_EMAIL=true` enables simulation
- Messages are logged instead of sent
- Useful for local development

### Rate Limiting
- SendGrid has rate limits based on plan
- Free tier: 100 emails/day
- Implement queueing for bulk sends

## Security

- Never commit SendGrid API key to version control
- Use environment variables for sensitive data
- Implement rate limiting
- Validate email addresses
- Sanitize HTML content to prevent XSS

## Best Practices

1. **Sender Identity**: Verify your domain in SendGrid
2. **Email Templates**: Use SendGrid templates for consistency
3. **Categorization**: Always set category for tracking
4. **Rate Limiting**: Respect SendGrid rate limits
5. **Error Handling**: Handle bounces and complaints
6. **Unsubscribe Links**: Include unsubscribe option for marketing emails
7. **HTML Sanitization**: Sanitize user-generated HTML content

## License

Proprietary - Tripo04OS Internal Use Only
