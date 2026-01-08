# Infrastructure Setup - Deploy Monitoring Platform

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Infrastructure Setup - Deploy Monitoring Platform |
| **Version** | 1.0 |
| **Date** | 2026-01-06 |
| **Status** | Draft |
| **Author** | Kilo Code |
| **Project** | Tripo04OS Phase 1 Implementation |
| **Monitoring Stack** | Prometheus + Grafana |

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Prometheus Deployment](#prometheus-deployment)
4. [Grafana Deployment](#grafana-deployment)
5. [Alerting Configuration](#alerting-configuration)
6. [Dashboard Configuration](#dashboard-configuration)
7. [Monitoring Targets](#monitoring-targets)
8. [Validation](#validation)

---

## 1. Overview

### 1.1 Purpose

This document provides step-by-step instructions for deploying a comprehensive monitoring platform for the Tripo04OS platform using Prometheus and Grafana, including:

- Prometheus deployment for metrics collection
- Grafana deployment for visualization
- Alerting configuration for notifications
- Dashboard templates for monitoring
- Service discovery and target configuration

### 1.2 Monitoring Stack Components

| Component | Purpose | Port |
|-----------|---------|------|
| Prometheus | Metrics collection and storage | 9090 |
| Grafana | Metrics visualization and dashboards | 3000 |
| Alertmanager | Alert routing and management | 9093 |
| Node Exporter | System metrics collection | 9100 |
| cAdvisor | Container metrics collection | 8080 |

### 1.3 Monitoring Targets

| Service | Metrics to Monitor | Alert Thresholds |
|----------|-------------------|------------------|
| AI Support API | Request rate, error rate, latency | Error rate > 5%, Latency > 500ms |
| Premium Driver Matching API | Match rate, accuracy, latency | Latency > 300ms |
| Profit Optimization API | Optimization rate, revenue impact | Optimization rate < 90% |
| Dashboard API | Response time, uptime | Response time > 1s, Uptime < 99.9% |
| PostgreSQL | Connections, query time, replication lag | Query time > 100ms |
| Redis | Memory usage, connections, hit rate | Memory > 80%, Hit rate < 90% |
| Elasticsearch | Cluster health, query time, indexing rate | Query time > 200ms |

---

## 2. Prerequisites

### 2.1 Kubernetes Cluster

- **EKS Cluster**: Amazon EKS cluster deployed and accessible
- **kubectl**: Configured to access EKS cluster
- **Helm**: Installed (version 3.x+)

### 2.2 Required Namespaces

```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Verify namespace
kubectl get namespace monitoring
```

### 2.3 Storage Configuration

```bash
# Create PersistentVolumeClaim for Prometheus
cat > prometheus-pvc.yaml <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-pvc
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: gp2
EOF

kubectl apply -f prometheus-pvc.yaml
```

---

## 3. Prometheus Deployment

### 3.1 Create Prometheus ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: 'tripo04os-production'
        environment: 'production'
    
    scrape_configs:
      # Kubernetes pods
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_name]
            action: keep
            regex: '(.*)'
            target_label: pod
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape_interval]
            action: labelmap
            regex: (.+)
            target_label: __meta_kubernetes_pod_annotation_prometheus_io_scrape_interval
            replacement: __param_value
          - action: labelmap
            regex: __param_(.+)
            replacement: $$1
          - source_labels: [__address__]
            target_label: __param_target
            replacement: $$1
          - source_labels: [__meta_kubernetes_pod_label_app]
            target_label: app
          - source_labels: [__meta_kubernetes_namespace]
            target_label: namespace
          - source_labels: [__meta_kubernetes_pod_node_name]
            target_label: node
      
      # Kubernetes services
      - job_name: 'kubernetes-services'
        kubernetes_sd_configs:
          - role: service
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape_interval]
            action: labelmap
            regex: (.+)
            target_label: __meta_kubernetes_service_annotation_prometheus_io_scrape_interval
            replacement: __param_value
          - action: labelmap
            regex: __param_(.+)
            replacement: $$1
          - source_labels: [__address__]
            target_label: __param_target
            replacement: $$1
          - source_labels: [__meta_kubernetes_service_name]
            target_label: service
      
      # Kubernetes nodes
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        relabel_configs:
          - source_labels: [__address__]
            target_label: __param_target
            replacement: $$1
          - source_labels: [__meta_kubernetes_node_name]
            target_label: node
          - source_labels: [__meta_kubernetes_node_label_kubernetes_io_hostname]
            target_label: hostname
      
      # AI Support API
      - job_name: 'ai-support-api'
        static_configs:
          - targets: ['ai-support-service.tripo04os-production.svc.cluster.local:8000']
        metrics_path: '/metrics'
        scrape_interval: 15s
      
      # Premium Driver Matching API
      - job_name: 'premium-driver-matching-api'
        static_configs:
          - targets: ['premium-driver-matching-service.tripo04os-production.svc.cluster.local:8001']
        metrics_path: '/metrics'
        scrape_interval: 15s
      
      # Profit Optimization API
      - job_name: 'profit-optimization-api'
        static_configs:
          - targets: ['profit-optimization-engine.tripo04os-production.svc.cluster.local:8002']
        metrics_path: '/metrics'
        scrape_interval: 15s
      
      # Dashboard API
      - job_name: 'dashboard-api'
        static_configs:
          - targets: ['dashboard-api.tripo04os-production.svc.cluster.local:8003']
        metrics_path: '/metrics'
        scrape_interval: 15s
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
                - alertmanager:9093
    
    rule_files:
      - '/etc/prometheus/rules/*.yml'
```

### 3.2 Create Prometheus Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
  labels:
    app: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:v2.45.0
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--web.console.libraries=/usr/share/prometheus/console_libraries'
          - '--web.console.templates=/usr/share/prometheus/consoles'
          - '--storage.tsdb.retention.time=30d'
          - '--web.enable-lifecycle'
        ports:
        - containerPort: 9090
          name: http
        volumeMounts:
        - name: prometheus-config
          mountPath: /etc/prometheus
        - name: prometheus-storage
          mountPath: /prometheus
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /-/healthy
            port: 9090
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /-/ready
            port: 9090
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-storage
        persistentVolumeClaim:
          claimName: prometheus-pvc
```

### 3.3 Create Prometheus Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
  labels:
    app: prometheus
spec:
  type: ClusterIP
  ports:
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: http
  selector:
    app: prometheus
```

### 3.4 Deploy Prometheus

```bash
# Apply ConfigMap
kubectl apply -f prometheus-config.yaml

# Apply PersistentVolumeClaim
kubectl apply -f prometheus-pvc.yaml

# Apply Deployment
kubectl apply -f prometheus-deployment.yaml

# Apply Service
kubectl apply -f prometheus-service.yaml

# Verify deployment
kubectl get pods -n monitoring -l app=prometheus

# Check logs
kubectl logs -n monitoring -l app=prometheus -f
```

---

## 4. Grafana Deployment

### 4.1 Create Grafana ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: monitoring
data:
  grafana.ini: |
    [server]
    root_url = https://grafana.tripo04os.com
    serve_from_sub_path = true
    
    [security]
    admin_user = admin
    admin_password = ${GRAFANA_ADMIN_PASSWORD}
    
    [database]
    type = postgresql
    host = grafana-postgresql.monitoring.svc.cluster.local
    port = 5432
    user = grafana
    password = ${GRAFANA_DB_PASSWORD}
    name = grafana
    
    [users]
    allow_sign_up = false
    auto_assign_org_role = Viewer
    
    [auth.anonymous]
    enabled = false
    
    [session]
    provider = memory
    provider_config = session
```

### 4.2 Create Grafana Provisioning Config

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-provisioning
  namespace: monitoring
data:
  datasources.yaml: |
    apiVersion: 1
    
    datasources:
      - name: Prometheus
        type: prometheus
        access: proxy
        url: http://prometheus.monitoring.svc.cluster.local:9090
        isDefault: true
        editable: true
        jsonData:
          timeInterval: 15s
          queryTimeout: 60s
            httpMethod: POST
```

### 4.3 Create Grafana Dashboard Config

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: monitoring
data:
  tripo04os-overview.json: |
    {
      "dashboard": {
        "title": "Tripo04OS Overview",
        "tags": ["tripo04os"],
        "timezone": "browser",
        "panels": [
          {
            "title": "Total Requests",
            "type": "graph",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total[5m]))",
                "legendFormat": "{{service}}"
              }
            ],
            "gridPos": { "x": 0, "y": 0 }
          },
          {
            "title": "Error Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
                "legendFormat": "{{service}}"
              }
            ],
            "gridPos": { "x": 12, "y": 0 }
          },
          {
            "title": "Response Time",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
                "legendFormat": "{{service}}"
              }
            ],
            "gridPos": { "x": 0, "y": 8 }
          }
        ],
        "refresh": "15s"
      }
    }
```

### 4.4 Create Grafana Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:10.0.3
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-password
        - name: GF_INSTALL_PLUGINS
          value: "grafana-piechart-panel,grafana-worldmap-panel"
        volumeMounts:
        - name: grafana-config
          mountPath: /etc/grafana
        - name: grafana-provisioning
          mountPath: /etc/grafana/provisioning/datasources
        - name: grafana-dashboards
          mountPath: /etc/grafana/provisioning/dashboards
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: grafana-config
        configMap:
          name: grafana-config
      - name: grafana-provisioning
        configMap:
          name: grafana-provisioning
      - name: grafana-dashboards
        configMap:
          name: grafana-dashboards
```

### 4.5 Create Grafana Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: grafana
```

### 4.6 Deploy Grafana

```bash
# Apply ConfigMaps
kubectl apply -f grafana-config.yaml
kubectl apply -f grafana-provisioning.yaml
kubectl apply -f grafana-dashboards.yaml

# Create secrets
kubectl create secret generic grafana-secrets \
  --from-literal=admin-password=$(openssl rand -base64 32) \
  --from-literal=db-password=$(openssl rand -base64 32) \
  -n monitoring

# Apply Deployment
kubectl apply -f grafana-deployment.yaml

# Apply Service
kubectl apply -f grafana-service.yaml

# Verify deployment
kubectl get pods -n monitoring -l app=grafana

# Get LoadBalancer URL
kubectl get svc grafana -n monitoring

# Check logs
kubectl logs -n monitoring -l app=grafana -f
```

---

## 5. Alerting Configuration

### 5.1 Create Alertmanager Config

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      slack_api_url: '${SLACK_WEBHOOK_URL}'
    
    templates:
      - '/etc/alertmanager/templates/*.tmpl'
    
    route:
      receiver: 'slack-notifications'
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'slack-notifications'
      routes:
        - match:
            severity: critical
          receiver: 'slack-critical'
        - match:
            severity: warning
          receiver: 'slack-warning'
    
    receivers:
      - name: 'slack-notifications'
        slack_configs:
          - api_url: '${SLACK_WEBHOOK_URL}'
            channel: '#alerts'
            title: 'Tripo04OS Alert'
            text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
      
      - name: 'slack-critical'
        slack_configs:
          - api_url: '${SLACK_CRITICAL_WEBHOOK_URL}'
            channel: '#critical-alerts'
            title: 'CRITICAL: {{ .GroupLabels.alertname }}'
            text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
      
      - name: 'slack-warning'
        slack_configs:
          - api_url: '${SLACK_WARNING_WEBHOOK_URL}'
            channel: '#warning-alerts'
            title: 'WARNING: {{ .GroupLabels.alertname }}'
            text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

### 5.2 Create Alert Rules

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: monitoring
data:
  alerts.yml: |
    groups:
      - name: api_alerts
        interval: 30s
        rules:
          - alert: HighErrorRate
            expr: |
              sum(rate(http_requests_total{status=~"5.."}[5m])) 
              / sum(rate(http_requests_total[5m])) * 100 > 5
            for: 5m
            labels:
              severity: critical
              service: api
            annotations:
              summary: "High error rate detected"
              description: "Error rate is {{ $value }}% for service {{ $labels.service }}"
          
          - alert: HighLatency
            expr: |
              histogram_quantile(0.95, 
                sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) > 0.5
            for: 5m
            labels:
              severity: warning
              service: api
            annotations:
              summary: "High latency detected"
              description: "95th percentile latency is {{ $value }}s for service {{ $labels.service }}"
          
          - alert: ServiceDown
            expr: up{job="kubernetes-pods"} == 0
            for: 1m
            labels:
              severity: critical
              service: kubernetes
            annotations:
              summary: "Service is down"
              description: "Service {{ $labels.pod }} in namespace {{ $labels.namespace }} is down"
      
      - name: database_alerts
        interval: 30s
        rules:
          - alert: HighDatabaseConnections
            expr: pg_stat_database_numbackends{datname="tripo04os"} > 80
            for: 5m
            labels:
              severity: warning
              service: database
            annotations:
              summary: "High database connections"
              description: "Database has {{ $value }} connections"
          
          - alert: SlowDatabaseQueries
            expr: pg_stat_statements_mean_query_time{datname="tripo04os"} > 0.1
            for: 5m
            labels:
              severity: warning
              service: database
            annotations:
              summary: "Slow database queries"
              description: "Average query time is {{ $value }}s"
      
      - name: resource_alerts
        interval: 30s
        rules:
          - alert: HighMemoryUsage
            expr: |
              (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.8
            for: 5m
            labels:
              severity: warning
              service: kubernetes
            annotations:
              summary: "High memory usage"
              description: "Container {{ $labels.container }} is using {{ $value | humanizePercentage }} of memory"
          
          - alert: HighCPUUsage
            expr: |
              (rate(container_cpu_usage_seconds_total[5m]) / container_spec_cpu_quota) > 0.8
            for: 5m
            labels:
              severity: warning
              service: kubernetes
            annotations:
              summary: "High CPU usage"
              description: "Container {{ $labels.container }} is using {{ $value | humanizePercentage }} of CPU"
```

### 5.3 Deploy Alertmanager

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: monitoring
  labels:
    app: alertmanager
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      labels:
        app: alertmanager
    spec:
      containers:
      - name: alertmanager
        image: prom/alertmanager:v0.25.0
        args:
          - '--config.file=/etc/alertmanager/alertmanager.yml'
          - '--storage.path=/alertmanager'
        ports:
        - containerPort: 9093
          name: http
        volumeMounts:
        - name: alertmanager-config
          mountPath: /etc/alertmanager
        - name: alertmanager-storage
          mountPath: /alertmanager
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"
      volumes:
      - name: alertmanager-config
        configMap:
          name: alertmanager-config
      - name: alertmanager-storage
        emptyDir: {}
```

### 5.4 Create Alertmanager Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: monitoring
  labels:
    app: alertmanager
spec:
  type: ClusterIP
  ports:
  - port: 9093
    targetPort: 9093
    protocol: TCP
    name: http
  selector:
    app: alertmanager
```

### 5.5 Deploy Alertmanager

```bash
# Apply ConfigMaps
kubectl apply -f alertmanager-config.yaml
kubectl apply -f prometheus-alerts.yaml

# Create Slack webhook secrets
kubectl create secret generic slack-secrets \
  --from-literal=webhook-url=$SLACK_WEBHOOK_URL \
  --from-literal=critical-webhook-url=$SLACK_CRITICAL_WEBHOOK_URL \
  --from-literal=warning-webhook-url=$SLACK_WARNING_WEBHOOK_URL \
  -n monitoring

# Apply Deployment
kubectl apply -f alertmanager-deployment.yaml

# Apply Service
kubectl apply -f alertmanager-service.yaml

# Verify deployment
kubectl get pods -n monitoring -l app=alertmanager

# Check logs
kubectl logs -n monitoring -l app=alertmanager -f
```

---

## 6. Dashboard Configuration

### 6.1 Import Dashboards

```bash
# Get Grafana admin password
GRAFANA_PASSWORD=$(kubectl get secret grafana-secrets -n monitoring -o jsonpath='{.data.admin-password}' | base64 -d)

# Get Grafana URL
GRAFANA_URL=$(kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Login to Grafana API
GRAFANA_API_KEY=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"api_key","role":"Admin"}' \
  "http://$GRAFANA_URL/api/auth/keys" \
  -u admin:$GRAFANA_PASSWORD | jq -r '.key')

# Import dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -d @tripo04os-overview.json \
  "http://$GRAFANA_URL/api/dashboards/db"
```

### 6.2 Create Dashboard Templates

#### API Overview Dashboard

```json
{
  "dashboard": {
    "title": "API Overview",
    "tags": ["api", "tripo04os"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Total Requests",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) * 60",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": { "x": 0, "y": 0 }
      },
      {
        "title": "Error Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": { "x": 6, "y": 0 },
        "options": {
          "max": 10,
          "min": 0,
          "thresholds": [5, 8],
          "unit": "percent"
        }
      },
      {
        "title": "Response Time (P95)",
        "type": "gauge",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "{{le}}"
          }
        ],
        "gridPos": { "x": 12, "y": 0 },
        "options": {
          "max": 1,
          "min": 0,
          "thresholds": [0.3, 0.5],
          "unit": "s"
        }
      }
    ],
    "refresh": "15s"
  }
}
```

#### Database Overview Dashboard

```json
{
  "dashboard": {
    "title": "Database Overview",
    "tags": ["database", "tripo04os"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Active Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"tripo04os\"}",
            "legendFormat": "{{datname}}"
          }
        ],
        "gridPos": { "x": 0, "y": 0 }
      },
      {
        "title": "Query Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_statements_mean_query_time{datname=\"tripo04os\"}",
            "legendFormat": "{{datname}}"
          }
        ],
        "gridPos": { "x": 6, "y": 0 }
      },
      {
        "title": "Transactions per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(pg_stat_database_xact_commit[5m])",
            "legendFormat": "{{datname}}"
          }
        ],
        "gridPos": { "x": 12, "y": 0 }
      }
    ],
    "refresh": "15s"
  }
}
```

### 6.3 Configure Alert Notifications

```bash
# Configure Slack webhook for alerts
kubectl create configmap slack-config \
  --from-literal=webhook-url=$SLACK_WEBHOOK_URL \
  --from-literal=channel=#alerts \
  --from-literal=username=Tripo04OS \
  --from-literal=icon=:rotating_light: \
  -n monitoring

# Configure email notifications
kubectl create configmap email-config \
  --from-literal=to=alerts@tripo04os.com \
  --from-literal=from=monitoring@tripo04os.com \
  --from-literal=subject="[ALERT] Tripo04OS Alert" \
  -n monitoring

# Configure PagerDuty for critical alerts
kubectl create configmap pagerduty-config \
  --from-literal=service-key=$PAGERDUTY_SERVICE_KEY \
  --from-literal=severity=critical \
  -n monitoring
```

---

## 7. Monitoring Targets

### 7.1 Service Discovery

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-support-metrics
  namespace: tripo04os-production
  labels:
    app: ai-support
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8000"
    prometheus.io/path: "/metrics"
spec:
  selector:
    app: ai-support
  ports:
  - port: 8000
    name: metrics
```

### 7.2 Custom Metrics Exporters

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: custom-metrics-exporter
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: custom-metrics-exporter
  template:
    metadata:
      labels:
        app: custom-metrics-exporter
    spec:
      containers:
      - name: exporter
        image: prom/blackbox-exporter:latest
        ports:
        - containerPort: 9115
        args:
          - '--config.file=/etc/blackbox_exporter/config.yml'
        volumeMounts:
        - name: config
          mountPath: /etc/blackbox_exporter
      volumes:
      - name: config
        configMap:
          name: blackbox-config
```

### 7.3 Configure Monitoring for All Services

```bash
# Add Prometheus annotations to all services
kubectl annotate service ai-support-service \
  prometheus.io/scrape="true" \
  prometheus.io/port="8000" \
  prometheus.io/path="/metrics" \
  -n tripo04os-production

kubectl annotate service premium-driver-matching-service \
  prometheus.io/scrape="true" \
  prometheus.io/port="8001" \
  prometheus.io/path="/metrics" \
  -n tripo04os-production

kubectl annotate service profit-optimization-engine \
  prometheus.io/scrape="true" \
  prometheus.io/port="8002" \
  prometheus.io/path="/metrics" \
  -n tripo04os-production

kubectl annotate service dashboard-api \
  prometheus.io/scrape="true" \
  prometheus.io/port="8003" \
  prometheus.io/path="/metrics" \
  -n tripo04os-production

# Verify annotations
kubectl get svc -n tripo04os-production -o custom-columns=NAME:.metadata.name,ANNOTATIONS:.metadata.annotations
```

---

## 8. Validation

### 8.1 Verify Prometheus Deployment

```bash
# Check Prometheus pods
kubectl get pods -n monitoring -l app=prometheus

# Check Prometheus service
kubectl get svc prometheus -n monitoring

# Test Prometheus endpoint
kubectl port-forward svc/prometheus 9090:9090 -n monitoring &
curl http://localhost:9090/-/healthy

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Prometheus configuration
curl http://localhost:9090/api/v1/status/config
```

### 8.2 Verify Grafana Deployment

```bash
# Check Grafana pods
kubectl get pods -n monitoring -l app=grafana

# Check Grafana service
kubectl get svc grafana -n monitoring

# Get Grafana URL
kubectl get svc grafana -n monitoring

# Test Grafana endpoint
kubectl port-forward svc/grafana 3000:3000 -n monitoring &
curl http://localhost:3000/api/health

# Login to Grafana
GRAFANA_URL=$(kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
GRAFANA_PASSWORD=$(kubectl get secret grafana-secrets -n monitoring -o jsonpath='{.data.admin-password}' | base64 -d)
echo "Grafana URL: http://$GRAFANA_URL"
echo "Admin Password: $GRAFANA_PASSWORD"
```

### 8.3 Verify Alertmanager Deployment

```bash
# Check Alertmanager pods
kubectl get pods -n monitoring -l app=alertmanager

# Check Alertmanager service
kubectl get svc alertmanager -n monitoring

# Test Alertmanager endpoint
kubectl port-forward svc/alertmanager 9093:9093 -n monitoring &
curl http://localhost:9093/-/healthy

# Check Alertmanager status
curl http://localhost:9093/api/v1/status
```

### 8.4 Verify Metrics Collection

```bash
# Check Prometheus targets
kubectl exec -n monitoring deployment/prometheus -- curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health=="up") | length'

# Check metrics are being collected
kubectl exec -n monitoring deployment/prometheus -- curl -s http://localhost:9090/api/v1/label/__name__/values | jq '.data[]'

# Verify service metrics
for service in ai-support premium-driver-matching profit-optimization-engine dashboard-api; do
  kubectl exec -n monitoring deployment/prometheus -- \
    curl -s "http://localhost:9090/api/v1/query?query=up{job=\"kubernetes-pods\",pod=~\"$service.*\"}" | jq '.data.result[0].value[1]'
done
```

### 8.5 Verify Alerting

```bash
# Check Alertmanager alerts
kubectl exec -n monitoring deployment/alertmanager -- \
  curl -s http://localhost:9093/api/v1/alerts | jq '.data'

# Check Prometheus alerts
kubectl exec -n monitoring deployment/prometheus -- \
  curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | {alertname, state, severity}'

# Test alert firing
kubectl exec -n monitoring deployment/prometheus -- \
  curl -s -X POST http://localhost:9090/api/v1/alerts -d '[]' | jq '.'

# Verify Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test alert from Tripo04OS monitoring"}'
```

---

## Appendix A: Monitoring Best Practices

### 1. Alert Fatigue Prevention

- Set appropriate alert thresholds to avoid false positives
- Use alert grouping to reduce notification noise
- Implement alert suppression during maintenance windows
- Configure appropriate repeat intervals

### 2. Dashboard Design

- Use clear, descriptive titles for panels
- Group related metrics together
- Use appropriate visualization types for each metric
- Set appropriate refresh intervals (15-30s)
- Include context and annotations for alerts

### 3. Metrics Collection

- Scrape at appropriate intervals (15-30s)
- Use appropriate retention periods (15-30 days)
- Implement metric filtering to reduce cardinality
- Use recording rules for complex queries

### 4. Performance Optimization

- Configure appropriate resource limits for Prometheus
- Use Prometheus remote_write for long-term storage
- Implement metric downsampling for historical data
- Use Prometheus federation for multi-cluster monitoring

---

## Appendix B: Troubleshooting

### Common Issues

#### Issue: Prometheus not collecting metrics

**Solution**: Check service annotations and network policies
```bash
# Check service annotations
kubectl get svc -n tripo04os-production -o custom-columns=NAME:.metadata.name,ANNOTATIONS:.metadata.annotations

# Check network policies
kubectl get networkpolicies -n tripo04os-production

# Check Prometheus logs
kubectl logs -n monitoring -l app=prometheus -f
```

#### Issue: Grafana not connecting to Prometheus

**Solution**: Verify datasource configuration
```bash
# Check Grafana datasource
kubectl exec -n monitoring deployment/grafana -- \
  cat /etc/grafana/provisioning/datasources/datasources.yaml

# Test Prometheus connectivity
kubectl exec -n monitoring deployment/grafana -- \
  curl -s http://prometheus.monitoring.svc.cluster.local:9090/api/v1/status/config

# Check Grafana logs
kubectl logs -n monitoring -l app=grafana -f
```

#### Issue: Alerts not firing

**Solution**: Check alert rules and Alertmanager configuration
```bash
# Check Prometheus alert rules
kubectl exec -n monitoring deployment/prometheus -- \
  cat /etc/prometheus/rules/alerts.yml

# Check Alertmanager configuration
kubectl exec -n monitoring deployment/alertmanager -- \
  cat /etc/alertmanager/alertmanager.yml

# Check Prometheus alerts
kubectl exec -n monitoring deployment/prometheus -- \
  curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")'
```

---

**Document End**
