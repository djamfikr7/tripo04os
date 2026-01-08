"""
AI Support Automation - Configuration
Phase 1: Foundation
"""

import os
from typing import Optional
from pydantic import BaseSettings, Field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    app_name: str = "AI Support Automation"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # Server
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    workers: int = Field(default=4, env="WORKERS")
    
    # Database
    database_url: str = Field(..., env="DATABASE_URL")
    database_pool_size: int = Field(default=20, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=10, env="DATABASE_MAX_OVERFLOW")
    database_pool_timeout: int = Field(default=30, env="DATABASE_POOL_TIMEOUT")
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    redis_max_connections: int = Field(default=50, env="REDIS_MAX_CONNECTIONS")
    redis_socket_timeout: int = Field(default=5, env="REDIS_SOCKET_TIMEOUT")
    
    # Elasticsearch
    elasticsearch_url: str = Field(default="http://localhost:9200", env="ELASTICSEARCH_URL")
    elasticsearch_index: str = Field(default="knowledge-base", env="ELASTICSEARCH_INDEX")
    elasticsearch_timeout: int = Field(default=30, env="ELASTICSEARCH_TIMEOUT")
    
    # AI Models
    intent_model_path: str = Field(default="models/intent-classifier", env="INTENT_MODEL_PATH")
    response_model_path: str = Field(default="models/response-generator", env="RESPONSE_MODEL_PATH")
    sentence_transformer_path: str = Field(default="models/sentence-transformer", env="SENTENCE_TRANSFORMER_PATH")
    knowledge_base_path: str = Field(default="data/knowledge-base.json", env="KNOWLEDGE_BASE_PATH")
    
    # Model Configuration
    model_device: str = Field(default="cuda", env="MODEL_DEVICE")
    model_max_length: int = Field(default=512, env="MODEL_MAX_LENGTH")
    model_temperature: float = Field(default=0.5, env="MODEL_TEMPERATURE")
    model_top_k: int = Field(default=5, env="MODEL_TOP_K")
    model_top_p: int = Field(default=0.9, env="MODEL_TOP_P")
    
    # Performance Targets
    target_automation_rate: float = Field(default=0.8, env="TARGET_AUTOMATION_RATE")
    target_response_time_p50_ms: int = Field(default=500, env="TARGET_RESPONSE_TIME_P50_MS")
    target_response_time_p95_ms: int = Field(default=1000, env="TARGET_RESPONSE_TIME_P95_MS")
    target_response_time_p99_ms: int = Field(default=2000, env="TARGET_RESPONSE_TIME_P99_MS")
    target_confidence_score: float = Field(default=0.7, env="TARGET_CONFIDENCE_SCORE")
    
    # Escalation
    escalation_low_sentiment_threshold: float = Field(default=0.3, env="ESCALATION_LOW_SENTIMENT_THRESHOLD")
    escalation_high_priority_intents: str = Field(
        default="COMPLAINT,URGENT_ISSUE,PAYMENT_PROBLEM,SAFETY_CONCERN",
        env="ESCALATION_HIGH_PRIORITY_INTENTS"
    )
    escalation_no_knowledge_found: bool = Field(default=True, env="ESCALATION_NO_KNOWLEDGE_FOUND")
    
    # Rate Limiting
    rate_limit_user: int = Field(default=100, env="RATE_LIMIT_USER")
    rate_limit_agent: int = Field(default=500, env="RATE_LIMIT_AGENT")
    rate_limit_admin: int = Field(default=1000, env="RATE_LIMIT_ADMIN")
    
    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=30, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # External Services
    order_service_url: str = Field(default="http://order-service:8000", env="ORDER_SERVICE_URL")
    user_service_url: str = Field(default="http://user-service:8000", env="USER_SERVICE_URL")
    payment_service_url: str = Field(default="http://payment-service:8000", env="PAYMENT_SERVICE_URL")
    trip_service_url: str = Field(default="http://trip-service:8000", env="TRIP_SERVICE_URL")
    
    # Monitoring
    prometheus_url: str = Field(default="http://localhost:9090", env="PROMETHEUS_URL")
    grafana_url: str = Field(default="http://localhost:3000", env="GRAFANA_URL")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Data Retention
    conversation_retention_days: int = Field(default=730, env="CONVERSATION_RETENTION_DAYS")  # 2 years
    transcript_retention_days: int = Field(default=730, env="TRANSCRIPT_RETENTION_DAYS")  # 2 years
    feedback_retention_days: int = Field(default=365, env="FEEDBACK_RETENTION_DAYS")  # 1 year
    log_retention_days: int = Field(default=180, env="LOG_RETENTION_DAYS")  # 6 months
    
    # Performance
    max_concurrent_requests: int = Field(default=1000, env="MAX_CONCURRENT_REQUESTS")
    request_timeout_seconds: int = Field(default=30, env="REQUEST_TIMEOUT_SECONDS")
    
    # WebSocket
    websocket_ping_interval: int = Field(default=20, env="WEBSOCKET_PING_INTERVAL")
    websocket_ping_timeout: int = Field(default=60, env="WEBSOCKET_PING_TIMEOUT")
    websocket_max_connections: int = Field(default=10000, env="WEBSOCKET_MAX_CONNECTIONS")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Database configuration
DATABASE_CONFIG = {
    "pool_pre_ping": True,
    "pool_recycle": 3600,
    "echo": False,
}


# Redis configuration
REDIS_CONFIG = {
    "decode_responses": True,
    "socket_keepalive": True,
    "health_check_interval": 30,
}


# Elasticsearch configuration
ELASTICSEARCH_CONFIG = {
    "timeout": 30,
    "max_retries": 3,
    "retry_on_timeout": True,
    "retry_on_status": [502, 503, 504, 507],
}


# AI Model configuration
MODEL_CONFIG = {
    "torch_dtype": "float16",
    "device": "cuda" if os.environ.get("MODEL_DEVICE", "cuda") == "cuda" else "cpu",
    "num_workers": 4,
    "pin_memory": True,
}


# Logging configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
            "level": "INFO",
        },
    },
    "root": {
        "handlers": ["default"],
        "level": "INFO",
    },
    "loggers": {
        "uvicorn": {"level": "INFO"},
        "fastapi": {"level": "INFO"},
        "sqlalchemy": {"level": "WARNING"},
    },
}


# Security configuration
SECURITY_CONFIG = {
    "password_min_length": 8,
    "password_max_length": 128,
    "token_expiry": {
        "access": 1440,  # 24 hours
        "refresh": 30 * 24 * 60,  # 30 days
    },
}


# Rate limiting configuration
RATE_LIMIT_CONFIG = {
    "user": {
        "requests_per_minute": 100,
        "requests_per_hour": 1000,
        "requests_per_day": 10000,
    },
    "agent": {
        "requests_per_minute": 500,
        "requests_per_hour": 5000,
        "requests_per_day": 50000,
    },
    "admin": {
        "requests_per_minute": 1000,
        "requests_per_hour": 10000,
        "requests_per_day": 100000,
    },
}


# Performance monitoring configuration
PERFORMANCE_CONFIG = {
    "response_time_thresholds": {
        "p50": 500,  # ms
        "p95": 1000,  # ms
        "p99": 2000,  # ms
    },
    "confidence_thresholds": {
        "low": 0.5,
        "medium": 0.7,
        "high": 0.9,
    },
    "automation_rate_thresholds": {
        "warning": 0.7,
        "critical": 0.5,
    },
}


# Escalation configuration
ESCALATION_CONFIG = {
    "sentiment_thresholds": {
        "negative": 0.3,
        "very_negative": 0.1,
    },
    "priority_levels": {
        "low": "LOW",
        "medium": "MEDIUM",
        "high": "HIGH",
        "urgent": "URGENT",
    },
    "high_priority_intents": [
        "COMPLAINT",
        "URGENT_ISSUE",
        "PAYMENT_PROBLEM",
        "SAFETY_CONCERN",
    ],
}


# Knowledge base configuration
KNOWLEDGE_BASE_CONFIG = {
    "min_similarity_threshold": 0.7,
    "max_similarity_threshold": 0.95,
    "max_results": 5,
    "update_interval_days": 7,  # Rebuild index weekly
    "min_usage_count": 10,
    "min_success_rate": 0.8,
}


# WebSocket configuration
WEBSOCKET_CONFIG = {
    "ping_interval": 20,  # seconds
    "ping_timeout": 60,  # seconds
    "max_connections": 10000,
    "message_queue_size": 100,
    "heartbeat_interval": 60,  # seconds
}


# Monitoring configuration
MONITORING_CONFIG = {
    "metrics": {
        "business": [
            "total_conversations_per_hour",
            "ai_automation_rate",
            "human_escalation_rate",
            "average_response_time",
            "user_satisfaction_score",
            "first_contact_resolution_rate",
        ],
        "technical": [
            "api_response_time_p50",
            "api_response_time_p95",
            "api_response_time_p99",
            "ai_model_inference_time",
            "websocket_connection_count",
            "error_rate",
            "system_uptime",
            "database_query_time",
        ],
        "ai_model": [
            "intent_classification_accuracy",
            "entity_extraction_accuracy",
            "sentiment_analysis_accuracy",
            "response_relevance_score",
            "knowledge_base_hit_rate",
        ],
    },
    "alerts": {
        "critical": [
            "system_uptime < 99.5% for 5 minutes",
            "error_rate > 1% for 5 minutes",
            "api_response_time_p99 > 5s for 5 minutes",
            "ai_model_failure for 1 minute",
            "database_connection_failure",
        ],
        "warning": [
            "automation_rate < 70% for 1 hour",
            "user_satisfaction < 4.0/5.0 for 1 hour",
            "escalation_rate > 25% for 1 hour",
            "api_response_time_p95 > 2s for 15 minutes",
            "ai_confidence_score < 0.7 for 1 hour",
        ],
        "informational": [
            "daily_performance_summary",
            "weekly_automation_rate_report",
            "monthly_user_satisfaction_report",
            "model_retraining_completed",
            "knowledge_base_updated",
        ],
    },
}


# External service timeouts
EXTERNAL_SERVICE_TIMEOUTS = {
    "order_service": 5,  # seconds
    "user_service": 5,  # seconds
    "payment_service": 5,  # seconds
    "trip_service": 5,  # seconds
}


# CORS configuration
CORS_CONFIG = {
    "allow_origins": ["*"],
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}


# Pagination configuration
PAGINATION_CONFIG = {
    "default_limit": 50,
    "max_limit": 100,
    "default_offset": 0,
}


# File upload configuration
FILE_UPLOAD_CONFIG = {
    "max_file_size_mb": 10,
    "allowed_extensions": [".pdf", ".doc", ".docx", ".txt", ".jpg", ".png", ".wav", ".mp3"],
    "upload_timeout_seconds": 300,
}


# Cache configuration
CACHE_CONFIG = {
    "knowledge_base_ttl_seconds": 3600,  # 1 hour
    "user_profile_ttl_seconds": 300,  # 5 minutes
    "agent_status_ttl_seconds": 60,  # 1 minute
}


# Feature flags
FEATURE_FLAGS = {
    "enable_voice_support": True,
    "enable_multilingual_support": True,
    "enable_sentiment_analysis": True,
    "enable_entity_extraction": True,
    "enable_knowledge_retrieval": True,
    "enable_escalation": True,
    "enable_feedback_collection": True,
    "enable_performance_monitoring": True,
}


# Supported languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese",
    "ja": "Japanese",
}
