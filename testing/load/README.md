# Load Testing for Tripo04OS

## Overview

Load testing to verify system capacity and performance under high concurrent user load.

## Load Testing Strategy

### 1. Ramp-Up Test

Gradually increase user load to test system behavior.

**Configuration**:
- Start: 10 users
- End: 500 users
- Duration: 10 minutes
- Ramp time: 5 minutes

**Purpose**: Test auto-scaling and gradual load handling.

### 2. Steady State Test

Maintain constant user load for extended period.

**Configuration**:
- Users: 500 concurrent users
- Duration: 30 minutes
- Constant load

**Purpose**: Test system stability under continuous load.

### 3. Spike Test

Sudden increase in load to test recovery.

**Configuration**:
- Baseline: 100 users
- Spike: 1000 users (10x increase)
- Duration: 5 minutes
- Recovery time: 10 minutes

**Purpose**: Test system resilience to traffic spikes.

### 4. Stress Test

Push system beyond expected load to find breaking point.

**Configuration**:
- Users: Gradually increase to 2000 users
- Duration: Until failure or 60 minutes
- Increment: +100 users every 2 minutes

**Purpose**: Find system capacity limits and failure modes.

## Load Test Scenarios

### Scenario 1: Order Creation Load

Simulate many users creating orders simultaneously.

**Metrics**:
- Orders per second
- Order creation latency (p50, p95, p99)
- Error rate
- Database write performance

**Script**: `load/scenarios/order-creation-load.js`

### Scenario 2: Trip Execution Load

Simulate many active trips with location updates.

**Metrics**:
- Location updates per second
- Location update latency
- Message queue depth
- Matching service performance

**Script**: `load/scenarios/trip-execution-load.js`

### Scenario 3: Mixed Workload

Simulate realistic traffic mix:
- 40% Order creation
- 30% Trip updates
- 20% Location updates
- 10% Notifications

**Script**: `load/scenarios/mixed-workload.js`

## Performance Targets

### Critical Paths

| Endpoint | p95 Target | p99 Target | Max Error Rate |
|----------|------------|------------|----------------|
| POST /auth/login | 200ms | 500ms | 0.5% |
| POST /orders | 300ms | 700ms | 1% |
| GET /orders/{id} | 150ms | 300ms | 0.5% |
| POST /trips/{id}/accept | 200ms | 400ms | 1% |
| POST /trips/{id}/complete | 300ms | 700ms | 1% |
| POST /payments/create-intent | 500ms | 1000ms | 2% |

### Infrastructure Targets

| Metric | Target |
|--------|---------|
| CPU Utilization | < 80% |
| Memory Usage | < 85% |
| Database Connections | < 1000 |
| Message Queue Depth | < 10,000 |
| API Response Time (p95) | < 500ms |
| Error Rate | < 1% |

## Tools

### Locust

Python-based load testing tool.

```bash
# Install Locust
pip install locust

# Run load test
locust -f load/scenarios/order-creation-load.py --users 500 --spawn-rate 10 --run-time 600

# Run with web UI
locust -f load/scenarios/order-creation-load.py --users 500 --host http://localhost:8020
```

### k6

Modern, scriptable load testing tool.

```bash
# Run load test
k6 run load/scenarios/api-benchmark.js --vus 500 --duration 600s

# Run with output
k6 run load/scenarios/api-benchmark.js --vus 500 --duration 600s \
  --out json=load/reports/load-test.json
```

### Gatling

Scala-based load testing tool.

```bash
# Run load test
gatling -s load/scenarios/OrderCreationSimulation \
  -r 500 -d 600 -rd 5 -rdm 10
```

## Load Test Scripts

### Order Creation Load Test (k6)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 500,
  duration: '600s',
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<700'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:8020/api/v1/auth/login', JSON.stringify({
    email: 'test-rider@example.com',
    password: 'TestPass123!',
  }));

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('token');

  // Create order
  const orderRes = http.post('http://localhost:8020/api/v1/orders', JSON.stringify({
    vertical: 'RIDE',
    product: 'STANDARD',
    pickupLocation: { lat: 40.7128, lon: -74.0060 },
    dropoffLocation: { lat: 40.7614, lon: -73.9776 },
    paymentMethod: 'CARD',
  }), {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(orderRes, {
    'order created': (r) => r.status === 201,
  });

  sleep(1);  // 1 second between requests per user
}
```

## Running Load Tests

```bash
# Run all load tests
npm run test:load

# Run specific scenarios
npm run test:load:ramp-up      # Ramp-up test
npm run test:load:steady-state  # Steady state test
npm run test:load:spike        # Spike test
npm run test:load:stress       # Stress test

# Generate reports
npm run report:load
```

## Monitoring During Load Tests

### Prometheus Metrics

Monitor these metrics during load tests:

```yaml
# API Metrics
api_request_duration_seconds{endpoint, method, status}
api_request_total{endpoint, method, status}
api_errors_total{endpoint, error_type}

# Database Metrics
db_query_duration_seconds{query}
db_connections_active
db_statement_duration_seconds{operation}

# Message Queue Metrics
kafka_consumer_lag{topic, group}
kafka_message_size{topic}

# Infrastructure Metrics
cpu_usage_percent{service}
memory_usage_bytes{service}
network_receive_bytes_total{service}
network_transmit_bytes_total{service}
```

### Grafana Dashboards

Create dashboards for:

1. **Request Rate Dashboard**
   - Requests per second
   - Concurrent users
   - Response times

2. **Error Rate Dashboard**
   - HTTP 5xx errors
   - HTTP 4xx errors
   - Application errors

3. **Resource Usage Dashboard**
   - CPU usage
   - Memory usage
   - Disk I/O

## Analyzing Results

### Success Criteria

- All endpoints meet p95 response time targets
- Error rate < 1%
- No service crashes
- Auto-scaling triggered appropriately
- Database performance acceptable

### Failure Modes

Identify and document:

1. **Bottlenecks**: Which service fails first?
2. **Resource Exhaustion**: CPU, memory, database, network?
3. **Concurrency Issues**: Race conditions, deadlocks?
4. **Scaling Failures**: Auto-scaling not triggered?
5. **External Dependencies**: Stripe, maps, notifications?

## Optimization Recommendations

Based on load test results:

1. **Database Optimization**
   - Add indexes on frequent queries
   - Implement connection pooling
   - Use read replicas for SELECT-heavy queries

2. **Caching Strategy**
   - Cache frequently accessed data (Redis)
   - Implement CDN for static assets
   - Use HTTP caching headers

3. **API Optimization**
   - Implement pagination
   - Use compression (gzip, brotli)
   - Optimize response payloads

4. **Infrastructure Scaling**
   - Increase instance size
   - Add auto-scaling rules
   - Use load balancers
   - Implement circuit breakers

5. **Message Queue Optimization**
   - Increase partition count
   - Optimize consumer batch size
   - Implement dead letter queues

## Capacity Planning

### User Growth Projections

| Phase | Users | Concurrent Users | Orders/Day |
|--------|--------|-----------------|-----------|
| Week 1 | 50 | 10 | 200 |
| Week 2 | 200 | 40 | 800 |
| Week 3 | 1,000 | 200 | 4,000 |
| Week 4 | 5,000 | 1,000 | 20,000 |
| Week 5+ | 50,000+ | 10,000 | 200,000 |

### Infrastructure Requirements

Based on load test results, provision:

```
Production Environment:
├── Load Balancer: AWS ALB / Google Cloud Load Balancer
├── Application Servers: Auto-scaling group (min 5, max 50)
├── Database: PostgreSQL with read replicas
├── Cache: Redis Cluster
└── Message Queue: Kafka cluster (3 brokers)
```

## Next Steps

1. Run all load test scenarios
2. Identify bottlenecks and capacity limits
3. Implement optimizations
4. Update infrastructure configuration
5. Re-run tests to verify improvements
6. Document capacity planning

## License

Proprietary - Tripo04OS Internal Use Only
