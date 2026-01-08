# AI Support Automation - Dockerfile
# Phase 1: Foundation
# Innovation: AI-Powered Support Automation
# Multi-stage build for production deployment

# Stage 1: Builder
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODED=1 \
    PYTHUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir /root/.cache -r requirements.txt

# Copy application code
COPY . .

# Stage 2: Production
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN useradd -m -u appuser appuser
USER appuser

# Set environment variables
ENV PYTHONDONTWRITEBYTECODED=1 \
    PYTHUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Copy Python dependencies and application from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

# Create necessary directories
RUN mkdir -p /app/logs \
    /app/data \
    /app/models \
    /app/uploads \
    /app/temp

# Set permissions
RUN chown -R appuser:appuser /app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "ai_support_implementation.api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--log-level", "info"]

# Labels for metadata
LABEL maintainer="Tripo04OS Team" \
      version="1.0.0" \
      description="AI-Powered Support Automation System" \
      name="tripo04os-ai-support" \
      org.opencontainers.image.source="https://github.com/tripo04os/ai-support" \
      org.opencontainers.image.revision="v1.0.0"
