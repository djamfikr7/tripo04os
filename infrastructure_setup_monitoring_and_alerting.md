# Monitoring and Alerting Setup Guide

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Monitoring and Alerting Setup Guide |
| **Version** | 1.0 |
| **Date** | 2026-01-09 |
| **Status** | Draft |
| **Author** | Kilo Code |
| **Project** | Tripo04OS Phase 1 Implementation |

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Prometheus Setup](#prometheus-setup)
5. [Grafana Setup](#grafana-setup)
6. [Alertmanager Setup](#alertmanager-setup)
7. [Custom Metrics](#custom-metrics)
8. [Alerting Rules](#alerting-rules)
9. [Dashboards](#dashboards)
10. [Notification Channels](#notification-channels)
11. [Troubleshooting](#troubleshooting)

---

## 1. Overview

### 1.1 Purpose

This guide provides comprehensive instructions for setting up monitoring and alerting for the Tripo04OS platform, including:

- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Alertmanager** - Alert routing and notifications
- **Custom metrics** - Application-specific metrics
- **Alerting rules** - Threshold-based alerting
- **Notification channels** - Email, Slack, PagerDuty integration

### 1.2 Monitoring Stack Components

```
Applications → Prometheus → Alertmanager → Notifications
                   ↓
              Grafana Dashboards
                   ↓
              Visualization & Alerts
```

### 1.3 Key Metrics

| Category | Metrics | Purpose |
|----------|---------|---------|
| **Application** | Request rate, latency, error rate | Service health and performance |
| **Infrastructure** | CPU, memory, disk, network | Resource utilization |
| **Business** | Orders per minute, active trips, driver count | Business operations |
| **Security** | Failed auth attempts, rate limit violations | Security incidents |

---

## 2. Architecture

### 2.1 Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Services   │  │  Prometheus  │  │   Grafana    │  │
│  │  (exporters) │──│   (metrics)  │──│ (dashboards) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                   │                   │        │
│         └───────────────────┼───────────────────┘        │
│                             ↓                             │
│                    ┌──────────────┐                      │
│                    │Alertmanager  │                      │
│                    │ (alerting)   │                      │
│                    └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
                ┌──────────────────────────┐
                │   Notification Channels   │
                │  Email | Slack | PagerDuty │
                └──────────────────────────┘
```

### 2.2 Metrics Flow

1. **Applications expose metrics** via `/metrics` endpoint (Prometheus format)
2. **Prometheus scrapes metrics** from all services on regular intervals
3. **Prometheus evaluates alerting rules** and fires alerts to Alertmanager
4. **Alertmanager routes alerts** to appropriate notification channels
5. **Grafana queries Prometheus** for dashboard visualization

---

## 3. Prerequisites

### 3.1 Required Tools

```bash
# Install Helm (if not already installed)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installation
helm version
kubectl version
```

### 3.2 Namespace Setup

```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Label namespace
kubectl label namespace monitoring name=monitoring
```

### 3.3 Helm Repository

```bash
# Add Prometheus community Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Update Helm repos
helm repo update
```

---

## 4. Prometheus Setup

### 4.1 Install Prometheus

**File:** `infrastructure/kubernetes/prometheus-values.yaml`

```yaml
# Prometheus Helm values
server:
  image:
    repository: prom/prometheus
    tag: v2.45.0
    pullPolicy: IfNotPresent

  retention: 15d
  persistentVolume:
    size: 50Gi
    storageClass: gp3

  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2
      memory: 4Gi

  service:
    port: 9090

  serviceMonitor:
    enabled: true

  global:
    scrape_interval: 15s
    evaluation_interval: 15s

  extraScrapeConfigs: |
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
        - role: pod
      relabel_configs:
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
          target_label: __address__

    - job_name: 'tripo04os-services'
      kubernetes_sd_configs:
        - role: pod
          namespaces:
            names:
              - tripo04os-staging
              - tripo04os-production
      relabel_configs:
        - source_labels: [__meta_kubernetes_pod_label_app]
          action: keep
          regex: (identity-service|order-service|trip-service|matching-service|pricing-service|location-service)
        - source_labels: [__address__]
          target_label: __address__
          replacement: $1:9090
```

**Install Prometheus:**

```bash
# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --values infrastructure/kubernetes/prometheus-values.yaml \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Verify installation
kubectl get pods -n monitoring -l app.kubernetes.io/name=prometheus

# Check Prometheus logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus
```

### 4.2 Prometheus Configuration

**File:** `infrastructure/kubernetes/prometheus-configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-server-conf
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: 'tripo04os-production'
        environment: 'production'

    rule_files:
      - '/etc/prometheus/rules/*.yml'

    alerting:
      alertmanagers:
        - static_configs:
            - targets:
                - alertmanager:9093

    scrape_configs:
      # Kubernetes API server
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
          - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
            action: keep
            regex: default;kubernetes;https

      # Kubernetes Nodes
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)

      # Kubernetes Pods
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)

      # Tripo04OS Services
      - job_name: 'tripo04os-identity-service'
        static_configs:
          - targets: ['identity-service:9090']
            labels:
              service: 'identity-service'
              app: 'tripo04os'

      - job_name: 'tripo04os-order-service'
        static_configs:
          - targets: ['order-service:9090']
            labels:
              service: 'order-service'
              app: 'tripo04os'

      - job_name: 'tripo04os-trip-service'
        static_configs:
          - targets: ['trip-service:9090']
            labels:
              service: 'trip-service'
              app: 'tripo04os'

      - job_name: 'tripo04os-matching-service'
        static_configs:
          - targets: ['matching-service:9090']
            labels:
              service: 'matching-service'
              app: 'tripo04os'

      - job_name: 'tripo04os-pricing-service'
        static_configs:
          - targets: ['pricing-service:9090']
            labels:
              service: 'pricing-service'
              app: 'tripo04os'

      - job_name: 'tripo04os-location-service'
        static_configs:
          - targets: ['location-service:9090']
            labels:
              service: 'location-service'
              app: 'tripo04os'
```

**Apply Prometheus configuration:**

```bash
# Apply ConfigMap
kubectl apply -f infrastructure/kubernetes/prometheus-configmap.yaml

# Restart Prometheus to apply config
kubectl rollout restart deployment/prometheus-kube-prometheus-prometheus -n monitoring

# Verify configuration
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Open Prometheus UI
open http://localhost:9090
```

### 4.3 Verify Prometheus

```bash
# Check Prometheus status
kubectl get pods -n monitoring -l app.kubernetes.io/name=prometheus

# View Prometheus logs
kubectl logs -f -n monitoring deployment/prometheus-kube-prometheus-prometheus

# Port-forward to access Prometheus UI
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Check targets in Prometheus
# Open http://localhost:9090/targets
```

---

## 5. Grafana Setup

### 5.1 Install Grafana

**File:** `infrastructure/kubernetes/grafana-values.yaml`

```yaml
grafana:
  image:
    repository: grafana/grafana
    tag: 10.1.0
    pullPolicy: IfNotPresent

  persistence:
    enabled: true
    size: 10Gi
    storageClass: gp3

  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

  service:
    port: 80
    type: LoadBalancer

  adminPassword: admin123

  datasources:
    datasources.yaml:
      apiVersion: 1
      datasources:
        - name: Prometheus
          type: prometheus
          url: http://prometheus-kube-prometheus-prometheus:9090
          access: proxy
          isDefault: true
          editable: true

  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
        - name: 'default'
          orgId: 1
          folder: ''
          type: file
          disableDeletion: false
          editable: true
          options:
            path: /var/lib/grafana/dashboards/default

  dashboards:
    default:
      # Kubernetes dashboards
      k8s-cluster-rsrc-use:
        gnetId: 7249
        revision: 1
        datasource: Prometheus
      k8s-views-global:
        gnetId: 7249
        revision: 1
        datasource: Prometheus
      k8s-views-namespaces:
        gnetId: 7249
        revision: 1
        datasource: Prometheus
      k8s-views-pods:
        gnetId: 7249
        revision: 1
        datasource: Prometheus

      # Tripo04OS custom dashboards
      tripo04os-overview:
        url: https://raw.githubusercontent.com/grafana/grafana/main/public/app/plugins/datasource/prometheus/dashboards/overview.json
```

**Install Grafana:**

```bash
# Install Grafana
helm install grafana prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --set grafana.enabled=true \
    --values infrastructure/kubernetes/grafana-values.yaml

# Verify installation
kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana

# Get Grafana password
kubectl get secret -n monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

### 5.2 Access Grafana

```bash
# Port-forward to access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open Grafana UI
open http://localhost:3000

# Login with:
# Username: admin
# Password: admin123 (or use the secret value)
```

### 5.3 Import Tripo04OS Dashboards

**File:** `infrastructure/kubernetes/grafana-dashboards/overview.json`

```json
{
  "dashboard": {
    "title": "Tripo04OS Overview",
    "uid": "tripo04os-overview",
    "tags": ["tripo04os", "overview"],
    "timezone": "browser",
    "schemaVersion": 16,
    "version": 0,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Requests Per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[1m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[1m])) by (service) / sum(rate(http_requests_total[1m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le, service))",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Active Orders",
        "type": "stat",
        "targets": [
          {
            "expr": "active_orders_total",
            "legendFormat": "Active Orders"
          }
        ],
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 8}
      },
      {
        "id": 5,
        "title": "Active Drivers",
        "type": "stat",
        "targets": [
          {
            "expr": "active_drivers_total",
            "legendFormat": "Active Drivers"
          }
        ],
        "gridPos": {"h": 4, "w": 6, "x": 18, "y": 8}
      }
    ]
  }
}
```

**Import dashboard via CLI:**

```bash
# Import dashboard
kubectl create configmap grafana-dashboard-overview \
    --from-file=infrastructure/kubernetes/grafana-dashboards/overview.json \
    --namespace=monitoring

# Label configmap
kubectl label configmap grafana-dashboard-overview \
    grafana_dashboard=1 \
    --namespace=monitoring
```

---

## 6. Alertmanager Setup

### 6.1 Install Alertmanager

**File:** `infrastructure/kubernetes/alertmanager-configmap.yaml`

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

    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'default'

      routes:
        - match:
            severity: critical
          receiver: 'pagerduty'

        - match:
            severity: warning
          receiver: 'slack'

        - match:
            severity: info
          receiver: 'email'

    receivers:
      - name: 'default'
        slack_configs:
          - send_resolved: true
            api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
            channel: '#tripo04os-alerts'
            title: 'Tripo04OS Alert: {{ .GroupLabels.alertname }}'
            text: |
              {{ range .Alerts }}
              Alert: {{ .Labels.alertname }}
              Severity: {{ .Labels.severity }}
              Description: {{ .Annotations.description }}
              {{ end }}

      - name: 'pagerduty'
        pagerduty_configs:
          - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
            description: '{{ .GroupLabels.alertname }}'

      - name: 'slack'
        slack_configs:
          - send_resolved: true
            api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
            channel: '#tripo04os-alerts'
            title: 'Tripo04OS Alert: {{ .GroupLabels.alertname }}'
            text: |
              {{ range .Alerts }}
              Alert: {{ .Labels.alertname }}
              Severity: {{ .Labels.severity }}
              Description: {{ .Annotations.description }}
              {{ end }}

      - name: 'email'
        email_configs:
          - to: 'alerts@tripo04os.com'
            from: 'alertmanager@tripo04os.com'
            smarthost: 'smtp.gmail.com:587'
            auth_username: 'alertmanager@tripo04os.com'
            auth_password: 'YOUR_PASSWORD'
            headers:
              Subject: 'Tripo04OS Alert: {{ .GroupLabels.alertname }}'
```

**Apply Alertmanager configuration:**

```bash
# Apply ConfigMap
kubectl apply -f infrastructure/kubernetes/alertmanager-configmap.yaml

# Restart Alertmanager to apply config
kubectl rollout restart deployment/prometheus-kube-prometheus-alertmanager -n monitoring

# Verify Alertmanager
kubectl get pods -n monitoring -l app.kubernetes.io/name=alertmanager
```

### 6.2 Access Alertmanager

```bash
# Port-forward to access Alertmanager
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093

# Open Alertmanager UI
open http://localhost:9093
```

---

## 7. Custom Metrics

### 7.1 Application Metrics

Add metrics to your Go services:

```go
package main

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "github.com/gin-gonic/gin"
)

var (
    // HTTP Request metrics
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "path", "status"},
    )

    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path"},
    )

    // Business metrics
    activeOrdersTotal = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "active_orders_total",
            Help: "Current number of active orders",
        },
    )

    activeDriversTotal = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "active_drivers_total",
            Help: "Current number of active drivers",
        },
    )
)

func init() {
    // Register metrics
    prometheus.MustRegister(httpRequestsTotal)
    prometheus.MustRegister(httpRequestDuration)
    prometheus.MustRegister(activeOrdersTotal)
    prometheus.MustRegister(activeDriversTotal)
}

func metricsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        c.Next()

        duration := time.Since(start).Seconds()

        httpRequestsTotal.WithLabelValues(
            c.Request.Method,
            c.FullPath(),
            strconv.Itoa(c.Writer.Status()),
        ).Inc()

        httpRequestDuration.WithLabelValues(
            c.Request.Method,
            c.FullPath(),
        ).Observe(duration)
    }
}

func main() {
    r := gin.Default()

    // Add metrics middleware
    r.Use(metricsMiddleware())

    // Metrics endpoint
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))

    // API endpoints
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })

    // Run server
    r.Run(":9090")
}
```

### 7.2 Node Exporter

Install Node Exporter for system metrics:

```bash
# Add Node Exporter to all nodes
kubectl apply -f infrastructure/kubernetes/node-exporter-daemonset.yaml
```

**File:** `infrastructure/kubernetes/node-exporter-daemonset.yaml`

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true
      hostPID: true
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.6.0
          args:
            - '--path.procfs=/host/proc'
            - '--path.sysfs=/host/sys'
            - '--path.rootfs=/host/root'
            - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($|/)'
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: sys
              mountPath: /host/sys
              readOnly: true
            - name: root
              mountPath: /host/root
              readOnly: true
          ports:
            - containerPort: 9100
              hostPort: 9100
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: sys
          hostPath:
            path: /sys
        - name: root
          hostPath:
            path: /
```

---

## 8. Alerting Rules

### 8.1 Alerting Rules ConfigMap

**File:** `infrastructure/kubernetes/alerting-rules.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  alerting-rules.yml: |
    groups:
      - name: application.alerts
        rules:
          # High error rate
          - alert: HighErrorRate
            expr: |
              sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
              /
              sum(rate(http_requests_total[5m])) by (service) > 0.05
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "High error rate detected"
              description: "{{ $labels.service }} error rate is {{ $value | humanizePercentage }}"

          # High latency
          - alert: HighLatency
            expr: |
              histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) > 1
            for: 10m
            labels:
              severity: warning
            annotations:
              summary: "High latency detected"
              description: "{{ $labels.service }} P95 latency is {{ $value }}s"

          # Service down
          - alert: ServiceDown
            expr: up{job=~"tripo04os-.*"} == 0
            for: 2m
            labels:
              severity: critical
            annotations:
              summary: "Service is down"
              description: "{{ $labels.job }} has been down for more than 2 minutes"

      - name: infrastructure.alerts
        rules:
          # High CPU usage
          - alert: HighCPUUsage
            expr: |
              100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
            for: 10m
            labels:
              severity: warning
            annotations:
              summary: "High CPU usage"
              description: "Instance {{ $labels.instance }} CPU usage is {{ $value }}%"

          # High memory usage
          - alert: HighMemoryUsage
            expr: |
              (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
            for: 10m
            labels:
              severity: warning
            annotations:
              summary: "High memory usage"
              description: "Instance {{ $labels.instance }} memory usage is {{ $value }}%"

          # Disk space low
          - alert: DiskSpaceLow
            expr: |
              (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes) * 100 < 15
            for: 10m
            labels:
              severity: warning
            annotations:
              summary: "Disk space low"
              description: "Instance {{ $labels.instance }} mount point {{ $labels.mountpoint }} has {{ $value }}% free space"

          # Pod crash looping
          - alert: PodCrashLooping
            expr: |
              increase(kube_pod_container_status_restarts_total[1h]) > 0
            for: 15m
            labels:
              severity: critical
            annotations:
              summary: "Pod is crash looping"
              description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has restarted {{ $value }} times in the last hour"

      - name: business.alerts
        rules:
          # No active drivers
          - alert: NoActiveDrivers
            expr: active_drivers_total == 0
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "No active drivers available"
              description: "No drivers are currently active in the system"

          # High cancellation rate
          - alert: HighCancellationRate
            expr: |
              sum(rate(order_cancellations_total[10m]))
              /
              sum(rate(order_created_total[10m])) > 0.2
            for: 10m
            labels:
              severity: warning
            annotations:
              summary: "High cancellation rate"
              description: "Cancellation rate is {{ $value | humanizePercentage }}"
```

**Apply alerting rules:**

```bash
# Apply ConfigMap
kubectl apply -f infrastructure/kubernetes/alerting-rules.yaml

# Reload Prometheus configuration
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app.kubernetes.io/name=prometheus -o jsonpath='{.items[0].metadata.name}') \
    -- kill -HUP 1

# Verify rules
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app.kubernetes.io/name=prometheus -o jsonpath='{.items[0].metadata.name}') \
    -- promtool check rules /etc/prometheus/rules/*.yml
```

---

## 9. Dashboards

### 9.1 Pre-built Dashboards

Import these dashboards from Grafana.com:

| Dashboard ID | Name | Purpose |
|--------------|------|---------|
| 7249 | Kubernetes Cluster Resources | Cluster resource monitoring |
| 315 | Kubernetes Pod Monitoring | Pod-level metrics |
| 7322 | Kubernetes Nodes | Node-level metrics |
| 747 | Prometheus Overview | Prometheus metrics |

### 9.2 Create Tripo04OS Dashboard

Create a comprehensive dashboard for Tripo04OS:

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open in browser
open http://localhost:3000

# Navigate to Dashboards → Import
# Paste dashboard JSON or import from URL
```

### 9.3 Dashboard Panels

Essential panels for Tripo04OS dashboard:

1. **Request Rate** - `sum(rate(http_requests_total[1m])) by (service)`
2. **Error Rate** - `sum(rate(http_requests_total{status=~"5.."}[1m])) by (service)`
3. **P95 Latency** - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le, service))`
4. **Active Orders** - `active_orders_total`
5. **Active Drivers** - `active_drivers_total`
6. **CPU Usage** - `100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
7. **Memory Usage** - `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
8. **Disk Usage** - `(node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100`

---

## 10. Notification Channels

### 10.1 Slack Integration

1. Create Slack webhook:
   - Go to https://api.slack.com/apps
   - Create new app → Incoming Webhooks
   - Copy webhook URL

2. Update Alertmanager ConfigMap:
   ```yaml
   slack_configs:
     - send_resolved: true
       api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
       channel: '#tripo04os-alerts'
   ```

3. Apply changes:
   ```bash
   kubectl apply -f infrastructure/kubernetes/alertmanager-configmap.yaml
   kubectl rollout restart deployment/prometheus-kube-prometheus-alertmanager -n monitoring
   ```

### 10.2 Email Integration

1. Update Alertmanager ConfigMap:
   ```yaml
   email_configs:
     - to: 'alerts@tripo04os.com'
       from: 'alertmanager@tripo04os.com'
       smarthost: 'smtp.gmail.com:587'
       auth_username: 'alertmanager@tripo04os.com'
       auth_password: 'YOUR_PASSWORD'
   ```

2. Apply changes and restart Alertmanager

### 10.3 PagerDuty Integration

1. Get PagerDuty service key:
   - Go to PagerDuty → Service → Integrations
   - Create new Prometheus integration
   - Copy service key

2. Update Alertmanager ConfigMap:
   ```yaml
   pagerduty_configs:
     - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
       description: '{{ .GroupLabels.alertname }}'
   ```

3. Apply changes and restart Alertmanager

---

## 11. Troubleshooting

### 11.1 Common Issues

**Prometheus not scraping metrics**

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open http://localhost:9090/targets

# Check service labels
kubectl get svc -n tripo04os-production --show-labels

# Verify metrics endpoint
kubectl exec -n tripo04os-production <pod-name> -- curl http://localhost:9090/metrics
```

**Alertmanager not sending alerts**

```bash
# Check Alertmanager status
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
# Open http://localhost:9093/#/status

# Check Alertmanager logs
kubectl logs -f -n monitoring deployment/prometheus-kube-prometheus-alertmanager

# Verify alert rules
kubectl exec -n monitoring <prometheus-pod> -- promtool check rules /etc/prometheus/rules/*.yml
```

**Grafana dashboards not showing data**

```bash
# Verify datasource connection
# Go to Grafana → Configuration → Data Sources → Prometheus → Test

# Check Prometheus queries
kubectl exec -n monitoring <prometheus-pod> -- promql 'up'

# Check time range in Grafana dashboard
# Ensure time range matches data availability
```

### 11.2 Debug Commands

```bash
# Check all monitoring components
kubectl get all -n monitoring

# View Prometheus logs
kubectl logs -f -n monitoring deployment/prometheus-kube-prometheus-prometheus

# View Alertmanager logs
kubectl logs -f -n monitoring deployment/prometheus-kube-prometheus-alertmanager

# View Grafana logs
kubectl logs -f -n monitoring deployment/prometheus-grafana

# Check metrics from a service
kubectl exec -n tripo04os-production <pod-name> -- curl http://localhost:9090/metrics

# Query Prometheus metrics
kubectl exec -n monitoring <prometheus-pod> -- promql 'sum(rate(http_requests_total[1m])) by (service)'
```

---

## Appendix A: Quick Reference

### Setup Commands

```bash
# 1. Install monitoring stack
helm install prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# 2. Access Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# 3. Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# 4. Access Alertmanager
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093

# 5. Get Grafana password
kubectl get secret -n monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

### Verify Monitoring

```bash
# Check all monitoring pods
kubectl get pods -n monitoring

# Verify Prometheus is scraping
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open http://localhost:9090/targets

# Check alert rules
kubectl exec -n monitoring <prometheus-pod> -- promtool check rules /etc/prometheus/rules/*.yml

# Check active alerts
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
# Open http://localhost:9093/#/alerts
```

---

## Appendix B: Best Practices

### Monitoring Best Practices

1. **Set meaningful alert thresholds**
   - Avoid alert fatigue by setting appropriate thresholds
   - Use severity levels (info, warning, critical)

2. **Create actionable alerts**
   - Each alert should have a clear action plan
   - Include runbooks for common alerts

3. **Use labels effectively**
   - Label metrics with service, environment, instance
   - Use consistent naming conventions

4. **Regular review and maintenance**
   - Review dashboards monthly
   - Update alert rules quarterly
   - Clean up unused metrics

5. **Document everything**
   - Document alert thresholds and responses
   - Create runbooks for common issues
   - Maintain dashboard documentation

---

**Document End**
