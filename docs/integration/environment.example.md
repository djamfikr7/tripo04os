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
FIREBASE_API_KEY=REPLACE_WITH_ACTUAL_FIREBASE_API_KEY

# Stripe
STRIPE_SECRET_KEY=REPLACE_WITH_ACTUAL_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=REPLACE_WITH_ACTUAL_STRIPE_PUBLISHABLE_KEY

# Google Maps
GOOGLE_MAPS_API_KEY=REPLACE_WITH_ACTUAL_GOOGLE_MAPS_API_KEY

# Twilio
TWILIO_ACCOUNT_SID=REPLACE_WITH_ACTUAL_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=REPLACE_WITH_ACTUAL_TWILIO_AUTH_TOKEN
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
FIREBASE_API_KEY=REPLACE_WITH_ACTUAL_FIREBASE_API_KEY
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
REPLACE_WITH_ACTUAL_FIREBASE_PRIVATE_KEY
-----END PRIVATE KEY-----

# Stripe (test mode)
STRIPE_SECRET_KEY=REPLACE_WITH_ACTUAL_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=REPLACE_WITH_ACTUAL_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=REPLACE_WITH_ACTUAL_STRIPE_WEBHOOK_SECRET

# Google Maps (with quota)
GOOGLE_MAPS_API_KEY=REPLACE_WITH_ACTUAL_GOOGLE_MAPS_API_KEY

# Twilio (test account)
TWILIO_ACCOUNT_SID=REPLACE_WITH_ACTUAL_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=REPLACE_WITH_ACTUAL_TWILIO_AUTH_TOKEN
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
REDIS_URL=rediss://tripo04os-production.xXXXXX.0001.use1.cache.amazonaws.com:6379/0
REDIS_PASSWORD=VERY_STRONG_PASSWORD_ROTATE_REGULARLY

# Message Queue (Amazon MSK)
KAFKA_BROKERS=tripo04os-production.xXXXXX.cXXXXX.use1.amazonaws.com:9092
KAFKA_BROKER_1=tripo04os-production-b-1.xXXXXX.cXXXXX.use1.amazonaws.com:9094
KAFKA_BROKER_2=tripo04os-production-b-2.xXXXXX.cXXXXX.use1.amazonaws.com:9096
KAFKA_TOPICS=rider-updates,driver-updates,payment-updates

# Firebase (production)
FIREBASE_PROJECT_ID=tripo04os-production
FIREBASE_API_KEY=REPLACE_WITH_ACTUAL_FIREBASE_API_KEY
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
REPLACE_WITH_ACTUAL_FIREBASE_PRIVATE_KEY
-----END PRIVATE KEY-----

# Stripe (live mode)
STRIPE_SECRET_KEY=REPLACE_WITH_ACTUAL_STRIPE_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=REPLACE_WITH_ACTUAL_STRIPE_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=REPLACE_WITH_ACTUAL_STRIPE_WEBHOOK_SECRET
STRIPE_PLATFORM_ID=acct_REPLACE_WITH_ACTUAL_STRIPE_PLATFORM_ID

# Google Maps (with production quota)
GOOGLE_MAPS_API_KEY=REPLACE_WITH_ACTUAL_GOOGLE_MAPS_API_KEY

# Twilio (production account)
TWILIO_ACCOUNT_SID=REPLACE_WITH_ACTUAL_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=REPLACE_WITH_ACTUAL_TWILIO_AUTH_TOKEN
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

## Backend Services

### Identity Service

```env
# Service Configuration
IDENTITY_SERVICE_PORT=8001
IDENTITY_SERVICE_NAME=Identity Service

# Database
IDENTITY_DB_HOST=postgres-service
IDENTITY_DB_PORT=5432
IDENTITY_DB_NAME=tripo04os_identity

# Redis
IDENTITY_REDIS_HOST=redis-service
IDENTITY_REDIS_PORT=6379

# JWT
IDENTITY_JWT_SECRET=${JWT_SECRET}
IDENTITY_JWT_EXPIRATION=${JWT_EXPIRATION}
IDENTITY_REFRESH_TOKEN_EXPIRATION=${REFRESH_TOKEN_EXPIRATION}

# Password Policy
IDENTITY_PASSWORD_MIN_LENGTH=8
IDENTITY_PASSWORD_REQUIRE_UPPER=true
IDENTITY_PASSWORD_REQUIRE_LOWER=true
IDENTITY_PASSWORD_REQUIRE_NUMBER=true
IDENTITY_PASSWORD_REQUIRE_SPECIAL=true

# Rate Limiting
IDENTITY_MAX_LOGIN_ATTEMPTS=5
IDENTITY_LOCKOUT_DURATION=15m
IDENTITY_PASSWORD_RESET_TOKEN_TTL=1h

# Email Verification
IDENTITY_EMAIL_VERIFICATION_REQUIRED=true
IDENTITY_EMAIL_VERIFICATION_TOKEN_TTL=24h
IDENTITY_EMAIL_VERIFICATION_FROM=noreply@tripo04os.com
```

### Location Service

```env
# Service Configuration
LOCATION_SERVICE_PORT=8002
LOCATION_SERVICE_NAME=Location Service

# Database
LOCATION_DB_HOST=postgres-service
LOCATION_DB_PORT=5432
LOCATION_DB_NAME=tripo04os_location

# Redis
LOCATION_REDIS_HOST=redis-service
LOCATION_REDIS_PORT=6379

# Google Maps
LOCATION_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
LOCATION_GOOGLE_MAPS_DEFAULT_ZOOM=15
LOCATION_GOOGLE_MAPS_MIN_ZOOM=3
LOCATION_GOOGLE_MAPS_MAX_ZOOM=20

# Geocoding
LOCATION_GEOCODING_CACHE_TTL=24h
LOCATION_GEOCODING_MAX_RESULTS=5
LOCATION_GEOCODING_REGION=us

# Location Updates
LOCATION_UPDATE_INTERVAL=5s
LOCATION_EXPIRY=30m
LOCATION_MAX_SEARCH_RADIUS=50000

```

### Order Service

```env
# Service Configuration
ORDER_SERVICE_PORT=8003
ORDER_SERVICE_NAME=Order Service

# Database
ORDER_DB_HOST=postgres-service
ORDER_DB_PORT=5432
ORDER_DB_NAME=tripo04os_order

# Redis
ORDER_REDIS_HOST=redis-service
ORDER_REDIS_PORT=6379

# Kafka
ORDER_KAFKA_BROKERS=${KAFKA_BROKERS}
ORDER_KAFKA_TOPIC=rider-updates

# Order Configuration
ORDER_TIMEOUT=5m
ORDER_MAX_PENDING_ORDERS=100
ORDER_AUTO_CANCEL_TIMEOUT=10m
ORDER_RETRY_ATTEMPTS=3

# Verticals
ORDER_SUPPORTED_VERTICALS=ride,moto,food,grocery,goods,truck_van
ORDER_DEFAULT_VERTICAL=ride

# Pricing
ORDER_DEFAULT_CURRENCY=usd
ORDER_MIN_FARE=3.00
ORDER_MAX_FARE=1000.00
```

### Trip Service

```env
# Service Configuration
TRIP_SERVICE_PORT=8004
TRIP_SERVICE_NAME=Trip Service

# Database
TRIP_DB_HOST=postgres-service
TRIP_DB_PORT=5432
TRIP_DB_NAME=tripo04os_trip

# Redis
TRIP_REDIS_HOST=redis-service
TRIP_REDIS_PORT=6379

# Kafka
TRIP_KAFKA_BROKERS=${KAFKA_BROKERS}
TRIP_KAFKA_TOPIC=driver-updates

# Trip Configuration
TRIP_TIMEOUT=120m
TRIP_MIN_DISTANCE=0.1km
TRIP_MAX_DISTANCE=100km

# Rating
TRIP_MIN_RATING=1
TRIP_MAX_RATING=5
TRIP_MIN_TRIPS_FOR_RATING=5
TRIP_RATING_DECAY_DAYS=90

# Cancellation
TRIP_CANCELLATION_FEE_PERCENT=10
TRIP_CANCELLATION_FEE_MAX_AMOUNT=20.00
TRIP_DRIVER_CANCELLATION_FEE=5.00
TRIP_RIDER_CANCELLATION_TIMEOUT=2m
```

### Matching Service

```env
# Service Configuration
MATCHING_SERVICE_PORT=8005
MATCHING_SERVICE_NAME=Matching Service

# Database
MATCHING_DB_HOST=postgres-service
MATCHING_DB_PORT=5432
MATCHING_DB_NAME=tripo04os_matching

# Redis
MATCHING_REDIS_HOST=redis-service
MATCHING_REDIS_PORT=6379

# Matching Configuration
MATCHING_RADIUS=5000
MATCHING_TIMEOUT=30s
MATCHING_MAX_DRIVERS_TO_NOTIFY=5
MATCHING_DRIVERS_PER_REQUEST=3

# Driver Assignment Scoring
MATCHING_ETA_SCORE_WEIGHT=0.35
MATCHING_RATING_SCORE_WEIGHT=0.25
MATCHING_RELIABILITY_SCORE_WEIGHT=0.15
MATCHING_FAIRNESS_BOOST_WEIGHT=0.15
MATCHING_VEHICLE_MATCH_WEIGHT=0.10

# Premium Matching
MATCHING_PREMIUM_ENABLED=${ENABLE_PREMIUM_MATCHING}
MATCHING_PREMIUM_MATCHING_FEE_MULTIPLIER=2.0
MATCHING_PREMIUM_MIN_RATING=4.5
MATCHING_PREMIUM_TOP_PERCENT=10
```

### Pricing Service

```env
# Service Configuration
PRICING_SERVICE_PORT=8006
PRICING_SERVICE_NAME=Pricing Service

# Database
PRICING_DB_HOST=postgres-service
PRICING_DB_PORT=5432
PRICING_DB_NAME=tripo04os_pricing

# Redis
PRICING_REDIS_HOST=redis-service
PRICING_REDIS_PORT=6379

# Dynamic Pricing
PRICING_DYNAMIC_PRICING_ENABLED=${ENABLE_PROFIT_OPTIMIZATION}
PRICING_SURGE_MULTIPLIER_MIN=1.0
PRICING_SURGE_MULTIPLIER_MAX=3.0
PRICING_BASE_FARE_MULTIPLIER=1.5

# Service-Specific Configuration
PRICING_RIDE_BASE_FARE=3.00
PRICING_RIDE_PER_KM=2.00
PRICING_RIDE_PER_MIN=0.50

PRICING_MOTO_BASE_FARE=2.50
PRICING_MOTO_PER_KM=1.50
PRICING_MOTO_PER_MIN=0.40

PRICING_FOOD_BASE_FARE=1.50
PRICING_FOOD_DELIVERY_FEE=2.00
PRICING_FOOD_SERVICE_FEE_PERCENT=15

PRICING_GROCERY_BASE_FARE=3.00
PRICING_GROCERY_DELIVERY_FEE=2.00
PRICING_GROCERY_SERVICE_FEE_PERCENT=12

PRICING_GOODS_BASE_FARE=5.00
PRICING_GOODS_DELIVERY_FEE=3.00
PRICING_GOODS_SERVICE_FEE_PERCENT=10

PRICING_TRUCK_VAN_BASE_FARE=20.00
PRICING_TRUCK_VAN_PER_KM=3.00
PRICING_TRUCK_VAN_PER_MIN=1.00
PRICING_TRUCK_VAN_HOUR_RATE=30.00
```

## Frontend Applications

### Flutter Rider App

Create `user_mobile_app_rider_flutter/.env`:

```env
# API Configuration
BASE_URL=${API_GATEWAY_URL}
API_TIMEOUT=30000

# Firebase
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_API_KEY=${FIREBASE_API_KEY}

# Google Maps
GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}

# Features
ENABLE_AI_CHAT=${ENABLE_AI_CHAT}
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_LOCATION_TRACKING=true

# App Configuration
DEFAULT_LANGUAGE=en
DEFAULT_CURRENCY=usd
DEFAULT_DISTANCE_UNIT=mi

# Analytics
SENTRY_DSN=${SENTRY_DSN}
ANALYTICS_ENABLED=true
CRASH_REPORTING_ENABLED=true

# Development
DEBUG_MODE=false
LOG_LEVEL=info
```

### Flutter Driver App

Create `driver_mobile_app_flutter/.env`:

```env
# API Configuration
BASE_URL=${API_GATEWAY_URL}
API_TIMEOUT=30000

# Firebase
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_API_KEY=${FIREBASE_API_KEY}

# Google Maps
GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}

# Driver Configuration
DEFAULT_VEHICLE_TYPE=sedan
DEFAULT_SERVICE_TYPE=ride
AUTO_ACCEPT=false
MAX_CONCURRENT_TRIPS=1

# Payout Configuration
PAYOUT_METHOD=bank
PAYOUT_MIN_AMOUNT=50.00
PAYOUT_SCHEDULE=weekly

# Analytics
SENTRY_DSN=${SENTRY_DSN}
ANALYTICS_ENABLED=true
CRASH_REPORTING_ENABLED=true

# Development
DEBUG_MODE=false
LOG_LEVEL=info
```

### React Admin Dashboard

Create `admin_dashboard_react/.env`:

```env
# API Configuration
REACT_APP_API_URL=${API_GATEWAY_URL}
REACT_APP_TIMEOUT=30000

# Firebase
REACT_APP_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
REACT_APP_FIREBASE_API_KEY=${FIREBASE_API_KEY}

# Analytics
REACT_APP_SENTRY_DSN=${SENTRY_DSN}
REACT_APP_ANALYTICS_ENABLED=true

# Feature Flags
REACT_APP_ENABLE_AI_CHAT=${ENABLE_AI_CHAT}
REACT_APP_ENABLE_PROFIT_OPTIMIZATION=${ENABLE_PROFIT_OPTIMIZATION}

# App Configuration
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_DEFAULT_CURRENCY=usd
REACT_APP_TIMEZONE=UTC

# Development
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=info
```

### React Web Interface

Create `web_interface_react/.env`:

```env
# API Configuration
REACT_APP_API_URL=${API_GATEWAY_URL}
REACT_APP_TIMEOUT=30000

# Firebase
REACT_APP_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
REACT_APP_FIREBASE_API_KEY=${FIREBASE_API_KEY}

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}

# Analytics
REACT_APP_SENTRY_DSN=${SENTRY_DSN}
REACT_APP_ANALYTICS_ENABLED=true

# Feature Flags
REACT_APP_ENABLE_AI_CHAT=${ENABLE_AI_CHAT}
REACT_APP_ENABLE_PROFIT_OPTIMIZATION=${ENABLE_PROFIT_OPTIMIZATION}

# App Configuration
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_DEFAULT_CURRENCY=usd
REACT_APP_TIMEZONE=UTC

# Development
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=info
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

## Troubleshooting

### Environment Variable Not Loading

```bash
# Check if .env file exists
ls -la .env

# Check if env file is loaded
printenv VARIABLE_NAME

# Restart application after .env changes
```

### Database Connection Failed

```bash
# Verify database URL format
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL
```

### API Key Invalid

```bash
# Verify API key is correct
echo $GOOGLE_MAPS_API_KEY

# Test API key with curl
curl "https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=$GOOGLE_MAPS_API_KEY"
```

### Webhook Not Receiving

```bash
# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test webhook endpoint
curl -X POST https://api.tripo04os.com/v1/payment/webhook \
  -H "Stripe-Signature: $EXPECTED_SIGNATURE" \
  -d '{"event_type":"payment_intent.succeeded",...}'
```

## Next Steps

1. **Copy Environment Templates**
    ```bash
    cp .env.example .env
    cp .env.example .env.staging
    cp .env.example .env.production
    ```

2. **Update Values**
    - Fill in all placeholders
    - Replace default values with actual values
    - Test each configuration

3. **Secure Production Secrets**
    - Generate strong, unique secrets
    - Use AWS Secrets Manager
    - Document rotation schedule

4. **Configure CI/CD**
    - Set up environment variables in CI/CD platform
    - Use encrypted secrets
    - Test staging deployment before production

5. **Update Documentation**
    - Document required environment variables
    - Update API documentation
    - Create troubleshooting guide

## Support

For environment configuration issues:
- Check logs for missing variables
- Verify service connections
- Test API integrations
- Review security logs
- Consult deployment documentation

## License

Proprietary - Tripo04OS Internal Use Only
