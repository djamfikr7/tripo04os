# Performance Testing Guide

## Overview

This guide provides comprehensive instructions for running performance benchmarks and analyzing results for Tripo04OS.

## Prerequisites

### Infrastructure Requirements

- Docker and Docker Compose installed
- 4GB+ RAM available
- 10GB+ disk space available
- Network connectivity for external service mocks

### Software Requirements

- Node.js 18+
- k6 CLI installed globally
- Access to test environment

```bash
# Install k6
curl https://dl.k6.io/deb/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6

# Verify installation
k6 version
```

### Test Environment

Ensure all services are running in test mode:

```bash
cd testing
docker-compose up -d

# Verify services are healthy
docker-compose ps
```

## Running Performance Benchmarks

### Quick Start

Run all performance benchmarks with default settings:

```bash
cd testing/performance/scripts
node run-all-benchmarks.js
```

### Running Specific Benchmarks

#### API Benchmarks

```bash
# Run all API benchmarks
node run-benchmarks.js

# Run with custom environment
TEST_BASE_URL=http://staging.tripo04os.com node run-benchmarks.js
```

#### Database Profiling

```bash
# Run database query profiling
k6 run db-profiling.js \
  --vus 10 \
  --duration 60s \
  --out json=../../reports/db-profiling.json
```

#### Caching Tests

```bash
# Run cache effectiveness tests
k6 run caching-tests.js \
  --vus 10 \
  --duration 60s \
  --out json=../../reports/caching-tests.json
```

#### Distributed Tracing

```bash
# Run distributed tracing benchmarks
k6 run distributed-tracing.js \
  --vus 5 \
  --duration 60s \
  --out json=../../reports/tracing-tests.json
```

### Configuration Options

Environment variables to customize benchmarks:

```bash
# Base URL for API calls
export TEST_BASE_URL=http://localhost:8020

# Database admin URL for query analysis
export DB_ADMIN_URL=http://localhost:8023

# Jaeger host for trace analysis
export JAEGER_HOST=http://localhost:16686

# Redis URL for cache tests
export REDIS_URL=http://localhost:6379
```

## Monitoring During Tests

### Access Grafana Dashboards

Start monitoring stack:

```bash
cd testing
docker-compose -f docker-compose.monitoring.yml up -d
```

Access dashboards:
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686

### Key Metrics to Monitor

#### API Performance

- Request rate (requests/sec)
- Response times (P50, P95, P99)
- Error rate (4xx, 5xx errors)
- Active connections

#### Database Performance

- Query execution time
- Active connections
- Slow queries count
- Lock waits

#### Cache Performance

- Cache hit rate
- Memory usage
- Eviction rate
- Key count

#### Infrastructure

- CPU usage
- Memory usage
- Disk I/O
- Network I/O

## Analyzing Results

### Performance Targets

| Metric | Target | Current | Status |
|---------|---------|---------|--------|
| API P95 Response Time | < 500ms | - | ⏳ |
| API P99 Response Time | < 1000ms | - | ⏳ |
| Database Query P95 | < 100ms | - | ⏳ |
| Cache Hit Rate | > 80% | - | ⏳ |
| Trace P95 Duration | < 1000ms | - | ⏳ |
| Error Rate | < 1% | - | ⏳ |

### Reviewing Benchmark Reports

Each benchmark generates a JSON report with:

```json
{
  "timestamp": "2026-01-10T18:42:31.000Z",
  "summary": {
    "totalRequests": 1000,
    "avgResponseTime": 250.5,
    "p95ResponseTime": 450,
    "p99ResponseTime": 620,
    "errorRate": "0.2%"
  },
  "recommendations": [
    {
      "type": "PERFORMANCE",
      "priority": "HIGH",
      "message": "Average response time exceeds target"
    }
  ]
}
```

### Common Performance Issues

#### Slow API Endpoints

**Symptoms**:
- P95 response time > 500ms
- High latency variance
- Timeouts

**Diagnosis Steps**:

1. Check Grafana for high response times
2. Review Jaeger traces for slow services
3. Check database query times
4. Identify network latency

**Solutions**:
- Add database indexes
- Implement caching (Redis)
- Optimize algorithms
- Reduce payload sizes
- Add CDN for static content

#### High Error Rate

**Symptoms**:
- Error rate > 1%
- 5xx errors increasing
- Service restarts

**Diagnosis Steps**:

1. Check Grafana for error spikes
2. Review application logs
3. Check database connectivity
4. Verify external service status

**Solutions**:
- Add connection pooling
- Implement retry logic
- Add circuit breakers
- Fix application bugs
- Scale infrastructure

#### Low Cache Hit Rate

**Symptoms**:
- Cache hit rate < 80%
- High database load
- Slow repeated queries

**Diagnosis Steps**:

1. Check Redis hit/miss statistics
2. Review cache key patterns
3. Analyze TTL settings
4. Check cache invalidation

**Solutions**:
- Increase TTL for stable data
- Optimize cache keys
- Implement write-through caching
- Add Redis cluster
- Review eviction policy

#### Slow Database Queries

**Symptoms**:
- Query P95 duration > 100ms
- High CPU on database
- Lock waits increasing

**Diagnosis Steps**:

1. Run db-profiling.js benchmark
2. Check pg_stat_statements
3. Review query plans
4. Identify table scans

**Solutions**:
- Add indexes on filter/join columns
- Optimize N+1 queries
- Add pagination
- Use materialized views
- Partition large tables

#### High Trace Duration

**Symptoms**:
- Trace P95 duration > 1000ms
- Many spans per trace
- Serial execution

**Diagnosis Steps**:

1. Check Jaeger for slow traces
2. Identify slowest spans
3. Check service dependencies
4. Review network latency

**Solutions**:
- Parallelize independent operations
- Optimize slow services
- Add data compression
- Reduce cross-service calls
- Implement asynchronous processing

## Optimization Workflow

### Week 1: Baseline & High Priority

```bash
# 1. Establish baseline
node run-all-benchmarks.js

# 2. Analyze results
# - Review performance-summary.json
# - Check Grafana dashboards
# - Identify top 3 bottlenecks

# 3. Implement HIGH priority recommendations
# - Fix slow queries (add indexes)
# - Implement caching (Redis)
# - Optimize slow APIs (algorithms)
```

### Week 2: Medium Priority & Validation

```bash
# 1. Implement MEDIUM priority recommendations
# - Increase cache TTL
# - Add pagination
# - Optimize external calls
# - Improve error handling

# 2. Re-run benchmarks
node run-all-benchmarks.js

# 3. Compare with baseline
# - Check if P95 times improved
# - Verify cache hit rate increased
# - Confirm error rate decreased
```

### Week 3-4: Fine-tuning & Regression Testing

```bash
# 1. Continuous optimization
# - Monitor production-like load
# - Adjust configurations
# - Fine-tune caching

# 2. Add regression tests
# - Create performance thresholds in CI/CD
# - Alert on performance degradation
# - Track trends over time

# 3. Final validation
# - Run full benchmark suite
# - Document final baseline
# - Create performance SLA
```

## Load Testing

### Running Load Tests

```bash
cd testing/load

# Ramp-up test (10 → 500 users over 10 min)
k6 run scenarios/ramp-up-test.js \
  --stage 10s:10 \
  --stage 600s:500

# Steady-state test (500 users for 30 min)
k6 run scenarios/stress-test.js \
  --vus 500 \
  --duration 1800s

# Spike test (100 → 1000 users)
k6 run scenarios/stress-test.js \
  --stage 30s:100 \
  --stage 60s:1000 \
  --stage 90s:100
```

### Load Test Scenarios

#### Order Creation Load

Simulate many users creating orders simultaneously.

**Metrics**:
- Orders per second
- Order creation latency (P50, P95, P99)
- Error rate
- Database write performance

**Command**:
```bash
k6 run scenarios/order-creation-load.js \
  --vus 500 \
  --duration 600s
```

#### Trip Execution Load

Simulate many active trips with location updates.

**Metrics**:
- Location updates per second
- Location update latency
- Message queue depth
- Matching service performance

**Command**:
```bash
k6 run scenarios/trip-execution-load.js \
  --vus 500 \
  --duration 600s
```

#### Mixed Workload

Simulate realistic traffic mix:
- 40% Order creation
- 30% Trip updates
- 20% Location updates
- 10% Notifications

**Command**:
```bash
k6 run scenarios/mixed-workload.js \
  --vus 500 \
  --duration 600s
```

## Security Testing

### Running Security Scans

```bash
cd testing/security

# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:8020 \
  -r zap-report.html

# Snyk dependency scan
snyk test

# Trivy container scan
trivy image tripo04os/api-gateway:latest
```

### Security Checklist

- [ ] OWASP Top 10 vulnerabilities scanned
- [ ] SQL injection tested
- [ ] XSS vulnerabilities tested
- [ ] CSRF protection verified
- [ ] Rate limiting configured
- [ ] Authentication bypass tested
- [ ] Authorization checks verified
- [ ] Dependency vulnerabilities scanned
- [ ] Container images scanned
- [ ] Secrets not exposed in logs

## Troubleshooting

### Common Issues

#### Benchmark Timeout

**Error**: `Benchmark execution timeout`

**Solution**:
```bash
# Increase timeout
export K6_TIMEOUT=600000  # 10 minutes

# Or run with longer timeout
k6 run benchmark.js --duration 1200s
```

#### Service Not Reachable

**Error**: `Connection refused` or `Host not reachable`

**Solution**:
```bash
# Verify services are running
docker-compose ps

# Check service logs
docker-compose logs [service-name]

# Restart services
docker-compose restart
```

#### Low Cache Hit Rate

**Error**: Cache hit rate < 50%

**Solution**:
```bash
# Check Redis is running
docker-compose logs redis

# Clear cache
redis-cli FLUSHALL

# Verify cache keys
redis-cli KEYS *

# Check Redis memory
redis-cli INFO memory
```

#### High Database CPU

**Error**: Database CPU > 90%

**Solution**:
```bash
# Check slow queries
docker exec postgres-test psql -U test_user -d tripo04os_test \
  -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Add indexes to slow queries
# See db-profiling.js for detailed analysis
```

## Best Practices

### Benchmark Design

1. **Warm-up phase** - Run benchmarks for 1-2 minutes before measuring
2. **Steady state** - Maintain constant load for accurate measurements
3. **Multiple runs** - Run each benchmark 3-5 times for consistency
4. **Isolation** - Run benchmarks on isolated test environment
5. **Realistic data** - Use production-like data volumes and patterns

### Performance Optimization

1. **Measure first** - Establish baseline before optimizing
2. **Optimize hot paths** - Focus on frequently executed code
3. **Cache effectively** - Cache data that's read often, written rarely
4. **Database optimization** - Index first, query optimization second
5. **Monitor continuously** - Set up alerts for performance degradation

### Load Testing

1. **Gradual ramp-up** - Increase load slowly to identify breaking points
2. **Steady state** - Maintain load to test stability
3. **Spike testing** - Test recovery from sudden load increases
4. **Stress testing** - Push beyond expected load to find limits

## Next Steps

1. Run initial performance benchmarks
2. Establish performance baseline
3. Implement HIGH priority optimizations
4. Re-run benchmarks and measure improvement
5. Implement MEDIUM priority optimizations
6. Finalize performance baselines
7. Create performance regression tests
8. Document performance SLAs

## License

Proprietary - Tripo04OS Internal Use Only
