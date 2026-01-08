.PHONY: help install dev test lint format clean build deploy migrate backup restore health logs shell db-shell redis-shell

# Default target
help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Run development server"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linters"
	@echo "  make format        - Format code"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make build         - Build Docker image"
	@echo "  make deploy        - Deploy to Kubernetes"
	@echo "  make migrate       - Run database migrations"
	@echo "  make backup        - Backup database"
	@echo "  make restore       - Restore database from backup"
	@echo "  make health        - Check health status"
	@echo "  make logs          - View application logs"
	@echo "  make shell         - Open application shell"
	@echo "  make db-shell      - Open database shell"
	@echo "  make redis-shell   - Open Redis shell"

# Installation
install:
	@echo "Installing dependencies..."
	pip install -r requirements.txt
	pip install -r requirements-dev.txt
	@echo "Dependencies installed successfully!"

# Development
dev:
	@echo "Starting development server..."
	uvicorn api:app --host 0.0.0.0 --port 8000 --reload --log-level info

# Testing
test:
	@echo "Running tests..."
	pytest tests/ -v --cov=. --cov-report=html --cov-report=term-missing

test-unit:
	@echo "Running unit tests..."
	pytest tests/ -v -m unit --cov=. --cov-report=term-missing

test-integration:
	@echo "Running integration tests..."
	pytest tests/ -v -m integration --cov=. --cov-report=term-missing

test-e2e:
	@echo "Running end-to-end tests..."
	pytest tests/ -v -m e2e --cov=. --cov-report=term-missing

test-coverage:
	@echo "Running tests with coverage report..."
	pytest tests/ -v --cov=. --cov-report=html --cov-report=xml --cov-report=term-missing
	@echo "Coverage report generated in htmlcov/"

# Linting
lint:
	@echo "Running linters..."
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	mypy . --ignore-missing-imports
	pylint api/ ai_engine/ core_models/ database/ config/

# Formatting
format:
	@echo "Formatting code..."
	black .
	isort .
	@echo "Code formatted successfully!"

format-check:
	@echo "Checking code format..."
	black --check .
	isort --check-only .

# Cleaning
clean:
	@echo "Cleaning build artifacts..."
	find . -type f -name '*.pyc' -delete
	find . -type d -name '__pycache__' -delete
	find . -type d -name '*.egg-info' -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name '.pytest_cache' -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name 'htmlcov' -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name '.mypy_cache' -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name '.coverage' -delete
	find . -type f -name 'coverage.xml' -delete
	rm -rf build/ dist/
	@echo "Clean completed!"

# Docker
build:
	@echo "Building Docker image..."
	docker build -t tripo04os-ai-support:latest .
	@echo "Docker image built successfully!"

build-dev:
	@echo "Building development Docker image..."
	docker build -f Dockerfile.dev -t tripo04os-ai-support:dev .
	@echo "Development Docker image built successfully!"

docker-run:
	@echo "Running Docker container..."
	docker run -p 8000:8000 --env-file .env tripo04os-ai-support:latest

docker-stop:
	@echo "Stopping Docker containers..."
	docker stop $$(docker ps -q --filter ancestor=tripo04os-ai-support:latest) || true

docker-clean:
	@echo "Cleaning Docker resources..."
	docker system prune -f

# Docker Compose
compose-up:
	@echo "Starting services with Docker Compose..."
	docker-compose up -d

compose-down:
	@echo "Stopping services with Docker Compose..."
	docker-compose down

compose-logs:
	@echo "Viewing Docker Compose logs..."
	docker-compose logs -f

# Kubernetes
deploy:
	@echo "Deploying to Kubernetes..."
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/deployment.yaml
	@echo "Deployment completed!"

deploy-dev:
	@echo "Deploying to development environment..."
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/deployment.yaml --context=dev
	@echo "Development deployment completed!"

deploy-staging:
	@echo "Deploying to staging environment..."
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/deployment.yaml --context=staging
	@echo "Staging deployment completed!"

deploy-prod:
	@echo "Deploying to production environment..."
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/deployment.yaml --context=prod
	@echo "Production deployment completed!"

kubectl-logs:
	@echo "Viewing Kubernetes logs..."
	kubectl logs -f -l app=tripo04os,component=ai-support -n tripo04os

kubectl-scale:
	@echo "Scaling Kubernetes deployment..."
	kubectl scale deployment tripo04os-ai-support --replicas=5 -n tripo04os

# Database Migrations
migrate:
	@echo "Running database migrations..."
	alembic upgrade head
	@echo "Migrations completed!"

migrate-create:
	@echo "Creating new migration..."
	alembic revision --autogenerate -m "$(message)"
	@echo "Migration created!"

migrate-rollback:
	@echo "Rolling back last migration..."
	alembic downgrade -1
	@echo "Rollback completed!"

# Database Operations
backup:
	@echo "Backing up database..."
	@mkdir -p backups
	pg_dump $${DATABASE_URL} > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup completed!"

restore:
	@echo "Restoring database from backup..."
	@if [ -z "$(file)" ]; then echo "Error: Please specify backup file with file=path/to/backup.sql"; exit 1; fi
	psql $${DATABASE_URL} < $(file)
	@echo "Restore completed!"

db-init:
	@echo "Initializing database..."
	python -c "from database import init_database; import asyncio; asyncio.run(init_database())"
	@echo "Database initialized!"

db-migrate:
	@echo "Running database migrations..."
	alembic upgrade head
	@echo "Migrations completed!"

# Redis Operations
redis-flush:
	@echo "Flushing Redis cache..."
	redis-cli -u $${REDIS_URL} FLUSHALL
	@echo "Redis cache flushed!"

# Health Checks
health:
	@echo "Checking health status..."
	curl -f http://localhost:8000/health || exit 1
	@echo "Health check passed!"

health-detailed:
	@echo "Checking detailed health status..."
	curl -f http://localhost:8000/health || exit 1
	curl -f http://localhost:8000/health/ready || exit 1
	curl -f http://localhost:8000/health/live || exit 1
	@echo "All health checks passed!"

# Logs
logs:
	@echo "Viewing application logs..."
	tail -f logs/app.log

logs-error:
	@echo "Viewing error logs..."
	tail -f logs/error.log

# Shells
shell:
	@echo "Opening application shell..."
	docker exec -it $$(docker ps -q --filter ancestor=tripo04os-ai-support:latest) /bin/bash

db-shell:
	@echo "Opening database shell..."
	psql $${DATABASE_URL}

redis-shell:
	@echo "Opening Redis shell..."
	redis-cli -u $${REDIS_URL}

# Monitoring
metrics:
	@echo "Fetching metrics..."
	curl http://localhost:8000/metrics

prometheus-start:
	@echo "Starting Prometheus..."
	docker run -d -p 9090:9090 -v $$(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus

grafana-start:
	@echo "Starting Grafana..."
	docker run -d -p 3000:3000 grafana/grafana

# Security
security-scan:
	@echo "Running security scan..."
	bandit -r . -f json -o security-report.json
	@echo "Security scan completed!"

dependency-check:
	@echo "Checking for vulnerable dependencies..."
	safety check --json > dependency-report.json
	@echo "Dependency check completed!"

# Documentation
docs:
	@echo "Generating documentation..."
	pdoc --html api/ ai_engine/ core_models/ database/ config/ -o docs/
	@echo "Documentation generated in docs/"

docs-serve:
	@echo "Serving documentation..."
	pdoc --http 0.0.0.0:8080 api/ ai_engine/ core_models/ database/ config/

# Performance
profile:
	@echo "Running performance profiler..."
	python -m cProfile -o profile.stats -m pytest tests/
	@echo "Profile saved to profile.stats"

load-test:
	@echo "Running load tests..."
	locust -f tests/load_test.py --host=http://localhost:8000

# CI/CD
ci-test:
	@echo "Running CI tests..."
	pytest tests/ -v --cov=. --cov-report=xml --junitxml=test-results.xml
	@echo "CI tests completed!"

ci-lint:
	@echo "Running CI linting..."
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	mypy . --ignore-missing-imports
	@echo "CI linting completed!"

ci-build:
	@echo "Running CI build..."
	docker build -t tripo04os-ai-support:ci-test .
	@echo "CI build completed!"

# Release
release:
	@echo "Creating release..."
	@read -p "Enter version number: " version; \
	git tag -a v$$version -m "Release v$$version"; \
	git push origin v$$version; \
	docker build -t tripo04os-ai-support:$$version .; \
	docker tag tripo04os-ai-support:$$version tripo04os-ai-support:latest; \
	docker push tripo04os-ai-support:$$version; \
	docker push tripo04os-ai-support:latest

# Utility
version:
	@echo "AI Support System Version: 1.0.0"

env-check:
	@echo "Checking environment variables..."
	@echo "DATABASE_URL: $${DATABASE_URL:+SET}"
	@echo "REDIS_URL: $${REDIS_URL:+SET}"
	@echo "ELASTICSEARCH_URL: $${ELASTICSEARCH_URL:+SET}"
	@echo "SECRET_KEY: $${SECRET_KEY:+SET}"

setup:
	@echo "Setting up development environment..."
	@echo "1. Copy .env.example to .env"
	@echo "2. Edit .env with your configuration"
	@echo "3. Run 'make install' to install dependencies"
	@echo "4. Run 'make db-init' to initialize database"
	@echo "5. Run 'make dev' to start development server"

# All-in-one
all: clean install test lint build
	@echo "All tasks completed successfully!"
