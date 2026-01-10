# Testing Framework for Tripo04OS

This directory contains all testing infrastructure for Phase 6: Testing & Optimization.

## Directory Structure

```
testing/
├── e2e/                  # End-to-end tests
│   ├── fixtures/         # Test data and mock services
│   ├── suites/           # Test suites by feature
│   └── scripts/          # Helper scripts for E2E tests
├── performance/            # Performance testing
│   ├── benchmarks/        # Performance benchmark tests
│   ├── profiles/          # Performance profiles
│   └── scripts/          # Load testing scripts
├── security/               # Security testing
│   ├── scans/             # Security scan results
│   ├── scripts/          # Security testing scripts
│   └── reports/          # Security vulnerability reports
├── load/                  # Load testing
│   ├── scenarios/         # Load test scenarios
│   ├── scripts/          # Load testing scripts
│   └── reports/          # Load test results
├── shared/                # Shared utilities
│   ├── utils/            # Common test utilities
│   ├── config/           # Test configuration
│   └── mocks/            # Mock services
├── docker-compose.yml     # Test environment orchestration
├── Makefile              # Common test commands
└── README.md             # This file
```

## Testing Strategy

### 1. End-to-End (E2E) Testing
**Goal**: Validate complete user journeys across all services.

**Test Scenarios**:
- Rider creates order → receives driver → completes trip → rates driver
- Driver accepts order → picks up rider → completes trip → receives payment
- Corporate user creates order → invoice generation → payment processing
- Shared ride booking → multiple rider matching → trip execution

**Tools**:
- Cypress for web UI
- Detox/Appium for mobile apps
- Supertest for API testing

### 2. Performance Testing
**Goal**: Ensure system meets performance requirements under load.

**Metrics**:
- API response time (p50, p95, p99)
- Database query time
- Message queue depth
- Memory and CPU usage
- Concurrency handling

**Tools**:
- k6 for load testing
- Prometheus for metrics collection
- Grafana for visualization

### 3. Security Testing
**Goal**: Identify and fix security vulnerabilities.

**Tests**:
- OWASP Top 10 vulnerabilities
- SQL injection
- XSS attacks
- CSRF protection
- API rate limiting
- Authentication bypass
- Authorization checks

**Tools**:
- OWASP ZAP
- Snyk for dependency scanning
- Trivy for container scanning

### 4. Load Testing
**Goal**: Verify system can handle target user load.

**Scenarios**:
- 50 concurrent users
- 500 concurrent users
- 5000 concurrent users
- Spike testing (sudden load increase)

**Tools**:
- Locust
- k6
- Gatling

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.11+
- k6 CLI (for load testing)

### Installation

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start test environment
docker-compose up -d
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run performance benchmarks
npm run test:performance

# Run security scans
npm run test:security

# Run load tests
npm run test:load
```

## Test Environment

The test environment includes:

- **PostgreSQL**: Test database with seeded data
- **Redis**: Test cache and session storage
- **Kafka**: Test message queue
- **All 17 Services**: Running in test mode
- **Mock External Services**: Stripe, OSM, Firebase, Twilio, SendGrid

## Configuration

### Environment Variables

```bash
# Test Configuration
TEST_ENV=development|staging|production
TEST_TIMEOUT=30000  # 30 seconds
TEST_RETRY_COUNT=3

# Test Data
TEST_RIDER_COUNT=50
TEST_DRIVER_COUNT=10
TEST_ORDER_COUNT=100

# Load Testing
LOAD_TEST_USERS=500
LOAD_TEST_DURATION=600  # 10 minutes
LOAD_TEST_RAMP_UP=60  # 1 minute ramp up

# Performance Thresholds
API_RESPONSE_TIME_P95_MS=500
API_RESPONSE_TIME_P99_MS=1000
DB_QUERY_TIME_P95_MS=100
```

## Test Data

### Fixtures

Located in `testing/shared/fixtures/`:

- **Users**: 50 test riders, 10 test drivers
- **Orders**: Sample orders for all 6 verticals
- **Vehicles**: Test vehicles for drivers
- **Locations**: Test coordinates and addresses

## CI/CD Integration

Tests run automatically on:
- Every pull request
- Every merge to main
- Nightly performance tests
- Weekly security scans

## Reporting

All test results are stored in:

- `testing/e2e/reports/` - E2E test results
- `testing/performance/reports/` - Performance reports
- `testing/security/reports/` - Security scan reports
- `testing/load/reports/` - Load test results

## Next Steps

1. Run all test suites
2. Fix failing tests
3. Address security vulnerabilities
4. Optimize performance bottlenecks
5. Document capacity limits

## Contributing

When adding new tests:
1. Follow existing test structure
2. Use shared fixtures and utilities
3. Ensure tests are idempotent
4. Add documentation for test scenarios
5. Include performance benchmarks for critical paths

## License

Proprietary - Tripo04OS Internal Use Only
