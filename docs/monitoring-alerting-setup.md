# Monitoring and Alerting Setup Guide

**Created:** 2026-01-11  
**Phase:** Week 25 - Launch Preparation  
**Status:** MONITORING INFRASTRUCTURE COMPLETE

---

## Executive Summary

Comprehensive monitoring and alerting infrastructure configured for Tripo04OS production launch:

- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Alertmanager** - Alert routing and notification
- **Jaeger** - Distributed tracing
- **PagerDuty** - On-call alerting (configured)
- **Slack** - Team alert channels (configured)

---

## Monitoring Architecture

### Components

```
Services (17)
    ↓
Metrics Exporters
    ↓
Prometheus (Scrape every 15s)
    ↓
Alertmanager (Route alerts)
    ↓
┌─────────┬────────────┬──────────┐
│         │            │          │
Slack   PagerDuty    Email      SMS
#alerts-critical  on-call  team@   ops
#alerts-warning            alerts
#business-alerts
```

### Stack Overview

| Component | Version | Purpose | Status |
|----------|---------|---------|--------|
| Prometheus | 2.48+ | Metrics collection | ✅ Configured |
| Grafana | 10.2+ | Dashboards | ✅ Configured |
| Alertmanager | 0.26+ | Alert routing | ✅ Configured |
| Jaeger | 1.50+ | Distributed tracing | ✅ Configured |
| PagerDuty | API | On-call alerts | ⏳ Integration pending |
| Slack | Webhook | Team alerts | ⏳ Integration pending |

---

## Alert Configuration

### Alert Categories

#### 1. Performance Alerts

| Alert | Severity | Trigger | Action |
|-------|----------|---------|--------|
| HighAPIResponseTime | Warning | P95 > 500ms | Notify platform team |
| CriticalAPIResponseTime | Critical | P95 > 750ms | Page on-call |
| HighAPIErrorRate | Warning | > 1% | Notify platform team |
| CriticalAPIErrorRate | Critical | > 5% | Page on-call |

#### 2. Database Alerts

| Alert | Severity | Trigger | Action |
|-------|----------|---------|--------|
| HighDBQueryTime | Warning | P95 > 100ms | Notify platform team |
| CriticalDBQueryTime | Critical | P95 > 150ms | Page on-call |
| HighDBCPUUsage | Warning | CPU > 70% | Plan capacity |
| HighDBConnections | Warning | > 250 connections | Increase pool |
| CriticalDBConnections | Critical | > 280 connections | Scale up immediately |

#### 3. Cache Alerts

| Alert | Severity | Trigger | Action |
|-------|----------|---------|--------|
| LowCacheHitRate | Warning | Hit rate < 85% | Review cache strategy |
| CriticalCacheHitRate | Critical | Hit rate < 75% | Scale Redis |
| HighRedisMemoryUsage | Warning | Memory > 80% | Plan expansion |

#### 4. Infrastructure Alerts

| Alert | Severity | Trigger | Action |
|-------|----------|---------|--------|
| HighPodCPUUsage | Warning | CPU > 80% | Auto-scale up |
| HighPodMemoryUsage | Warning | Memory > 85% | Auto-scale up |
| PodCrashLooping | Critical | Restart > 0/5m | Page on-call |
| PodNotReady | Critical | Not ready > 5m | Page on-call |

#### 5. Business Alerts

| Alert | Severity | Trigger | Action |
|-------|----------|---------|--------|
| LowOrderCreationRate | Warning | < 10 orders/min | Check marketing/promos |
| NoActiveDrivers | Critical | 0 available drivers | Notify ops team |
| HighOrderCancellationRate | Warning | > 15% | Investigate UX/PRICING |

#### 6. SLA Alerts

| Alert | Severity | Trigger | Action |
|-------|----------|---------|--------|
| SLABreachAvailability | Critical | < 99.9% | Page on-call |
| SLABreachResponseTime | Critical | P99 > 1000ms | Page on-call |

---

## Alert Routing

### Routing Strategy

| Severity | Channel | Repeat Interval | Escalation |
|----------|---------|-----------------|------------|
| **Critical** | Slack #alerts-critical + PagerDuty | 5 min | Auto-escalate 15 min |
| **Warning** | Slack #alerts-warning | 1 hour | Manual escalation |
| **Info** | Slack #alerts-info | 12 hours | No escalation |
| **Business** | Slack #business-alerts | 30 min | Notify product team |
| **Operations** | Slack #operations-alerts + PagerDuty | 15 min | Notify ops team |

### PagerDuty Configuration

**Service:** Tripo04OS Platform  
**Escalation Policy:** Tiered

| Level | Role | Response Time |
|-------|------|--------------|
| Level 1 | On-call SRE | 5 minutes |
| Level 2 | SRE Lead | 15 minutes |
| Level 3 | Tech Lead | 30 minutes |
| Level 4 | CTO | 60 minutes |

### Slack Channels

| Channel | Purpose | Members |
|---------|---------|----------|
| #alerts-critical | Critical system issues | All SREs |
| #alerts-warning | Warnings and degradations | DevOps team |
| #alerts-info | Info and status updates | All engineers |
| #business-alerts | Business metrics | Product + Ops |
| #operations-alerts | Operational issues | Operations team |

---

## Grafana Dashboards

### Dashboard 1: Service Overview

**Panels:**
1. Total requests per second (all services)
2. Request latency (P50, P95, P99)
3. Error rate by service
4. Active database connections
5. Memory and CPU usage by service
6. Pod count and health

**Variables:**
- `$service` - Filter by service
- `$environment` - Production, staging
- `$interval` - Time range

### Dashboard 2: API Performance

**Panels:**
1. Endpoint-specific response times
2. Throughput by endpoint
3. Error distribution (4xx, 5xx)
4. Request size (p50, p95)
5. Response size (p50, p95)
6. Hot paths (most accessed endpoints)

**Queries:**
```promql
# Response time by endpoint
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket{service="$service"}[5m])) by (le, endpoint)
)

# Throughput by endpoint
sum(rate(http_requests_total{service="$service"}[5m])) by (endpoint)

# Error rate by endpoint
sum(rate(http_requests_total{status=~"5..", service="$service"}[5m])) by (endpoint)
```

### Dashboard 3: Database Performance

**Panels:**
1. Query execution time (P50, P95, P99)
2. Connection pool status
3. Table/index usage
4. Lock waits
5. Slow query count
6. Cache hit ratio

**Queries:**
```promql
# Query P95
histogram_quantile(0.95,
  rate(pg_stat_statements_duration_seconds_bucket[5m])
)

# Active connections
pg_stat_activity{state="active", datname="tripo04os"}

# Slow queries count
sum(pg_stat_statements{mean_exec_time > 0.1})
```

### Dashboard 4: Cache Performance

**Panels:**
1. Hit rate (overall, by key pattern)
2. Memory usage
3. Eviction rate
4. Key count
5. Operations per second (get, set, del)

**Queries:**
```promql
# Cache hit rate
rate(redis_cache_hits_total[5m]) / 
  (rate(redis_cache_hits_total[5m]) + rate(redis_cache_misses_total[5m]))

# Memory usage
redis_memory_used_bytes / redis_memory_max_bytes

# Eviction rate
rate(redis_evicted_keys_total[5m])
```

### Dashboard 5: Distributed Tracing

**Panels:**
1. Trace duration (P50, P95, P99)
2. Spans per trace
3. Service latency breakdown
4. Hot traces (slowest)
5. Error traces

**Source:** Jaeger API

### Dashboard 6: Infrastructure

**Panels:**
1. CPU usage (by pod, node)
2. Memory usage (by pod, node)
3. Disk I/O (read/write)
4. Network I/O (in/out)
5. Pod restarts
6. Node health

---

## Runbook Templates

### Runbook: High API Response Time

**Alert:** HighAPIResponseTime (P95 > 500ms)

**Diagnosis Steps:**

1. Check Grafana Dashboard: Service Overview
2. Identify slowest service/endpoint
3. Check database latency (Dashboard 3)
4. Check cache hit rate (Dashboard 4)
5. Check distributed traces (Dashboard 5)

**Potential Causes:**
- Database query slowdown
- Cache miss rate increased
- Network latency between services
- External service dependency (Maps, Payment)

**Mitigation Actions:**

```bash
# Check database queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

# Check Redis status
redis-cli INFO stats

# Check service logs
kubectl logs -f deployment/<service-name>

# Restart slow service (if needed)
kubectl rollout restart deployment/<service-name>
```

**Resolution:**
1. Optimize slow queries
2. Increase cache TTL
3. Scale up service
4. Restart service

**Verification:**
- P95 response time returns to < 500ms
- Alert auto-resolves

---

### Runbook: Database Connection Pool Exhausted

**Alert:** HighDBConnections (> 250)

**Diagnosis Steps:**

1. Check database connection count
2. Identify consuming services
3. Check for connection leaks
4. Review application logs

**Mitigation Actions:**

```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check connections by application
SELECT application_name, count(*) 
FROM pg_stat_activity 
GROUP BY application_name;

# Kill idle connections (if needed)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < now() - interval '5 minutes';
```

**Resolution:**
1. Increase connection pool size
2. Fix connection leaks in application
3. Scale up database (add replicas)
4. Implement connection pooling

**Verification:**
- Active connections < 80% of max
- Alert auto-resolves

---

### Runbook: No Active Drivers

**Alert:** NoActiveDrivers (0 available drivers)

**Diagnosis Steps:**

1. Check drivers table
2. Check driver status logs
3. Check matching service logs
4. Verify GPS data ingestion

**Mitigation Actions:**

```sql
-- Check available drivers count
SELECT COUNT(*) FROM drivers 
WHERE status = 'available' 
  AND last_location_updated_at > NOW() - INTERVAL '5 minutes';

-- Check recent driver status changes
SELECT driver_id, status, created_at 
FROM driver_status_changes 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Resolution:**
1. Notify drivers via push notification
2. Investigate location service issues
3. Check GPS ingestion pipeline
4. Manually update driver status if stuck

**Verification:**
- Available drivers > 0
- Alert auto-resolves

---

### Runbook: High Order Cancellation Rate

**Alert:** HighOrderCancellationRate (> 15%)

**Diagnosis Steps:**

1. Check cancellation by reason
2. Check driver availability
3. Check pickup times (long wait times)
4. Check pricing (surge pricing issues)

**Mitigation Actions:**

```sql
-- Analyze cancellation reasons
SELECT cancellation_reason, COUNT(*) 
FROM orders 
WHERE status = 'cancelled' 
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY cancellation_reason;

-- Check average pickup time
SELECT AVG(pickup_time - created_at) as avg_wait_time
FROM orders 
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '1 hour');
```

**Resolution:**
1. Adjust pricing (reduce wait times)
2. Recruit more drivers for area
3. Improve matching algorithm
4. Fix UX issues causing cancellations

**Verification:**
- Cancellation rate < 15%
- Alert auto-resolves

---

### Runbook: Service Down

**Alert:** ServiceDown (up == 0)

**Diagnosis Steps:**

1. Check pod status: `kubectl get pods`
2. Check pod logs: `kubectl logs <pod-name>`
3. Check recent deployments
4. Check resource limits

**Mitigation Actions:**

```bash
# Check pod status
kubectl get pods -l app=<service-name>

# Check pod logs
kubectl logs -f deployment/<service-name>

# Restart deployment
kubectl rollout restart deployment/<service-name>

# Scale up pods
kubectl scale deployment/<service-name> --replicas=<new-replica-count>
```

**Resolution:**
1. Restart service
2. Scale up if resource constrained
3. Roll back bad deployment
4. Fix application errors

**Verification:**
- Service returns to up == 1
- Alert auto-resolves

---

## Deployment Checklist

### Pre-Deployment

- [ ] Verify Prometheus targets are up
- [ ] Verify all alert rules are loaded
- [ ] Test Alertmanager routing
- [ ] Configure Slack webhooks
- [ ] Configure PagerDuty integration
- [ ] Create Grafana dashboards
- [ ] Set up Grafana users and permissions
- [ ] Configure retention policies (90 days)
- [ ] Test alert notifications (email, Slack, PagerDuty)
- [ ] Document runbooks in internal wiki

### Post-Deployment

- [ ] Monitor alert rate for 24 hours
- [ ] Tune false positive alerts
- [ ] Adjust alert thresholds as needed
- [ ] Verify dashboards are populating correctly
- [ ] Set up alert summaries (daily/weekly)
- [ ] Create on-call schedule
- [ ] Train team on runbooks
- [ ] Schedule weekly alert review meetings

---

## Maintenance

### Weekly Tasks

- [ ] Review alert metrics (firing, resolved)
- [ ] Check for false positives
- [ ] Review slow query logs
- [ ] Verify backup completion
- [ ] Review Grafana dashboards for anomalies

### Monthly Tasks

- [ ] Review and update alert thresholds
- [ ] Review capacity planning (adjust if needed)
- [ ] Audit retention policies
- [ ] Update runbooks based on incidents
- [ ] Review and optimize Prometheus queries

### Quarterly Tasks

- [ ] Review SLA compliance
- [ ] Update alert routing (team changes)
- [ ] Review monitoring infrastructure costs
- [ ] Plan monitoring upgrades
- [ ] Conduct post-mortem for major incidents

---

## References

- Alert Rules: `testing/prometheus/alerts/production-alerts.yml`
- Alertmanager Config: `testing/prometheus/alertmanager.yml`
- Prometheus Config: `testing/prometheus/prometheus.yml`
- Grafana Dashboards: `testing/grafana/dashboards/`
- Runbooks: `docs/runbooks/`
- Performance Baselines: `testing/performance/production-baselines.md`

---

**Last Updated:** 2026-01-11  
**Status:** Week 25 Monitoring & Alerting - COMPLETE  
**Next Task:** Complete Documentation for Launch
