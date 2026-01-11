# Environment Configuration Guide

Complete guide for configuring environment variables across all Tripo04OS services and applications.

## Overview

Environment configuration is critical for:
- **Security**: Keep sensitive data (API keys, secrets) out of code
- **Flexibility**: Change configuration without code changes
- **Multi-environment**: Support dev, staging, production
- **Security**: Prevent accidental credential leaks

## Environment Levels

### Development (.env.dev)

```bash
# API Gateway
API_GATEWAY_URL=http://localhost:8000

# Backend Services
IDENTITY_SERVICE_URL=http://localhost:8001
LOCATION_SERVICE_URL=http://localhost:8002
ORDER_SERVICE_URL=http://localhost:8003
TRIP_SERVICE_URL=http://localhost:8004
MATCHING_SERVICE_URL=http://localhost:8005
PRICING_SERVICE_URL=http://localhost:8006
COMMUNICATION_SERVICE_URL=http://localhost:8007
SAFETY_SERVICE_URL=http://localhost:8008
REPUTATION_SERVICE_URL=http://localhost:8009
FRAUD_SERVICE_URL=http://localhost:8010
SUBSCRIPTION_SERVICE_URL=http://localhost:8011
ANALYTICS_SERVICE_URL=http://localhost:8012
PAYMENT_SERVICE_URL=http://localhost:8013
MAPS_SERVICE_URL=http://localhost:8014
NOTIFICATION_SERVICE_URL=http://localhost:8015
SMS_SERVICE_URL=http://localhost:8016

# Databases
DATABASE_URL=postgresql://tripo04os:password@localhost:5432/tripo04os
REDIS_URL=redis://localhost:6379/0

# Message Queue
KAFKA_BROKERS=localhost:9092
KAFKA_TOPICS=rider-updates,driver-updates,payment-updates

# Firebase
FIREBASE_PROJECT_ID=tripo04os-dev
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Stripe
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Twilio
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=+1234567890

# JWT
JWT_SECRET=dev-secret-change-me-in-production
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=168h

# Logging
LOG_LEVEL=debug
SENTRY_DSN=https://XXXXX@sentry.io/XXXXX

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_PREMIUM_MATCHING=true
ENABLE_PROFIT_OPTIMIZATION=false
ENABLE_MULTI_STOP_RIDES=false
ENABLE_SPLIT_PAYMENT=false
```

### Staging (.env.staging)

```bash
# API Gateway
API_GATEWAY_URL=https://api.staging.tripo04os.com

# Backend Services
IDENTITY_SERVICE_URL=https://api.staging.tripo04os.com/v1/identity
LOCATION_SERVICE_URL=https://api.staging.tripo04os.com/v1/location
ORDER_SERVICE_URL=https://api.staging.tripo04os.com/v1/order
TRIP_SERVICE_URL=https://api.staging.tripo04os.com/v1/trip
MATCHING_SERVICE_URL=https://api.staging.tripo04os.com/v1/matching
PRICING_SERVICE_URL=https://api.staging.tripo04os.com/v1/pricing
COMMUNICATION_SERVICE_URL=https://api.staging.tripo04os.com/v1/communication
SAFETY_SERVICE_URL=https://api.staging.tripo04os.com/v1/safety
REPUTATION_SERVICE_URL=https://api.staging.tripo04os.com/v1/reputation
FRAUD_SERVICE_URL=https://api.staging.tripo04os.com/v1/fraud
SUBSCRIPTION_SERVICE_URL=https://api.staging.tripo04os.com/v1/subscription
ANALYTICS_SERVICE_URL=https://api.staging.tripo04os.com/v1/analytics
PAYMENT_SERVICE_URL=https://api.staging.tripo04os.com/v1/payment
MAPS_SERVICE_URL=https://api.staging.tripo04os.com/v1/maps
NOTIFICATION_SERVICE_URL=https://api.staging.tripo04os.com/v1/notification
SMS_SERVICE_URL=https://api.staging.tripo04os.com/v1/sms

# Databases (RDS)
DATABASE_URL=postgresql://tripo04os:STRONG_PASSWORD@tripo04os-staging.cXXXXX.us-east-1.rds.amazonaws.com:5432/tripo04os
REDIS_URL=rediss://tripo04os-staging.xXXXXX.0001.use1.cache.amazonaws.com:6379/0
REDIS_PASSWORD=STRONG_PASSWORD

# Message Queue (MSK)
KAFKA_BROKERS=tripo04os-staging.xXXXXX.cXXXXX.use1.amazonaws.com:9092
KAFKA_BROKER_1=tripo04os-staging-b-1.xXXXXX.cXXXXX.use1.amazonaws.com:9094
KAFKA_BROKER_2=tripo04os-staging-b-2.xXXXXX.cXXXXX.use1.amazonaws.com:9096
KAFKA_TOPICS=rider-updates,driver-updates,payment-updates

# Firebase (staging)
FIREBASE_PROJECT_ID=tripo04os-staging
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END PRIVATE KEY-----

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Google Maps (with quota)
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Twilio (test account)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=+1234567890

# JWT
JWT_SECRET=staging-secret-change-me-in-production-ROTATE-REGULARLY
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=168h

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://XXXXX@sentry.io/XXXXX

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_PREMIUM_MATCHING=true
ENABLE_PROFIT_OPTIMIZATION=false
ENABLE_MULTI_STOP_RIDES=false
ENABLE_SPLIT_PAYMENT=false
```

### Production (.env.production)

```bash
# API Gateway
API_GATEWAY_URL=https://api.tripo04os.com

# Backend Services
IDENTITY_SERVICE_URL=https://api.tripo04os.com/v1/identity
LOCATION_SERVICE_URL=https://api.tripo04os.com/v1/location
ORDER_SERVICE_URL=https://api.tripo04os.com/v1/order
TRIP_SERVICE_URL=https://api.tripo04os.com/v1/trip
MATCHING_SERVICE_URL=https://api.tripo04os.com/v1/matching
PRICING_SERVICE_URL=https://api.tripo04os.com/v1/pricing
COMMUNICATION_SERVICE_URL=https://api.tripo04os.com/v1/communication
SAFETY_SERVICE_URL=https://api.tripo04os.com/v1/safety
REPUTATION_SERVICE_URL=https://api.tripo04os.com/v1/reputation
FRAUD_SERVICE_URL=https://api.tripo04os.com/v1/fraud
SUBSCRIPTION_SERVICE_URL=https://api.tripo04os.com/v1/subscription
ANALYTICS_SERVICE_URL=https://api.tripo04os.com/v1/analytics
PAYMENT_SERVICE_URL=https://api.tripo04os.com/v1/payment
MAPS_SERVICE_URL=https://api.tripo04os.com/v1/maps
NOTIFICATION_SERVICE_URL=https://api.tripo04os.com/v1/notification
SMS_SERVICE_URL=https://api.tripo04os.com/v1/sms

# Databases (Amazon RDS)
DATABASE_URL=postgresql://tripo04os:VERY_STRONG_PASSWORD_ROTATE_REGULARLY@tripo04os-production.cXXXXX.us-east-1.rds.amazonaws.com:5432/tripo04os
REDIS_URL=rediss://:tripo04os-production.xXXXXX.0001.use1.cache.amazonaws.com:6379/0
REDIS_PASSWORD=VERY_STRONG_PASSWORD_ROTATE_REGULARLY

# Message Queue (Amazon MSK)
KAFKA_BROKERS=tripo04os-production.xXXXXX.cXXXXX.use1.amazonaws.com:9092
KAFKA_BROKER_1=tripo04os-production-b-1.xXXXXX.cXXXXX.use1.amazonaws.com:9094
KAFKA_BROKER_2=tripo04os-production-b-2.xXXXXX.cXXXXX.use1.amazonaws.com:9096
KAFKA_TOPICS=rider-updates,driver-updates,payment-updates

# Firebase (production)
FIREBASE_PROJECT_ID=tripo04os-production
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END PRIVATE KEY-----

# Stripe (live mode)
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PLATFORM_ID=acct_XXXXXXXXXXXX

# Google Maps (with production quota)
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Twilio (production account)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=+1234567890

# JWT
JWT_SECRET=production-secret-ROTATE-THIS-IMMEDIATELY-USE-CRYPTO-SECURE-GENERATION
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=168h

# Logging
LOG_LEVEL=warn
SENTRY_DSN=https://XXXXX@sentry.io/XXXXX

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_PREMIUM_MATCHING=true
ENABLE_PROFIT_OPTIMIZATION=true
ENABLE_MULTI_STOP_RIDES=false
ENABLE_SPLIT_PAYMENT=false
```

## Security Best Practices

### 1. Never Commit .env Files

Add to `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.production
.env.staging
.env.development

# Firebase
firebase-*.json
google-services.json
GoogleService-Info.plist

# Stripe
stripe-*.json

# Google Maps
google-*.json
```

### 2. Use Strong Secrets

Generate secrets with at least 32 characters:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate password
openssl rand -base64 24

# Generate webhook secret
openssl rand -base64 32
```

### 3. Rotate Secrets Regularly

- JWT secrets: Every 90 days
- Database passwords: Every 90 days
- API keys: Every 90 days
- Webhook secrets: Every 90 days

### 4. Use Environment-Specific Keys

- Development: Test keys only
- Staging: Test or production keys
- Production: Production keys only

### 5. Enable Secrets Rotation

```bash
# Set up AWS Secrets Manager
# Use AWS Secrets Manager for production secrets
# Rotate secrets using Lambda functions
```

## License

Proprietary - Tripo04OS Internal Use Only
