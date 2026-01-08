# Infrastructure Setup - Configure CI/CD Pipeline

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Infrastructure Setup - Configure CI/CD Pipeline |
| **Version** | 1.0 |
| **Date** | 2026-01-06 |
| **Status** | Draft |
| **Author** | Kilo Code |
| **Project** | Tripo04OS Phase 1 Implementation |
| **CI/CD Platform** | GitHub Actions |

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GitHub Actions Workflow Structure](#github-actions-workflow-structure)
4. [Build and Test Pipeline](#build-and-test-pipeline)
5. [Docker Image Build](#docker-image-build)
6. [Deployment Pipeline](#deployment-pipeline)
7. [Environment Configuration](#environment-configuration)
8. [Secrets Management](#secrets-management)
9. [Monitoring and Notifications](#monitoring-and-notifications)
10. [Rollback Strategy](#rollback-strategy)

---

## 1. Overview

### 1.1 Purpose

This document provides comprehensive instructions for configuring a CI/CD pipeline using GitHub Actions for the Tripo04OS platform, including:

- Automated build and test processes
- Docker image creation and management
- Multi-environment deployment (dev, staging, production)
- Automated testing and quality checks
- Security scanning and vulnerability detection
- Monitoring and alerting integration

### 1.2 Pipeline Stages

```
Code Push → Build → Unit Tests → Security Scan → 
Docker Build → Integration Tests → Staging Deploy → 
UAT → Production Deploy → Monitoring
```

### 1.3 Services in Pipeline

| Service | Repository | Branch | Environments |
|----------|------------|--------|--------------|
| AI Support | tripo04os/ai-support | main | dev, staging, production |
| Premium Driver Matching | tripo04os/premium-driver-matching | main | dev, staging, production |
| Profit Optimization Engine | tripo04os/profit-optimization-engine | main | dev, staging, production |
| Dashboard API | tripo04os/dashboard-api | main | dev, staging, production |

---

## 2. Prerequisites

### 2.1 Required Tools

- **GitHub**: Repository hosting and CI/CD platform
- **Docker**: Containerization
- **Kubernetes**: Container orchestration
- **AWS CLI**: AWS command-line interface
- **kubectl**: Kubernetes command-line interface
- **Helm**: Kubernetes package manager (optional)

### 2.2 GitHub Configuration

- **GitHub Organization**: tripo04os
- **Repository Access**: Admin access to all repositories
- **GitHub Actions**: Enabled for all repositories
- **Branch Protection**: Enabled for main branch

### 2.3 Kubernetes Configuration

- **EKS Cluster**: Amazon EKS cluster deployed
- **kubectl Config**: Configured to access EKS cluster
- **Namespaces**: Created for dev, staging, production
- **Service Accounts**: Created for deployments

---

## 3. GitHub Actions Workflow Structure

### 3.1 Workflow Directory Structure

```
.github/
├── workflows/
│   ├── ci.yml                    # Continuous Integration workflow
│   ├── cd.yml                    # Continuous Deployment workflow
│   ├── security-scan.yml          # Security scanning workflow
│   └── rollback.yml              # Rollback workflow
├── actions/
│   ├── docker-build/              # Custom Docker build action
│   ├── kubectl-deploy/           # Custom kubectl deploy action
│   └── notification/             # Custom notification action
└── scripts/
    ├── build.sh                   # Build script
    ├── test.sh                    # Test script
    ├── deploy.sh                  # Deploy script
    └── rollback.sh                # Rollback script
```

### 3.2 Workflow Triggers

#### CI Workflow Triggers

```yaml
on:
  push:
    branches: [ main, develop ]
    paths-ignore:
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [ main ]
    types: [ opened, synchronize, reopened ]
```

#### CD Workflow Triggers

```yaml
on:
  push:
    branches: [ main ]
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
```

---

## 4. Build and Test Pipeline

### 4.1 CI Workflow

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        python-version: ['3.11']
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}
      
      - name: Cache pip dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Lint with flake8
        run: |
          pip install flake8
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
      
      - name: Type check with mypy
        run: |
          pip install mypy
          mypy . --ignore-missing-imports
      
      - name: Run unit tests
        run: |
          pytest tests/ -v --cov=. --cov-report=xml --cov-report=term
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false
      
      - name: Upload coverage artifacts
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: htmlcov/
```

### 4.2 Security Scanning Job

```yaml
  security-scan:
    runs-on: ubuntu-latest
    needs: build-and-test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run Bandit security linter
        run: |
          pip install bandit
          bandit -r . -f json -o bandit-report.json
      
      - name: Upload security scan artifacts
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: |
            trivy-results.sarif
            bandit-report.json
```

### 4.3 Integration Tests Job

```yaml
  integration-tests:
    runs-on: ubuntu-latest
    needs: [ build-and-test, security-scan ]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest-asyncio httpx
      
      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@postgres:5432/test_db
          REDIS_URL: redis://redis:6379/0
        run: |
          pytest tests/ -v -m integration --cov=. --cov-report=xml
      
      - name: Upload integration test results
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: |
            coverage.xml
            test-results/
```

---

## 5. Docker Image Build

### 5.1 Docker Build Job

```yaml
  docker-build:
    runs-on: ubuntu-latest
    needs: [ integration-tests ]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Extract metadata for Docker
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ steps.login-ecr.outputs.registry }}/tripo04os-ai-support
          tags: |
            type=sha
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
      
      - name: Scan Docker image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.login-ecr.outputs.registry }}/tripo04os-ai-support:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-image-results.sarif'
      
      - name: Upload Trivy image scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-image-results.sarif'
```

### 5.2 Multi-Service Docker Build

```yaml
  build-all-services:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        service:
          - name: ai-support
            path: ./ai_support_implementation
            port: 8000
          - name: premium-driver-matching
            path: ./premium_driver_matching_implementation
            port: 8001
          - name: profit-optimization-engine
            path: ./profit_optimization_engine_implementation
            port: 8002
          - name: dashboard-api
            path: ./profit_optimization_engine_implementation
            port: 8003
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push ${{ matrix.service.name }}
        uses: docker/build-push-action@v4
        with:
          context: ${{ matrix.service.path }}
          push: true
          tags: |
            ${{ steps.login-ecr.outputs.registry }}/tripo04os-${{ matrix.service.name }}:latest
            ${{ steps.login-ecr.outputs.registry }}/tripo04os-${{ matrix.service.name }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 6. Deployment Pipeline

### 6.1 Staging Deployment Workflow

```yaml
name: Deploy to Staging

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name tripo04os-staging --region us-east-1
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ai-support \
            ai-support=tripo04os-ai-support:${{ github.sha }} \
            -n tripo04os-staging
          
          kubectl rollout status deployment/ai-support -n tripo04os-staging
          
          kubectl set image deployment/premium-driver-matching \
            premium-driver-matching=tripo04os-premium-driver-matching:${{ github.sha }} \
            -n tripo04os-staging
          
          kubectl rollout status deployment/premium-driver-matching -n tripo04os-staging
          
          kubectl set image deployment/profit-optimization-engine \
            profit-optimization-engine=tripo04os-profit-optimization-engine:${{ github.sha }} \
            -n tripo04os-staging
          
          kubectl rollout status deployment/profit-optimization-engine -n tripo04os-staging
          
          kubectl set image deployment/dashboard-api \
            dashboard-api=tripo04os-dashboard-api:${{ github.sha }} \
            -n tripo04os-staging
          
          kubectl rollout status deployment/dashboard-api -n tripo04os-staging
      
      - name: Verify deployment
        run: |
          kubectl wait --for=condition=available --timeout=300s \
            deployment/ai-support -n tripo04os-staging
          
          kubectl wait --for=condition=available --timeout=300s \
            deployment/premium-driver-matching -n tripo04os-staging
          
          kubectl wait --for=condition=available --timeout=300s \
            deployment/profit-optimization-engine -n tripo04os-staging
          
          kubectl wait --for=condition=available --timeout=300s \
            deployment/dashboard-api -n tripo04os-staging
      
      - name: Run smoke tests
        run: |
          # Wait for services to be ready
          sleep 30
          
          # Run smoke tests
          curl -f https://staging-api.tripo04os.com/health || exit 1
          curl -f https://staging-api.tripo04os.com/health || exit 1
          curl -f https://staging-api.tripo04os.com/health || exit 1
          curl -f https://staging-api.tripo04os.com/health || exit 1
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Successfully deployed to staging'
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 6.2 Production Deployment Workflow

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - production

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name tripo04os-production --region us-east-1
      
      - name: Deploy to Kubernetes
        run: |
          # Blue-Green deployment
          kubectl apply -f k8s/namespace.yaml
          
          # Deploy new version (green)
          kubectl apply -f k8s/deployment.yaml -l version=green
          
          # Wait for green deployment to be ready
          kubectl wait --for=condition=available --timeout=600s \
            deployment/ai-support-green -n tripo04os-production
          
          # Switch traffic to green
          kubectl patch service ai-support -p '{"spec":{"selector":{"version":"green"}}}' \
            -n tripo04os-production
          
          # Wait for traffic switch
          sleep 60
          
          # Verify health
          curl -f https://api.tripo04os.com/health || exit 1
          
          # If successful, scale down blue
          kubectl scale deployment ai-support-blue --replicas=0 \
            -n tripo04os-production
      
      - name: Verify deployment
        run: |
          kubectl wait --for=condition=available --timeout=600s \
            deployment/ai-support-green -n tripo04os-production
          
          # Run health checks
          for i in {1..10}; do
            if curl -f https://api.tripo04os.com/health; then
              echo "Health check passed"
              break
            fi
            echo "Health check failed, retrying..."
            sleep 10
          done
      
      - name: Run integration tests
        run: |
          # Run production smoke tests
          pytest tests/ -v -m smoke --env=production
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Successfully deployed to production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
      
      - name: Create deployment tag
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.git.createRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: `refs/tags/v${{ github.run_number }}`,
              sha: context.sha
            })
```

---

## 7. Environment Configuration

### 7.1 Environment Variables

#### Development Environment

```yaml
env:
  ENVIRONMENT: development
  LOG_LEVEL: DEBUG
  DATABASE_URL: postgresql://user:password@localhost:5432/tripo04os_dev
  REDIS_URL: redis://localhost:6379/0
  ELASTICSEARCH_URL: http://localhost:9200
  API_SECRET_KEY: dev-secret-key
  JWT_SECRET: dev-jwt-secret
  MAX_REQUESTS: 1000
  REQUEST_TIMEOUT: 60
  CACHE_TTL: 3600
```

#### Staging Environment

```yaml
env:
  ENVIRONMENT: staging
  LOG_LEVEL: INFO
  DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
  REDIS_URL: ${{ secrets.STAGING_REDIS_URL }}
  ELASTICSEARCH_URL: ${{ secrets.STAGING_ELASTICSEARCH_URL }}
  API_SECRET_KEY: ${{ secrets.STAGING_API_SECRET_KEY }}
  JWT_SECRET: ${{ secrets.STAGING_JWT_SECRET }}
  MAX_REQUESTS: 10000
  REQUEST_TIMEOUT: 30
  CACHE_TTL: 3600
```

#### Production Environment

```yaml
env:
  ENVIRONMENT: production
  LOG_LEVEL: WARNING
  DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
  REDIS_URL: ${{ secrets.PRODUCTION_REDIS_URL }}
  ELASTICSEARCH_URL: ${{ secrets.PRODUCTION_ELASTICSEARCH_URL }}
  API_SECRET_KEY: ${{ secrets.PRODUCTION_API_SECRET_KEY }}
  JWT_SECRET: ${{ secrets.PRODUCTION_JWT_SECRET }}
  MAX_REQUESTS: 10000
  REQUEST_TIMEOUT: 30
  CACHE_TTL: 3600
```

### 7.2 Kubernetes Namespaces

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tripo04os-development
  labels:
    environment: development
---
apiVersion: v1
kind: Namespace
metadata:
  name: tripo04os-staging
  labels:
    environment: staging
---
apiVersion: v1
kind: Namespace
metadata:
  name: tripo04os-production
  labels:
    environment: production
```

### 7.3 ConfigMaps

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: tripo04os-staging
data:
  ENVIRONMENT: "staging"
  LOG_LEVEL: "INFO"
  MAX_REQUESTS: "10000"
  REQUEST_TIMEOUT: "30"
  CACHE_TTL: "3600"
```

---

## 8. Secrets Management

### 8.1 GitHub Secrets

| Secret Name | Description | Required |
|-------------|-------------|-----------|
| AWS_ACCESS_KEY_ID | AWS access key ID | Yes |
| AWS_SECRET_ACCESS_KEY | AWS secret access key | Yes |
| STAGING_DATABASE_URL | Staging database connection string | Yes |
| STAGING_REDIS_URL | Staging Redis connection string | Yes |
| STAGING_ELASTICSEARCH_URL | Staging Elasticsearch URL | Yes |
| STAGING_API_SECRET_KEY | Staging API secret key | Yes |
| STAGING_JWT_SECRET | Staging JWT secret | Yes |
| PRODUCTION_DATABASE_URL | Production database connection string | Yes |
| PRODUCTION_REDIS_URL | Production Redis connection string | Yes |
| PRODUCTION_ELASTICSEARCH_URL | Production Elasticsearch URL | Yes |
| PRODUCTION_API_SECRET_KEY | Production API secret key | Yes |
| PRODUCTION_JWT_SECRET | Production JWT secret | Yes |
| SLACK_WEBHOOK_URL | Slack webhook for notifications | Yes |

### 8.2 Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: tripo04os-staging
type: Opaque
stringData:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  ELASTICSEARCH_URL: <base64-encoded-elasticsearch-url>
  API_SECRET_KEY: <base64-encoded-api-secret-key>
  JWT_SECRET: <base64-encoded-jwt-secret>
```

### 8.3 Secret Creation Script

```bash
#!/bin/bash

# Create Kubernetes secrets
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=REDIS_URL="$REDIS_URL" \
  --from-literal=ELASTICSEARCH_URL="$ELASTICSEARCH_URL" \
  --from-literal=API_SECRET_KEY="$API_SECRET_KEY" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  -n tripo04os-staging

# Verify secrets
kubectl get secrets app-secrets -n tripo04os-staging
```

---

## 9. Monitoring and Notifications

### 9.1 Prometheus Integration

```yaml
  monitor-deployment:
    runs-on: ubuntu-latest
    needs: [ deploy-production ]
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name tripo04os-production --region us-east-1
      
      - name: Check deployment health
        run: |
          # Check pod status
          kubectl get pods -n tripo04os-production -l app=ai-support
          
          # Check deployment status
          kubectl rollout status deployment/ai-support -n tripo04os-production
          
          # Query Prometheus metrics
          kubectl port-forward svc/prometheus 9090:9090 -n tripo04os-production &
          
          # Wait for metrics
          sleep 30
          
          # Query metrics
          curl -s 'http://localhost:9090/api/v1/query?query=up{job="ai-support"}' || true
```

### 9.2 Slack Notifications

```yaml
      - name: Notify on success
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment to ${{ inputs.environment }} successful!
            Repository: ${{ github.repository }}
            Branch: ${{ github.ref }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment to ${{ inputs.environment }} failed! ❌
            Repository: ${{ github.repository }}
            Branch: ${{ github.ref }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
            Error: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 9.3 Email Notifications

```yaml
      - name: Send email notification
        if: always()
        uses: dawidd6/action-send-mail@v1
        with:
          server_address: smtp.gmail.com
          server_port: 465
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          subject: "Deployment Status: ${{ job.status }}"
          to: ${{ secrets.NOTIFICATION_EMAIL }}
          from: CI/CD Pipeline
          body: |
            Deployment to ${{ inputs.environment }} ${{ job.status }}
            
            Repository: ${{ github.repository }}
            Branch: ${{ github.ref }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
            
            View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

---

## 10. Rollback Strategy

### 10.1 Rollback Workflow

```yaml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      deployment:
        description: 'Deployment to rollback'
        required: true
      previous_version:
        description: 'Previous version to rollback to'
        required: false

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update kubeconfig
        run: |
          if [ "${{ inputs.environment }}" == "staging" ]; then
            aws eks update-kubeconfig --name tripo04os-staging --region us-east-1
          else
            aws eks update-kubeconfig --name tripo04os-production --region us-east-1
          fi
      
      - name: Rollback deployment
        run: |
          # Get previous deployment
          kubectl rollout history deployment/${{ inputs.deployment }} \
            -n tripo04os-${{ inputs.environment }}
          
          # Rollback to previous version
          if [ -n "${{ inputs.previous_version }}" ]; then
            kubectl rollout undo deployment/${{ inputs.deployment }} \
              --to-revision=${{ inputs.previous_version }} \
              -n tripo04os-${{ inputs.environment }}
          else
            kubectl rollout undo deployment/${{ inputs.deployment }} \
              -n tripo04os-${{ inputs.environment }}
          fi
          
          # Wait for rollback to complete
          kubectl rollout status deployment/${{ inputs.deployment }} \
            -n tripo04os-${{ inputs.environment }}
          
          # Verify health
          sleep 30
          curl -f https://api.tripo04os.com/health || exit 1
      
      - name: Notify rollback
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Rollback completed for ${{ inputs.deployment }} in ${{ inputs.environment }}
            Previous version: ${{ inputs.previous_version || 'automatic' }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 10.2 Automatic Rollback on Health Check Failure

```yaml
      - name: Health check with rollback
        run: |
          # Wait for deployment to be ready
          kubectl wait --for=condition=available --timeout=600s \
            deployment/ai-support -n tripo04os-production
          
          # Run health checks
          HEALTH_CHECK_PASSED=false
          for i in {1..30}; do
            if curl -f https://api.tripo04os.com/health; then
              HEALTH_CHECK_PASSED=true
              break
            fi
            echo "Health check attempt $i failed"
            sleep 10
          done
          
          # If health check failed, rollback
          if [ "$HEALTH_CHECK_PASSED" = false ]; then
            echo "Health check failed, initiating rollback..."
            kubectl rollout undo deployment/ai-support \
              -n tripo04os-production
            
            # Notify rollback
            curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
              -H 'Content-Type: application/json' \
              -d '{"text":"Automatic rollback initiated due to health check failure"}'
            
            exit 1
          fi
```

---

## Appendix A: Complete CI/CD Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
    tags:
      - 'v*'
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  # CI Jobs
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint
        run: |
          pip install flake8
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
  
  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - name: Test
        run: |
          pip install -r requirements.txt
          pytest tests/ -v --cov=. --cov-report=xml
  
  security-scan:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - name: Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '${{ github.sha }}'
          format: 'sarif'
  
  # CD Jobs
  build:
    runs-on: ubuntu-latest
    needs: [ lint, test, security-scan ]
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v1
      - name: Build and Push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ env.ECR_REGISTRY }}/tripo04os:latest,${{ github.sha }}
  
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name tripo04os-staging --region us-east-1
      - name: Deploy
        run: |
          kubectl set image deployment/ai-support \
            ai-support=${{ env.ECR_REGISTRY }}/tripo04os:${{ github.sha }} \
            -n tripo04os-staging
  
  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/')
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name tripo04os-production --region us-east-1
      - name: Deploy
        run: |
          kubectl set image deployment/ai-support \
            ai-support=${{ env.ECR_REGISTRY }}/tripo04os:${{ github.sha }} \
            -n tripo04os-production
      - name: Health Check
        run: |
          kubectl wait --for=condition=available --timeout=600s \
            deployment/ai-support -n tripo04os-production
          curl -f https://api.tripo04os.com/health || exit 1
```

---

## Appendix B: Troubleshooting

### Common CI/CD Issues

#### Issue: Build Fails

**Solution**: Check logs and fix build errors
```bash
# View build logs
gh run view <run-id>

# Check for syntax errors
python -m py_compile <file>
```

#### Issue: Tests Fail

**Solution**: Run tests locally to reproduce
```bash
# Run tests locally
pytest tests/ -v

# Run specific test
pytest tests/test_api.py::test_health_check -v
```

#### Issue: Deployment Fails

**Solution**: Check Kubernetes logs
```bash
# Check pod logs
kubectl logs -n tripo04os-production -l app=ai-support

# Check pod status
kubectl get pods -n tripo04os-production

# Describe pod
kubectl describe pod <pod-name> -n tripo04os-production
```

#### Issue: Health Check Fails

**Solution**: Check service and ingress
```bash
# Check service
kubectl get svc ai-support -n tripo04os-production

# Check ingress
kubectl get ingress -n tripo04os-production

# Test endpoint locally
kubectl port-forward svc/ai-support 8000:80 -n tripo04os-production
curl http://localhost:8000/health
```

---

**Document End**
