# Prometheus Monitoring Configuration for Tripo04OS Testing

## Overview

Prometheus configuration for collecting metrics from all services during performance testing.

## Configuration Files

- **prometheus.yml** - Main Prometheus configuration
- **docker-compose.monitoring.yml** - Monitoring stack (Prometheus + Grafana)

## Metrics Collected

### API Metrics

```yaml
http_request_duration_seconds{endpoint, method, status}
http_request_total{endpoint, method, status}
http_request_size_bytes{endpoint, method}
http_requests_in_flight{endpoint, method}

# Authentication
auth_login_duration_seconds
auth_login_total{success, failure}
auth_token_refresh_total
auth_register_duration_seconds
auth_register_total

# Orders
order_create_duration_seconds
order_update_duration_seconds
order_get_duration_seconds
orders_total_by_status{status}

# Trips
trip_start_duration_seconds
trip_complete_duration_seconds
trip_update_duration_seconds
trips_total_by_status{status}

# Payments
payment_create_intent_duration_seconds
payment_confirm_duration_seconds
payment_process_duration_seconds
payments_total{status}

# Maps
maps_geocode_duration_seconds
maps_route_duration_seconds
maps_eta_calculation_duration_seconds

# Locations
location_update_duration_seconds
location_get_nearby_duration_seconds

# Matching
matching_find_drivers_duration_seconds
matching_assign_driver_duration_seconds

# Pricing
pricing_calculate_duration_seconds
pricing_estimate_duration_seconds
```

### Database Metrics

```yaml
pg_stat_activity{datname}
pg_stat_database_size_bytes
pg_stat_connections_count
pg_stat_statements_total

# Queries
pg_query_duration_seconds{query}
pg_query_rows_scanned_total
pg_stat_statement_duration_seconds{query}

# Connections
pg_stat_activity{datname}
```

### Message Queue Metrics (Kafka)

```yaml
kafka_consumer_lag{topic, group}
kafka_message_size{topic}
kafka_producer_rate{topic}

kafka_message_consumed_total{topic}
kafka_message_produced_total{topic}
```

### Infrastructure Metrics

```yaml
system_cpu_usage_percent{service}
system_memory_usage_bytes{service}
system_disk_read_bytes_total{service}
system_disk_write_bytes_total{service}
system_network_receive_bytes_total{service}
system_network_transmit_bytes_total{service}

process_open_fds{service}
process_virtual_memory_bytes{service}
```

## Alerting Rules

### Critical Alerts

```yaml
# Service Down
alert: ServiceDown
for: 5m
annotations:
  summary: "Service {{ $labels.service }} is down"
  description: "Service {{ $labels.service }} has been down for more than 5 minutes"
expr: up{job="{{ $labels.service }}"} == 0

# High Error Rate
alert: HighErrorRate
for: 5m
annotations:
  summary: "High error rate for {{ $labels.service }}"
  description: "Error rate {{ $value | humanizePercentage }} exceeds 1% for {{ $labels.service }}"
expr: |
  sum(rate(http_requests_total{status="5xx"}[5m])) by (service)
  /
  sum(rate(http_requests_total[5m])) by (service)
  > 0.01
labels:
  service: test-app

# Slow Response Time
alert: SlowResponseTime
for: 5m
annotations:
  summary: "Slow response time for {{ $labels.endpoint }}"
  description: "95th percentile response time > 1s for {{ $labels.endpoint }}"
expr: |
  histogram_quantile(0.95, http_request_duration_seconds{endpoint="{{ $labels.endpoint }}"}[5m])
  > 1
labels:
  endpoint: /api/v1/auth/login

# High Database Connections
alert: HighDatabaseConnections
for: 5m
annotations:
  summary: "Too many database connections"
  description: "Database connections > 1000 for 5 minutes"
expr: pg_stat_connections_count{datname="tripo04os_test"} > 1000

# High Memory Usage
alert: HighMemoryUsage
for: 5m
annotations:
  summary: "High memory usage"
  description: "Memory usage > 90% for 5 minutes"
expr: system_memory_usage_bytes / system_memory_usage_bytes > 0.9
```

### Warning Alerts

```yaml
# Elevated Error Rate
alert: ElevatedErrorRate
for: 15m
annotations:
  summary: "Elevated error rate for {{ $labels.service }}"
  description: "Error rate > 0.5% for {{ $labels.service }}"
expr: |
  sum(rate(http_requests_total{status="4xx"}[15m])) by (service)
  /
  sum(rate(http_requests_total[15m])) by (service)
  > 0.005
labels:
  service: test-app

# High Response Time
alert: HighResponseTime
for: 15m
annotations:
  summary: "High response time for {{ $labels.endpoint }}"
  description: "95th percentile response time > 500ms for {{ $labels.endpoint }}"
expr: |
  histogram_quantile(0.95, http_request_duration_seconds{endpoint="{{ $labels.endpoint }}"}[15m])
  > 0.5
labels:
  endpoint: /api/v1/auth/login

# Database Connection Pool Exhaustion
alert: DatabaseConnectionPoolExhaustion
for: 15m
annotations:
  summary: "Database connection pool nearly exhausted"
  description: "Active connections > 80% of max"
expr: |
  pg_stat_activity{state="active"}{datname="tripo04os_test"} /
    pg_stat_activity{state="idle"}{datname="tripo04os_test"}
  > 0.8
```

### Info Alerts

```yaml
# Database Connection Count
alert: DatabaseConnectionCount
for: 1h
annotations:
  summary: "Database connection count: {{ $value }}"
  description: "Number of active database connections: {{ $value }}"
expr: pg_stat_connections_count{datname="tripo04os_test"}
```

## Performance Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API Response Time (p95) | 500ms | 1000ms |
| API Error Rate | 0.5% | 1% |
| Database Query Time (p95) | 100ms | 500ms |
| CPU Usage | 80% | 95% |
| Memory Usage | 85% | 95% |
| Database Connections | 800 | 1000 |

## Grafana Dashboards

### Dashboard 1: Service Overview

- Total requests per second
- Request latency (p50, p95, p99)
- Error rate by service
- Active database connections
- Memory and CPU usage

### Dashboard 2: API Performance

- Endpoint-specific response times
- Throughput by endpoint
- Error distribution (4xx, 5xx)

### Dashboard 3: Database Performance

- Query execution time
- Connection pool status
- Table/index usage
- Lock waits

### Dashboard 4: Message Queue

- Consumer lag by topic
- Message throughput
- Queue depth

### Dashboard 5: Infrastructure

- Disk I/O
- Network I/O
- Open file descriptors
- Process count

## Next Steps

1. Deploy monitoring stack
2. Configure alert notifications (email, Slack, PagerDuty)
3. Create Grafana dashboards
4. Set up retention policies
5. Configure alert routing and escalation

## License

Proprietary - Tripo04OS Internal Use Only
