# Makefile for Profit Optimization Engine
# Provides commands for development, testing, building, and deployment

.PHONY: help install dev test build deploy clean lint format

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Profit Optimization Engine - Available Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Installation
install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pip install -r requirements.txt

install-dev: ## Install development dependencies
	@echo "$(BLUE)Installing development dependencies...$(NC)"
	pip install -r requirements-dev.txt

# Development
dev: ## Run development server
	@echo "$(BLUE)Starting development server...$(NC)"
	uvicorn api:app --host 0.0.0.0 --port 8002 --reload --log-level debug

dev-docker: ## Run development server in Docker
	@echo "$(BLUE)Starting development server in Docker...$(NC)"
	docker-compose -f docker-compose.yml up --build

# Testing
test: ## Run tests
	@echo "$(BLUE)Running tests...$(NC)"
	pytest tests/ -v

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	pytest tests/ -v --cov=. --cov-report=html --cov-report=term

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	pytest tests/ -v -m "not integration and not e2e"

test-integration: ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(NC)"
	pytest tests/ -v -m integration

test-e2e: ## Run end-to-end tests only
	@echo "$(BLUE)Running end-to-end tests...$(NC)"
	pytest tests/ -v -m e2e

# Code Quality
lint: ## Run linter
	@echo "$(BLUE)Running linter...$(NC)"
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

format: ## Format code with black
	@echo "$(BLUE)Formatting code...$(NC)"
	black .
	isort .

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	black --check .
	isort --check-only .

type-check: ## Run type checking with mypy
	@echo "$(BLUE)Running type checking...$(NC)"
	mypy .

# Building
build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t tripo04os/profit-optimization-engine:latest .

build-tag: ## Build Docker image with tag
	@echo "$(BLUE)Building Docker image with tag $(TAG)...$(NC)"
	docker build -t tripo04os/profit-optimization-engine:$(TAG) .

# Docker Operations
docker-push: ## Push Docker image to registry
	@echo "$(BLUE)Pushing Docker image to registry...$(NC)"
	docker push tripo04os/profit-optimization-engine:latest

docker-push-tag: ## Push Docker image with tag to registry
	@echo "$(BLUE)Pushing Docker image with tag $(TAG) to registry...$(NC)"
	docker push tripo04os/profit-optimization-engine:$(TAG)

docker-run: ## Run Docker container
	@echo "$(BLUE)Running Docker container...$(NC)"
	docker run -p 8002:8002 tripo04os/profit-optimization-engine:latest

docker-stop: ## Stop all running containers
	@echo "$(BLUE)Stopping all running containers...$(NC)"
	docker stop $$(docker ps -q)

docker-clean: ## Remove all stopped containers and unused images
	@echo "$(BLUE)Cleaning up Docker...$(NC)"
	docker system prune -f

# Kubernetes Operations
k8s-apply: ## Apply Kubernetes manifests
	@echo "$(BLUE)Applying Kubernetes manifests...$(NC)"
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/deployment.yaml

k8s-delete: ## Delete Kubernetes resources
	@echo "$(BLUE)Deleting Kubernetes resources...$(NC)"
	kubectl delete -f k8s/deployment.yaml
	kubectl delete -f k8s/namespace.yaml

k8s-logs: ## Show logs from Kubernetes pods
	@echo "$(BLUE)Showing logs from Kubernetes pods...$(NC)"
	kubectl logs -f -l app=profit-optimization-engine -n tripo04os-profit-optimization

k8s-scale: ## Scale Kubernetes deployment
	@echo "$(BLUE)Scaling Kubernetes deployment to $(REPLICAS) replicas...$(NC)"
	kubectl scale deployment profit-optimization-engine --replicas=$(REPLICAS) -n tripo04os-profit-optimization

k8s-restart: ## Restart Kubernetes deployment
	@echo "$(BLUE)Restarting Kubernetes deployment...$(NC)"
	kubectl rollout restart deployment profit-optimization-engine -n tripo04os-profit-optimization

k8s-status: ## Show status of Kubernetes resources
	@echo "$(BLUE)Showing status of Kubernetes resources...$(NC)"
	kubectl get all -n tripo04os-profit-optimization

# Deployment
deploy-staging: ## Deploy to staging environment
	@echo "$(BLUE)Deploying to staging environment...$(NC)"
	$(MAKE) build TAG=staging
	docker tag tripo04os/profit-optimization-engine:staging tripo04os/profit-optimization-engine:staging
	$(MAKE) docker-push-tag TAG=staging
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/deployment.yaml

deploy-production: ## Deploy to production environment
	@echo "$(BLUE)Deploying to production environment...$(NC)"
	$(MAKE) build TAG=production
	docker tag tripo04os/profit-optimization-engine:production tripo04os/profit-optimization-engine:production
	$(MAKE) docker-push-tag TAG=production
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/deployment.yaml

# Database Operations
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	alembic upgrade head

db-rollback: ## Rollback database migrations
	@echo "$(BLUE)Rolling back database migrations...$(NC)"
	alembic downgrade -1

db-reset: ## Reset database
	@echo "$(BLUE)Resetting database...$(NC)"
	alembic downgrade base
	alembic upgrade head

# Monitoring
monitor: ## Show monitoring metrics
	@echo "$(BLUE)Showing monitoring metrics...$(NC)"
	kubectl port-forward -n tripo04os-profit-optimization svc/prometheus 9090:9090 &
	@echo "Prometheus available at http://localhost:9090"

grafana: ## Show Grafana dashboard
	@echo "$(BLUE)Showing Grafana dashboard...$(NC)"
	kubectl port-forward -n tripo04os-profit-optimization svc/grafana 3000:3000 &
	@echo "Grafana available at http://localhost:3000"

# Documentation
docs: ## Generate API documentation
	@echo "$(BLUE)Generating API documentation...$(NC)"
	python -c "from api import app; app.openapi()" > openapi.json

docs-serve: ## Serve API documentation
	@echo "$(BLUE)Serving API documentation...$(NC)"
	python -m http.server 8000 --directory docs

# Cleanup
clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name '*.pyc' -delete
	find . -type f -name '*.pyo' -delete
	find . -type f -name '*.pyd' -delete
	find . -type f -name '.DS_Store' -delete
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info

clean-all: clean ## Clean everything including Docker
	@echo "$(BLUE)Cleaning everything including Docker...$(NC)"
	$(MAKE) docker-clean
	rm -rf .mypy_cache

# Utilities
version: ## Show version
	@echo "$(BLUE)Profit Optimization Engine v1.0.0$(NC)"

health: ## Check service health
	@echo "$(BLUE)Checking service health...$(NC)"
	curl -f http://localhost:8002/health || echo "$(RED)Service is not healthy$(NC)"

benchmark: ## Run performance benchmarks
	@echo "$(BLUE)Running performance benchmarks...$(NC)"
	python scripts/benchmark.py

# CI/CD
ci: ## Run CI checks
	@echo "$(BLUE)Running CI checks...$(NC)"
	$(MAKE) lint
	$(MAKE) format-check
	$(MAKE) type-check
	$(MAKE) test-coverage

ci-fast: ## Run fast CI checks
	@echo "$(BLUE)Running fast CI checks...$(NC)"
	$(MAKE) lint
	$(MAKE) test-unit
