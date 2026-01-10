# Payment Service

Tripo04OS Payment Service - Handles all payment processing including cash payments and Stripe integration.

## Overview

The Payment Service is a NestJS-based microservice that provides:
- **Cash Payment Management**: Track cash-based payments between riders and drivers
- **Stripe Integration**: Process card payments, manage customers, and handle payment methods
- **Payment Confirmation**: Dual confirmation system for cash payments
- **Webhook Handling**: Process Stripe webhook events
- **Refund Management**: Handle payment refunds through Stripe

## Architecture

```
payment-service (Port 8013)
├── Controllers
│   ├── PaymentController        - Cash payment endpoints
│   └── StripePaymentsController  - Stripe payment endpoints
├── Services
│   ├── PaymentService            - Cash payment business logic
│   └── StripeService            - Stripe SDK wrapper
├── DTOs
│   └── payment.dto.ts            - Data transfer objects
└── Common
    └── api-tags.decorator.ts     - Swagger tags
```

## Tech Stack

- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Payment Gateway**: Stripe SDK v14
- **Validation**: class-validator
- **Environment**: @nestjs/config

## Features

### Cash Payments
- Initiate cash payment for an order
- Dual confirmation (driver + rider)
- Payment status tracking
- Payment statistics for drivers
- Cancellation and refund support

### Stripe Payments
- Create payment intents
- Confirm payments with payment methods
- Manage customer payment methods
- Set default payment methods
- Delete payment methods
- Process webhook events
- Handle refunds
- Customer management

## API Endpoints

### Cash Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/cash/initiate` | Initiate cash payment |
| POST | `/api/v1/payments/cash/driver-confirm` | Confirm by driver |
| POST | `/api/v1/payments/cash/rider-confirm` | Confirm by rider |
| GET | `/api/v1/payments/cash/:paymentId` | Get payment details |
| GET | `/api/v1/payments/cash/order/:orderId` | Get payment by order |
| GET | `/api/v1/payments/cash/rider/:riderId` | Get rider payments |
| GET | `/api/v1/payments/cash/driver/:driverId` | Get driver payments |
| GET | `/api/v1/payments/cash/pending` | Get pending confirmations |
| POST | `/api/v1/payments/cash/:paymentId/cancel` | Cancel payment |
| POST | `/api/v1/payments/cash/:paymentId/refund` | Refund payment |
| GET | `/api/v1/payments/cash/driver/:driverId/stats` | Get driver stats |

### Stripe Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/create-intent` | Create payment intent |
| POST | `/api/v1/payments/confirm` | Confirm payment |
| DELETE | `/api/v1/payments/stripe/:paymentIntentId` | Cancel payment intent |
| POST | `/api/v1/payments/payment-methods` | Create payment method |
| GET | `/api/v1/payments/customers/:customerId/payment-methods` | Get payment methods |
| PATCH | `/api/v1/payments/customers/:customerId/payment-methods/:paymentMethodId/default` | Set default |
| DELETE | `/api/v1/payments/customers/:customerId/payment-methods/:paymentMethodId` | Delete method |
| POST | `/api/v1/payments/webhooks/stripe` | Handle webhook |
| GET | `/api/v1/payments/customers/stripe/:stripeCustomerId/customer-id` | Get customer ID |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Stripe account and API keys

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Stripe keys
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Development

```bash
# Run in development mode
npm run dev

# The service will start on port 8013
```

### Build & Run

```bash
# Build the project
npm run build

# Run in production mode
npm run start:prod
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 8013) |
| `NODE_ENV` | No | Environment (development/production) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook secret |
| `DATABASE_URL` | No | PostgreSQL connection string |
| `REDIS_URL` | No | Redis connection string |

## Data Models

### CashPayment

```typescript
{
  paymentId: string;
  orderId: string;
  riderId: string;
  driverId: string;
  amount: number;
  currency: string;
  status: 'initiated' | 'driver_confirmed' | 'rider_confirmed' | 'completed' | 'cancelled' | 'refunded';
  driverConfirmed: boolean;
  riderConfirmed: boolean;
  driverConfirmationTime?: Date;
  riderConfirmationTime?: Date;
  driverNotes?: string;
  riderNotes?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Payment States

```
initiated → driver_confirmed → completed
              ↓
           rider_confirmed → completed
              ↓
           cancelled / refunded
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

## Docker Deployment

### Using Docker Compose

```bash
# Build and start the service
docker-compose up -d

# View logs
docker-compose logs -f payment-service

# Stop the service
docker-compose down
```

### Using Docker

```bash
# Build the image
docker build -t payment-service .

# Run the container
docker run -p 8013:8013 \
  -e STRIPE_SECRET_KEY=sk_test_... \
  -e STRIPE_PUBLISHABLE_KEY=pk_test_... \
  payment-service
```

## Integration with Other Services

### Order Service
- Receives order creation events
- Creates payment intents for card payments
- Initiates cash payment tracking

### Identity Service
- Validates user IDs
- Retrieves customer information

### Trip Service
- Receives trip completion events
- Processes final payments

## Security Considerations

1. **Stripe Webhook Verification**: All webhooks are verified using the webhook secret
2. **Payment Confirmation**: Dual confirmation for cash payments prevents fraud
3. **CORS**: Configured to allow requests from trusted origins
4. **Validation**: All inputs are validated using class-validator

## Monitoring

The service provides a health check endpoint:

```bash
curl http://localhost:8013/api/v1/payments/health
```

Response:
```json
{
  "status": "healthy"
}
```

## Troubleshooting

### Stripe API Errors
- Verify your API keys in `.env`
- Check Stripe dashboard for account status
- Ensure webhook secret matches

### Payment Confirmation Issues
- Check payment status before confirming
- Verify user permissions
- Review confirmation logs

### Database Errors
- Ensure PostgreSQL is running
- Verify connection string
- Check database migrations

## Contributing

1. Follow NestJS conventions
2. Write unit tests for new features
3. Update API documentation
4. Follow existing code style

## License

Proprietary - Tripo04OS Internal Use Only
