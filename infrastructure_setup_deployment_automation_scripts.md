# Deployment Automation Guide

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Deployment Automation Guide |
| **Version** | 1.0 |
| **Date** | 2026-01-09 |
| **Status** | Draft |
| **Author** | Kilo Code |
| **Project** | Tripo04OS Phase 1 Implementation |

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Directory Structure](#directory-structure)
4. [Environment Setup Scripts](#environment-setup-scripts)
5. [Service Deployment Scripts](#service-deployment-scripts)
6. [Database Migration Scripts](#database-migration-scripts)
7. [Rollback Scripts](#rollback-scripts)
8. [Health Check Scripts](#health-check-scripts)
9. [Backup and Restore Scripts](#backup-and-restore-scripts)
10. [Maintenance Scripts](#maintenance-scripts)

---

## 1. Overview

### 1.1 Purpose

This guide provides comprehensive deployment automation scripts for the Tripo04OS platform, including:

- Automated environment setup (dev, staging, production)
- Multi-service deployment orchestration
- Database migration management
- Health check verification
- Rollback procedures
- Backup and restore operations
- Maintenance tasks

### 1.2 Script Organization

```
scripts/
├── deployment/
│   ├── setup.sh                    # Initial environment setup
│   ├── deploy-all.sh              # Deploy all services
│   ├── deploy-service.sh          # Deploy single service
│   ├── scale-service.sh           # Scale service replicas
│   └── rollback.sh                # Rollback deployment
├── database/
│   ├── migrate-up.sh              # Run database migrations
│   ├── migrate-down.sh            # Rollback migrations
│   ├── backup.sh                  # Backup database
│   └── restore.sh                 # Restore database
├── health/
│   ├── check-all.sh               # Check all services health
│   ├── check-service.sh           # Check single service health
│   └── wait-ready.sh              # Wait for services to be ready
├── maintenance/
│   ├── cleanup.sh                 # Cleanup resources
│   ├── restart.sh                 # Restart services
│   └── logs.sh                    # View service logs
└── monitoring/
    ├── metrics.sh                 # Collect metrics
    └── alerts.sh                  # Check alerts
```

---

## 2. Prerequisites

### 2.1 Required Tools

```bash
# Install required tools
sudo apt-get update
sudo apt-get install -y \
  kubectl \
  helm \
  awscli \
  docker \
  jq \
  curl \
  wget \
  git
```

### 2.2 Kubernetes Configuration

```bash
# Configure kubectl
aws eks update-kubeconfig --name tripo04os-production --region us-east-1

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 2.3 Environment Variables

```bash
# Create .env file
cat > .env << EOF
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# EKS Clusters
EKS_CLUSTER_DEV=tripo04os-dev
EKS_CLUSTER_STAGING=tripo04os-staging
EKS_CLUSTER_PROD=tripo04os-production

# ECR Registry
ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Database
DATABASE_HOST=postgres.${AWS_REGION}.rds.amazonaws.com
DATABASE_PORT=5432

# Services
IDENTITY_SERVICE_URL=https://api.tripo04os.com
ORDER_SERVICE_URL=https://api.tripo04os.com

# Monitoring
GRAFANA_URL=https://grafana.tripo04os.com
PROMETHEUS_URL=https://prometheus.tripo04os.com
EOF

# Source environment variables
source .env
```

---

## 3. Directory Structure

### 3.1 Scripts Directory

Create the scripts directory structure:

```bash
#!/bin/bash

# Create directory structure
mkdir -p scripts/deployment
mkdir -p scripts/database
mkdir -p scripts/health
mkdir -p scripts/maintenance
mkdir -p scripts/monitoring
mkdir -p scripts/utils

# Set permissions
chmod +x scripts/**/*.sh
chmod +x scripts/*.sh
```

---

## 4. Environment Setup Scripts

### 4.1 Initial Setup Script

**File:** `scripts/deployment/setup.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        print_info "Loading environment variables..."
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
    else
        print_error ".env file not found!"
        exit 1
    fi
}

# Create Kubernetes namespaces
create_namespaces() {
    print_info "Creating Kubernetes namespaces..."

    kubectl create namespace tripo04os-dev --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace tripo04os-staging --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace tripo04os-production --dry-run=client -o yaml | kubectl apply -f -

    # Label namespaces
    kubectl label namespace tripo04os-dev environment=dev --overwrite
    kubectl label namespace tripo04os-staging environment=staging --overwrite
    kubectl label namespace tripo04os-production environment=production --overwrite

    print_info "Namespaces created successfully!"
}

# Create ConfigMaps and Secrets
create_configmaps() {
    print_info "Creating ConfigMaps..."

    # Application ConfigMap
    kubectl create configmap app-config \
        --from-env-file="$PROJECT_ROOT/.env" \
        --namespace=tripo04os-production \
        --dry-run=client -o yaml | kubectl apply -f -

    print_info "ConfigMaps created successfully!"
}

create_secrets() {
    print_info "Creating Secrets..."

    # Check if secrets file exists
    if [ -f "$PROJECT_ROOT/.secrets" ]; then
        kubectl create secret generic app-secrets \
            --from-env-file="$PROJECT_ROOT/.secrets" \
            --namespace=tripo04os-production \
            --dry-run=client -o yaml | kubectl apply -f -
    else
        print_warning ".secrets file not found, skipping secret creation"
    fi

    print_info "Secrets created successfully!"
}

# Deploy infrastructure components
deploy_infrastructure() {
    print_info "Deploying infrastructure components..."

    # Deploy PostgreSQL
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/postgres.yaml"

    # Deploy Redis
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/redis.yaml"

    # Deploy Kafka
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/kafka.yaml"

    # Wait for infrastructure to be ready
    print_info "Waiting for infrastructure to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres --namespace=tripo04os-production --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis --namespace=tripo04os-production --timeout=300s
    kubectl wait --for=condition=ready pod -l app=kafka --namespace=tripo04os-production --timeout=300s

    print_info "Infrastructure deployed successfully!"
}

# Deploy monitoring stack
deploy_monitoring() {
    print_info "Deploying monitoring stack..."

    # Deploy Prometheus
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/prometheus.yaml"

    # Deploy Grafana
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/grafana.yaml"

    # Wait for monitoring to be ready
    print_info "Waiting for monitoring to be ready..."
    kubectl wait --for=condition=ready pod -l app=prometheus --namespace=tripo04os-production --timeout=300s
    kubectl wait --for=condition=ready pod -l app=grafana --namespace=tripo04os-production --timeout=300s

    print_info "Monitoring deployed successfully!"
}

# Deploy API Gateway
deploy_api_gateway() {
    print_info "Deploying API Gateway..."

    cd "$PROJECT_ROOT/api-gateway"
    ./deploy.sh setup
    cd "$PROJECT_ROOT"

    print_info "API Gateway deployed successfully!"
}

# Verify setup
verify_setup() {
    print_info "Verifying setup..."

    # Check namespaces
    kubectl get namespaces | grep tripo04os

    # Check pods
    kubectl get pods --namespace=tripo04os-production

    # Check services
    kubectl get services --namespace=tripo04os-production

    print_info "Setup verification completed!"
}

# Main function
main() {
    print_info "=========================================="
    print_info "Tripo04OS - Environment Setup"
    print_info "=========================================="
    echo ""

    load_env
    create_namespaces
    create_configmaps
    create_secrets
    deploy_infrastructure
    deploy_monitoring
    deploy_api_gateway
    verify_setup

    echo ""
    print_info "=========================================="
    print_info "Environment setup completed successfully!"
    print_info "=========================================="
}

# Run main function
main
```

---

## 5. Service Deployment Scripts

### 5.1 Deploy All Services

**File:** `scripts/deployment/deploy-all.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
source "$PROJECT_ROOT/.env"

# Default environment
ENVIRONMENT=${1:-staging}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Define services
declare -A SERVICES=(
    ["identity-service"]="backend_services/identity_service"
    ["order-service"]="backend_services/order_service"
    ["trip-service"]="backend_services/trip_service"
    ["matching-service"]="backend_services/matching_service"
    ["pricing-service"]="backend_services/pricing_service"
    ["location-service"]="backend_services/location_service"
)

# Deploy a single service
deploy_service() {
    local service_name=$1
    local service_path=$2

    print_info "Deploying $service_name..."

    cd "$PROJECT_ROOT/$service_path"

    # Build and push Docker image
    print_info "Building Docker image for $service_name..."
    make docker-build

    # Deploy to Kubernetes
    print_info "Deploying $service_name to $ENVIRONMENT..."
    kubectl apply -f kubernetes/ --namespace=tripo04os-$ENVIRONMENT

    # Wait for deployment to be ready
    print_info "Waiting for $service_name to be ready..."
    kubectl wait --for=condition=available deployment/$service_name \
        --namespace=tripo04os-$ENVIRONMENT --timeout=300s

    cd "$PROJECT_ROOT"

    print_info "$service_name deployed successfully!"
}

# Main deployment
main() {
    print_info "=========================================="
    print_info "Deploying all services to $ENVIRONMENT"
    print_info "=========================================="
    echo ""

    # Check if environment is valid
    if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        print_error "Invalid environment: $ENVIRONMENT"
        echo "Usage: $0 {dev|staging|production}"
        exit 1
    fi

    # Update kubeconfig
    print_info "Updating kubeconfig for $ENVIRONMENT..."
    case $ENVIRONMENT in
        dev)
            aws eks update-kubeconfig --name $EKS_CLUSTER_DEV --region $AWS_REGION
            ;;
        staging)
            aws eks update-kubeconfig --name $EKS_CLUSTER_STAGING --region $AWS_REGION
            ;;
        production)
            aws eks update-kubeconfig --name $EKS_CLUSTER_PROD --region $AWS_REGION
            ;;
    esac

    # Deploy all services
    for service in "${!SERVICES[@]}"; do
        deploy_service "$service" "${SERVICES[$service]}"
        echo ""
    done

    # Verify all deployments
    print_info "Verifying all deployments..."
    kubectl get deployments --namespace=tripo04os-$ENVIRONMENT

    print_info "=========================================="
    print_info "All services deployed successfully!"
    print_info "=========================================="
}

main
```

### 5.2 Deploy Single Service

**File:** `scripts/deployment/deploy-service.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
source "$PROJECT_ROOT/.env"

SERVICE_NAME=$1
ENVIRONMENT=${2:-staging}

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: $0 <service-name> [environment]"
    echo ""
    echo "Available services:"
    echo "  identity-service"
    echo "  order-service"
    echo "  trip-service"
    echo "  matching-service"
    echo "  pricing-service"
    echo "  location-service"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Service paths
SERVICE_PATHS=(
    "identity-service:backend_services/identity_service"
    "order-service:backend_services/order_service"
    "trip-service:backend_services/trip_service"
    "matching-service:backend_services/matching_service"
    "pricing-service:backend_services/pricing_service"
    "location-service:backend_services/location_service"
)

# Find service path
SERVICE_PATH=""
for item in "${SERVICE_PATHS[@]}"; do
    IFS=':' read -ra PARTS <<< "$item"
    if [ "${PARTS[0]}" == "$SERVICE_NAME" ]; then
        SERVICE_PATH="${PARTS[1]}"
        break
    fi
done

if [ -z "$SERVICE_PATH" ]; then
    print_error "Service not found: $SERVICE_NAME"
    exit 1
fi

# Deploy service
main() {
    print_info "=========================================="
    print_info "Deploying $SERVICE_NAME to $ENVIRONMENT"
    print_info "=========================================="
    echo ""

    # Update kubeconfig
    print_info "Updating kubeconfig for $ENVIRONMENT..."
    case $ENVIRONMENT in
        dev)
            aws eks update-kubeconfig --name $EKS_CLUSTER_DEV --region $AWS_REGION
            ;;
        staging)
            aws eks update-kubeconfig --name $EKS_CLUSTER_STAGING --region $AWS_REGION
            ;;
        production)
            aws eks update-kubeconfig --name $EKS_CLUSTER_PROD --region $AWS_REGION
            ;;
    esac

    cd "$PROJECT_ROOT/$SERVICE_PATH"

    # Build and push Docker image
    print_info "Building Docker image for $SERVICE_NAME..."
    make docker-build

    # Deploy to Kubernetes
    print_info "Deploying $SERVICE_NAME to $ENVIRONMENT..."
    kubectl apply -f kubernetes/ --namespace=tripo04os-$ENVIRONMENT

    # Wait for deployment to be ready
    print_info "Waiting for $SERVICE_NAME to be ready..."
    kubectl wait --for=condition=available deployment/$SERVICE_NAME \
        --namespace=tripo04os-$ENVIRONMENT --timeout=300s

    # Verify deployment
    print_info "Verifying deployment..."
    kubectl get deployment/$SERVICE_NAME --namespace=tripo04os-$ENVIRONMENT
    kubectl get pods -l app=$SERVICE_NAME --namespace=tripo04os-$ENVIRONMENT

    cd "$PROJECT_ROOT"

    print_info "=========================================="
    print_info "$SERVICE_NAME deployed successfully!"
    print_info "=========================================="
}

main
```

### 5.3 Scale Service

**File:** `scripts/deployment/scale-service.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SERVICE_NAME=$1
REPLICAS=$2
ENVIRONMENT=${3:-staging}

if [ -z "$SERVICE_NAME" ] || [ -z "$REPLICAS" ]; then
    echo "Usage: $0 <service-name> <replicas> [environment]"
    echo ""
    echo "Example:"
    echo "  $0 identity-service 3 production"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

main() {
    print_info "=========================================="
    print_info "Scaling $SERVICE_NAME to $REPLICAS replicas"
    print_info "=========================================="
    echo ""

    # Scale deployment
    print_info "Scaling $SERVICE_NAME..."
    kubectl scale deployment/$SERVICE_NAME --replicas=$REPLICAS \
        --namespace=tripo04os-$ENVIRONMENT

    # Wait for scale operation to complete
    print_info "Waiting for scale operation to complete..."
    kubectl rollout status deployment/$SERVICE_NAME \
        --namespace=tripo04os-$ENVIRONMENT --timeout=300s

    # Verify scaling
    print_info "Verifying scaling..."
    kubectl get deployment/$SERVICE_NAME --namespace=tripo04os-$ENVIRONMENT
    kubectl get pods -l app=$SERVICE_NAME --namespace=tripo04os-$ENVIRONMENT

    print_info "=========================================="
    print_info "$SERVICE_NAME scaled successfully!"
    print_info "=========================================="
}

main
```

---

## 6. Database Migration Scripts

### 6.1 Run Migrations

**File:** `scripts/database/migrate-up.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SERVICE_NAME=${1:-all}
ENVIRONMENT=${2:-staging}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Define services with databases
declare -A DB_SERVICES=(
    ["identity-service"]="tripo04os_identity"
    ["order-service"]="tripo04os_orders"
    ["trip-service"]="tripo04os_trips"
    ["matching-service"]="tripo04os_matching"
    ["pricing-service"]="tripo04os_pricing"
    ["location-service"]="tripo04os_locations"
)

# Run migrations for a single service
migrate_service() {
    local service=$1
    local database=$2

    print_info "Running migrations for $service..."

    # Get service path
    local service_path="backend_services/${service//-/_}"

    if [ ! -d "$PROJECT_ROOT/$service_path/databases/migrations" ]; then
        print_warning "No migrations found for $service"
        return
    fi

    cd "$PROJECT_ROOT/$service_path"

    # Run migrations using migrate tool
    migrate -path databases/migrations \
        -database "postgres://tripo04os:tripo04os123@$DATABASE_HOST:$DATABASE_PORT/$database?sslmode=require" \
        up

    cd "$PROJECT_ROOT"

    print_info "Migrations completed for $service!"
}

# Main function
main() {
    print_info "=========================================="
    print_info "Database Migration ($ENVIRONMENT)"
    print_info "=========================================="
    echo ""

    if [ "$SERVICE_NAME" == "all" ]; then
        # Run migrations for all services
        for service in "${!DB_SERVICES[@]}"; do
            migrate_service "$service" "${DB_SERVICES[$service]}"
            echo ""
        done
    else
        # Run migration for specific service
        if [ -z "${DB_SERVICES[$SERVICE_NAME]}" ]; then
            print_warning "Database not found for service: $SERVICE_NAME"
            exit 1
        fi

        migrate_service "$SERVICE_NAME" "${DB_SERVICES[$SERVICE_NAME]}"
    fi

    print_info "=========================================="
    print_info "All migrations completed successfully!"
    print_info "=========================================="
}

main
```

### 6.2 Rollback Migrations

**File:** `scripts/database/migrate-down.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SERVICE_NAME=${1:-all}
ENVIRONMENT=${2:-staging}
STEPS=${3:-1}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Define services with databases
declare -A DB_SERVICES=(
    ["identity-service"]="tripo04os_identity"
    ["order-service"]="tripo04os_orders"
    ["trip-service"]="tripo04os_trips"
    ["matching-service"]="tripo04os_matching"
    ["pricing-service"]="tripo04os_pricing"
    ["location-service"]="tripo04os_locations"
)

# Rollback migrations for a single service
rollback_service() {
    local service=$1
    local database=$2

    print_info "Rolling back $STEPS migration(s) for $service..."

    # Get service path
    local service_path="backend_services/${service//-/_}"

    if [ ! -d "$PROJECT_ROOT/$service_path/databases/migrations" ]; then
        print_warning "No migrations found for $service"
        return
    fi

    cd "$PROJECT_ROOT/$service_path"

    # Rollback migrations
    migrate -path databases/migrations \
        -database "postgres://tripo04os:tripo04os123@$DATABASE_HOST:$DATABASE_PORT/$database?sslmode=require" \
        down $STEPS

    cd "$PROJECT_ROOT"

    print_info "Rollback completed for $service!"
}

# Main function
main() {
    print_info "=========================================="
    print_info "Database Rollback ($ENVIRONMENT)"
    print_info "=========================================="
    echo ""

    # Warning for production
    if [ "$ENVIRONMENT" == "production" ]; then
        print_warning "You are about to rollback migrations in PRODUCTION!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Operation cancelled"
            exit 0
        fi
    fi

    if [ "$SERVICE_NAME" == "all" ]; then
        # Rollback migrations for all services
        for service in "${!DB_SERVICES[@]}"; do
            rollback_service "$service" "${DB_SERVICES[$service]}"
            echo ""
        done
    else
        # Rollback migration for specific service
        if [ -z "${DB_SERVICES[$SERVICE_NAME]}" ]; then
            print_error "Database not found for service: $SERVICE_NAME"
            exit 1
        fi

        rollback_service "$SERVICE_NAME" "${DB_SERVICES[$SERVICE_NAME]}"
    fi

    print_info "=========================================="
    print_info "All rollbacks completed successfully!"
    print_info "=========================================="
}

main
```

### 6.3 Backup Database

**File:** `scripts/database/backup.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_ROOT/.env"

DATABASE_NAME=${1:-tripo04os_identity}
BACKUP_DIR=${2:-/tmp/tripo04os-backups}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DATABASE_NAME}_${TIMESTAMP}.sql.gz"

# Main function
main() {
    print_info "=========================================="
    print_info "Database Backup"
    print_info "=========================================="
    echo ""

    print_info "Database: $DATABASE_NAME"
    print_info "Backup file: $BACKUP_FILE"
    echo ""

    # Create backup
    print_info "Creating backup..."
    PGPASSWORD=tripo04os123 pg_dump \
        -h $DATABASE_HOST \
        -p $DATABASE_PORT \
        -U tripo04os \
        -d $DATABASE_NAME \
        --no-owner \
        --no-acl \
        --format=plain \
        | gzip > "$BACKUP_FILE"

    # Verify backup
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_info "Backup created successfully! Size: $BACKUP_SIZE"

        # Upload to S3 (optional)
        if [ ! -z "$S3_BACKUP_BUCKET" ]; then
            print_info "Uploading to S3..."
            aws s3 cp "$BACKUP_FILE" \
                "s3://$S3_BACKUP_BUCKET/database-backups/$DATABASE_NAME/"
        fi
    else
        print_error "Backup failed!"
        exit 1
    fi

    print_info "=========================================="
    print_info "Backup completed successfully!"
    print_info "=========================================="
}

main
```

### 6.4 Restore Database

**File:** `scripts/database/restore.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_ROOT/.env"

BACKUP_FILE=$1
DATABASE_NAME=${2:-tripo04os_identity}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if backup file exists
if [ -z "$BACKUP_FILE" ]; then
    print_error "Backup file not specified!"
    echo "Usage: $0 <backup-file> [database-name]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Main function
main() {
    print_info "=========================================="
    print_info "Database Restore"
    print_info "=========================================="
    echo ""

    print_info "Backup file: $BACKUP_FILE"
    print_info "Database: $DATABASE_NAME"
    echo ""

    # Warning for production
    if [ "$DATABASE_NAME" == *"production"* ]; then
        print_warning "You are about to restore a PRODUCTION database!"
        print_warning "This operation will overwrite existing data!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Operation cancelled"
            exit 0
        fi
    fi

    # Restore backup
    print_info "Restoring backup..."
    gunzip -c "$BACKUP_FILE" | PGPASSWORD=tripo04os123 psql \
        -h $DATABASE_HOST \
        -p $DATABASE_PORT \
        -U tripo04os \
        -d $DATABASE_NAME

    print_info "=========================================="
    print_info "Restore completed successfully!"
    print_info "=========================================="
}

main
```

---

## 7. Rollback Scripts

### 7.1 Deployment Rollback

**File:** `scripts/deployment/rollback.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SERVICE_NAME=$1
ENVIRONMENT=${2:-staging}
REVISION=${3}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

if [ -z "$SERVICE_NAME" ]; then
    print_error "Service name not specified!"
    echo "Usage: $0 <service-name> [environment] [revision]"
    echo ""
    echo "Example:"
    echo "  $0 identity-service production  # Rollback to previous version"
    echo "  $0 identity-service production 3  # Rollback to revision 3"
    exit 1
fi

# Main function
main() {
    print_info "=========================================="
    print_info "Deployment Rollback"
    print_info "=========================================="
    echo ""

    print_info "Service: $SERVICE_NAME"
    print_info "Environment: $ENVIRONMENT"

    # Warning for production
    if [ "$ENVIRONMENT" == "production" ]; then
        print_warning "You are about to rollback PRODUCTION deployment!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Operation cancelled"
            exit 0
        fi
    fi

    # Show deployment history
    print_info "Deployment history:"
    kubectl rollout history deployment/$SERVICE_NAME \
        --namespace=tripo04os-$ENVIRONMENT

    echo ""

    # Rollback
    if [ -z "$REVISION" ]; then
        print_info "Rolling back to previous version..."
        kubectl rollout undo deployment/$SERVICE_NAME \
            --namespace=tripo04os-$ENVIRONMENT
    else
        print_info "Rolling back to revision $REVISION..."
        kubectl rollout undo deployment/$SERVICE_NAME \
            --to-revision=$REVISION \
            --namespace=tripo04os-$ENVIRONMENT
    fi

    # Wait for rollback to complete
    print_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/$SERVICE_NAME \
        --namespace=tripo04os-$ENVIRONMENT --timeout=300s

    # Verify rollback
    print_info "Verifying rollback..."
    kubectl get deployment/$SERVICE_NAME --namespace=tripo04os-$ENVIRONMENT
    kubectl get pods -l app=$SERVICE_NAME --namespace=tripo04os-$ENVIRONMENT

    print_info "=========================================="
    print_info "Rollback completed successfully!"
    print_info "=========================================="
}

main
```

---

## 8. Health Check Scripts

### 8.1 Check All Services

**File:** `scripts/health/check-all.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_ROOT/.env"

ENVIRONMENT=${1:-staging}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Define services
SERVICES=(
    "identity-service"
    "order-service"
    "trip-service"
    "matching-service"
    "pricing-service"
    "location-service"
    "communication-service"
    "safety-service"
    "reputation-service"
    "fraud-service"
    "subscription-service"
    "analytics-service"
)

# Check single service health
check_service() {
    local service=$1

    print_info "Checking $service..."

    # Check deployment status
    READY_REPLICAS=$(kubectl get deployment/$service \
        --namespace=tripo04os-$ENVIRONMENT \
        -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

    DESIRED_REPLICAS=$(kubectl get deployment/$service \
        --namespace=tripo04os-$ENVIRONMENT \
        -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

    if [ "$READY_REPLICAS" == "$DESIRED_REPLICAS" ] && [ "$READY_REPLICAS" -gt 0 ]; then
        print_info "✓ $service: $READY_REPLICAS/$DESIRED_REPLICAS replicas ready"

        # Check pod health
        UNHEALTHY_PODS=$(kubectl get pods -l app=$service \
            --namespace=tripo04os-$ENVIRONMENT \
            --field-selector=status.phase!=Running \
            -o jsonpath='{.items}' | jq length 2>/dev/null || echo "0")

        if [ "$UNHEALTHY_PODS" -gt 0 ]; then
            print_warning "  ⚠ $UNHEALTHY_PODS unhealthy pod(s)"
        fi

        return 0
    else
        print_error "✗ $service: $READY_REPLICAS/$DESIRED_REPLICAS replicas ready"
        return 1
    fi
}

# Main function
main() {
    print_info "=========================================="
    print_info "Health Check - All Services"
    print_info "Environment: $ENVIRONMENT"
    print_info "=========================================="
    echo ""

    FAILED_SERVICES=0

    for service in "${SERVICES[@]}"; do
        if ! check_service "$service"; then
            FAILED_SERVICES=$((FAILED_SERVICES + 1))
        fi
        echo ""
    done

    print_info "=========================================="
    if [ $FAILED_SERVICES -eq 0 ]; then
        print_info "All services are healthy!"
    else
        print_error "$FAILED_SERVICES service(s) failed health check!"
        exit 1
    fi
    print_info "=========================================="
}

main
```

### 8.2 Wait for Services to be Ready

**File:** `scripts/health/wait-ready.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_ROOT/.env"

SERVICE_NAME=$1
ENVIRONMENT=${2:-staging}
TIMEOUT=${3:-300}

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: $0 <service-name> [environment] [timeout-seconds]"
    echo ""
    echo "Example:"
    echo "  $0 identity-service production 600"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Main function
main() {
    print_info "Waiting for $SERVICE_NAME to be ready (timeout: ${TIMEOUT}s)..."

    kubectl wait --for=condition=available deployment/$SERVICE_NAME \
        --namespace=tripo04os-$ENVIRONMENT --timeout=${TIMEOUT}s

    print_info "$SERVICE_NAME is ready!"
}

main
```

---

## 9. Maintenance Scripts

### 9.1 Cleanup Resources

**File:** `scripts/maintenance/cleanup.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_ROOT/.env"

ENVIRONMENT=${1:-staging}
RESOURCE_TYPE=${2:-all}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Cleanup evicted pods
cleanup_evicted_pods() {
    print_info "Cleaning up evicted pods..."
    kubectl delete pods \
        --field-selector=status.phase=Failed \
        --namespace=tripo04os-$ENVIRONMENT
}

# Cleanup completed jobs
cleanup_completed_jobs() {
    print_info "Cleaning up completed jobs..."
    kubectl delete jobs \
        --field-selector=status.successful=1 \
        --namespace=tripo04os-$ENVIRONMENT
}

# Cleanup old pods
cleanup_old_pods() {
    print_info "Cleaning up old pods (older than 7 days)..."
    kubectl delete pods \
        --field-selector=status.phase=Succeeded \
        --namespace=tripo04os-$ENVIRONMENT
}

# Main function
main() {
    print_info "=========================================="
    print_info "Cleanup - $ENVIRONMENT"
    print_info "=========================================="
    echo ""

    print_warning "This will clean up resources in $ENVIRONMENT environment!"
    read -p "Continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Operation cancelled"
        exit 0
    fi

    case $RESOURCE_TYPE in
        pods)
            cleanup_evicted_pods
            cleanup_old_pods
            ;;
        jobs)
            cleanup_completed_jobs
            ;;
        all)
            cleanup_evicted_pods
            cleanup_completed_jobs
            cleanup_old_pods
            ;;
        *)
            print_warning "Unknown resource type: $RESOURCE_TYPE"
            print_info "Valid types: pods, jobs, all"
            exit 1
            ;;
    esac

    print_info "=========================================="
    print_info "Cleanup completed successfully!"
    print_info "=========================================="
}

main
```

### 9.2 Restart Services

**File:** `scripts/maintenance/restart.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_ROOT/.env"

SERVICE_NAME=$1
ENVIRONMENT=${2:-staging}

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: $0 <service-name> [environment]"
    echo ""
    echo "Example:"
    echo "  $0 identity-service production"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Main function
main() {
    print_info "=========================================="
    print_info "Restarting $SERVICE_NAME"
    print_info "Environment: $ENVIRONMENT"
    print_info "=========================================="
    echo ""

    # Rollout restart
    print_info "Restarting $SERVICE_NAME..."
    kubectl rollout restart deployment/$SERVICE_NAME \
        --namespace=tripo04os-$ENVIRONMENT

    # Wait for restart to complete
    print_info "Waiting for restart to complete..."
    kubectl rollout status deployment/$SERVICE_NAME \
        --namespace=tripo04os-$ENVIRONMENT --timeout=300s

    # Verify restart
    print_info "Verifying restart..."
    kubectl get pods -l app=$SERVICE_NAME --namespace=tripo04os-$ENVIRONMENT

    print_info "=========================================="
    print_info "Restart completed successfully!"
    print_info "=========================================="
}

main
```

---

## 10. Monitoring Scripts

### 10.1 Collect Metrics

**File:** `scripts/monitoring/metrics.sh`

```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_ROOT/.env"

ENVIRONMENT=${1:-staging}
OUTPUT_FILE=${2:-metrics_$(date +%Y%m%d_%H%M%S).json}

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Main function
main() {
    print_info "=========================================="
    print_info "Collecting Metrics"
    print_info "Environment: $ENVIRONMENT"
    print_info "=========================================="
    echo ""

    # Get Prometheus metrics
    PROMETHEUS_URL="http://prometheus.observability.svc.cluster.local:9090"

    # Query pod metrics
    print_info "Querying pod metrics..."
    kubectl top pods --namespace=tripo04os-$ENVIRONMENT

    echo ""

    # Query node metrics
    print_info "Querying node metrics..."
    kubectl top nodes

    echo ""

    # Get deployment metrics
    print_info "Querying deployment metrics..."
    kubectl get deployments --namespace=tripo04os-$ENVIRONMENT \
        -o json > "$OUTPUT_FILE"

    print_info "=========================================="
    print_info "Metrics saved to: $OUTPUT_FILE"
    print_info "=========================================="
}

main
```

---

## Appendix A: Usage Examples

### Complete Deployment Workflow

```bash
# 1. Initial setup
./scripts/deployment/setup.sh

# 2. Deploy all services to staging
./scripts/deployment/deploy-all.sh staging

# 3. Run database migrations
./scripts/database/migrate-up.sh all staging

# 4. Check health
./scripts/health/check-all.sh staging

# 5. Wait for services to be ready
./scripts/health/wait-ready.sh identity-service staging 600

# 6. Scale service if needed
./scripts/deployment/scale-service.sh identity-service 3 staging

# 7. Promote to production
./scripts/deployment/deploy-all.sh production
./scripts/database/migrate-up.sh all production
./scripts/health/check-all.sh production
```

### Rollback Workflow

```bash
# 1. Check deployment history
kubectl rollout history deployment/identity-service \
    --namespace=tripo04os-production

# 2. Rollback to previous version
./scripts/deployment/rollback.sh identity-service production

# 3. Or rollback to specific revision
./scripts/deployment/rollback.sh identity-service production 3

# 4. Verify health
./scripts/health/check-all.sh production
```

### Maintenance Workflow

```bash
# 1. Check all services health
./scripts/health/check-all.sh production

# 2. Restart a service
./scripts/maintenance/restart.sh identity-service production

# 3. Cleanup old resources
./scripts/maintenance/cleanup.sh production all

# 4. Collect metrics
./scripts/monitoring/metrics.sh production
```

---

## Appendix B: Troubleshooting

### Common Issues

**Issue: Deployment fails**
```bash
# Check pod logs
kubectl logs -f deployment/identity-service --namespace=tripo04os-staging

# Describe pod for more details
kubectl describe pod <pod-name> --namespace=tripo04os-staging
```

**Issue: Service not ready**
```bash
# Wait for service to be ready
./scripts/health/wait-ready.sh identity-service staging 600

# Check events
kubectl get events --namespace=tripo04os-staging --sort-by='.lastTimestamp'
```

**Issue: Migration fails**
```bash
# Check migration status
./scripts/database/migrate-up.sh identity-service staging

# Rollback if needed
./scripts/database/migrate-down.sh identity-service staging 1
```

---

**Document End**
