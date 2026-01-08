"""
Pytest configuration and fixtures for AI Support System tests
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import Mock, AsyncMock, MagicMock
import redis.asyncio as redis
import tempfile
import os
from pathlib import Path

# Import models and configuration
from core_models import (
    Base,
    SupportConversation,
    SupportMessage,
    AIKnowledgeBase,
    AIResponseFeedback,
    SupportAgent,
    EscalationRule,
    AIPerformanceMetrics
)
from config import Settings
from database import init_database, init_redis, get_db_session, get_redis


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """
    Create an instance of the default event loop for the test session.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """
    Create test settings with in-memory database and mock services.
    """
    return Settings(
        database_url="sqlite+aiosqlite:///:memory:",
        redis_url="redis://localhost:6379/15",
        elasticsearch_url="http://localhost:9200",
        secret_key="test-secret-key-for-testing-only",
        model_device="cpu",
        api_host="127.0.0.1",
        api_port=8001,
        log_level="DEBUG",
        workers=1,
        target_automation_rate=0.8,
        target_response_time_p50_ms=500,
        target_response_time_p95_ms=1000,
        target_response_time_p99_ms=2000,
        target_confidence_score=0.7,
        escalation_negative_threshold=-0.5,
        escalation_positive_threshold=0.8,
        escalation_confidence_threshold=0.5,
        escalation_timeout_seconds=300,
        rate_limit_per_minute=100,
        rate_limit_burst=20,
        enable_rate_limiting=True,
        enable_caching=True,
        cache_ttl_seconds=3600,
        enable_encryption=True,
        encryption_key="test-encryption-key-32-bytes-long",
        enable_anonymization=True,
        retention_days_conversations=90,
        retention_days_messages=90,
        retention_days_feedback=365,
        retention_days_metrics=730,
        websocket_enabled=True,
        websocket_max_connections=100,
        websocket_ping_interval=20,
        websocket_ping_timeout=30,
        performance_profiling_enabled=True,
        performance_sampling_rate=0.1
    )


@pytest.fixture(scope="function")
async def test_engine(test_settings: Settings) -> AsyncGenerator:
    """
    Create an async database engine for testing.
    """
    engine = create_async_engine(
        test_settings.database_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop all tables after test
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Create an async database session for testing.
    """
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session


@pytest.fixture(scope="function")
async def mock_redis() -> AsyncMock:
    """
    Create a mock Redis client for testing.
    """
    mock_client = AsyncMock(spec=redis.Redis)
    mock_client.get.return_value = None
    mock_client.set.return_value = True
    mock_client.delete.return_value = 1
    mock_client.exists.return_value = 0
    mock_client.expire.return_value = True
    mock_client.incr.return_value = 1
    mock_client.ttl.return_value = 3600
    return mock_client


@pytest.fixture(scope="function")
def mock_elasticsearch() -> Mock:
    """
    Create a mock Elasticsearch client for testing.
    """
    mock_client = Mock()
    mock_client.index.return_value = {"result": "created"}
    mock_client.search.return_value = {
        "hits": {
            "hits": []
        }
    }
    mock_client.update.return_value = {"result": "updated"}
    mock_client.delete.return_value = {"result": "deleted"}
    return mock_client


@pytest.fixture(scope="function")
def mock_ai_models() -> Mock:
    """
    Create mock AI models for testing.
    """
    mock_models = Mock()
    
    # Mock intent classifier
    mock_models.intent_classifier = Mock()
    mock_models.intent_classifier.return_value = {
        "intent": "refund_request",
        "confidence": 0.85
    }
    
    # Mock entity extractor
    mock_models.entity_extractor = Mock()
    mock_models.entity_extractor.return_value = {
        "entities": [
            {"type": "amount", "value": "50.00", "confidence": 0.9},
            {"type": "order_id", "value": "ORD12345", "confidence": 0.95}
        ]
    }
    
    # Mock sentiment analyzer
    mock_models.sentiment_analyzer = Mock()
    mock_models.sentiment_analyzer.return_value = {
        "sentiment": "negative",
        "score": -0.6,
        "confidence": 0.8
    }
    
    # Mock knowledge retriever
    mock_models.knowledge_retriever = Mock()
    mock_models.knowledge_retriever.return_value = [
        {
            "id": "KB001",
            "content": "Refund policy allows refunds within 30 days",
            "category": "refunds",
            "score": 0.9
        }
    ]
    
    # Mock response generator
    mock_models.response_generator = Mock()
    mock_models.response_generator.return_value = {
        "response": "I can help you with your refund request. Based on our policy, you can request a refund within 30 days of your order.",
        "confidence": 0.85,
        "sources": ["KB001"]
    }
    
    return mock_models


@pytest.fixture(scope="function")
def sample_conversation_data() -> dict:
    """
    Create sample conversation data for testing.
    """
    return {
        "user_id": "user123",
        "user_type": "customer",
        "service_type": "RIDE",
        "language": "en",
        "initial_message": "I need a refund for my ride",
        "status": "open"
    }


@pytest.fixture(scope="function")
def sample_message_data() -> dict:
    """
    Create sample message data for testing.
    """
    return {
        "role": "user",
        "content": "I need a refund for my ride",
        "message_type": "text"
    }


@pytest.fixture(scope="function")
def sample_knowledge_base_data() -> dict:
    """
    Create sample knowledge base data for testing.
    """
    return {
        "category": "refunds",
        "question": "How do I request a refund?",
        "answer": "You can request a refund within 30 days of your order through the app or by contacting support.",
        "language": "en",
        "service_types": ["RIDE", "FOOD"],
        "is_active": True
    }


@pytest.fixture(scope="function")
def sample_feedback_data() -> dict:
    """
    Create sample feedback data for testing.
    """
    return {
        "rating": 5,
        "helpful": True,
        "comment": "Very helpful response"
    }


@pytest.fixture(scope="function")
def sample_agent_data() -> dict:
    """
    Create sample agent data for testing.
    """
    return {
        "agent_id": "agent123",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "specialties": ["refunds", "billing"],
        "max_concurrent_conversations": 5,
        "is_available": True
    }


@pytest.fixture(scope="function")
def sample_escalation_rule_data() -> dict:
    """
    Create sample escalation rule data for testing.
    """
    return {
        "rule_name": "Negative Sentiment Escalation",
        "condition_type": "sentiment",
        "condition_value": -0.5,
        "operator": "<=",
        "priority": 1,
        "action": "escalate_to_agent",
        "target_agent_specialty": "refunds"
    }


@pytest.fixture(scope="function")
def sample_metrics_data() -> dict:
    """
    Create sample metrics data for testing.
    """
    return {
        "total_conversations": 100,
        "automated_conversations": 80,
        "escalated_conversations": 20,
        "avg_response_time_ms": 500,
        "p50_response_time_ms": 450,
        "p95_response_time_ms": 800,
        "p99_response_time_ms": 1200,
        "avg_confidence_score": 0.75,
        "user_satisfaction_score": 4.2
    }


@pytest.fixture(scope="function")
async def test_conversation(test_session: AsyncSession, sample_conversation_data: dict) -> SupportConversation:
    """
    Create a test conversation in the database.
    """
    conversation = SupportConversation(**sample_conversation_data)
    test_session.add(conversation)
    await test_session.commit()
    await test_session.refresh(conversation)
    return conversation


@pytest.fixture(scope="function")
async def test_message(test_session: AsyncSession, test_conversation: SupportConversation, sample_message_data: dict) -> SupportMessage:
    """
    Create a test message in the database.
    """
    message = SupportMessage(
        conversation_id=test_conversation.conversation_id,
        **sample_message_data
    )
    test_session.add(message)
    await test_session.commit()
    await test_session.refresh(message)
    return message


@pytest.fixture(scope="function")
async def test_knowledge_base(test_session: AsyncSession, sample_knowledge_base_data: dict) -> AIKnowledgeBase:
    """
    Create a test knowledge base entry in the database.
    """
    kb_entry = AIKnowledgeBase(**sample_knowledge_base_data)
    test_session.add(kb_entry)
    await test_session.commit()
    await test_session.refresh(kb_entry)
    return kb_entry


@pytest.fixture(scope="function")
async def test_agent(test_session: AsyncSession, sample_agent_data: dict) -> SupportAgent:
    """
    Create a test agent in the database.
    """
    agent = SupportAgent(**sample_agent_data)
    test_session.add(agent)
    await test_session.commit()
    await test_session.refresh(agent)
    return agent


@pytest.fixture(scope="function")
async def test_escalation_rule(test_session: AsyncSession, sample_escalation_rule_data: dict) -> EscalationRule:
    """
    Create a test escalation rule in the database.
    """
    rule = EscalationRule(**sample_escalation_rule_data)
    test_session.add(rule)
    await test_session.commit()
    await test_session.refresh(rule)
    return rule


@pytest.fixture(scope="function")
def temp_upload_dir() -> Generator[Path, None, None]:
    """
    Create a temporary directory for file uploads during testing.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture(scope="function")
def sample_image_file(temp_upload_dir: Path) -> Path:
    """
    Create a sample image file for testing.
    """
    image_path = temp_upload_dir / "test_image.jpg"
    # Create a minimal valid JPEG file
    with open(image_path, "wb") as f:
        f.write(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x03\x02\x02\x03\x02\x02\x03\x03\x03\x03\x04\x03\x03\x04\x05\x08\x05\x05\x04\x04\x05\n\x07\x07\x06\x08\x0c\n\x0c\x0c\x0b\n\x0b\x0b\r\x0e\x12\x10\r\x0e\x11\x0e\x0b\x0b\x10\x16\x10\x11\x13\x14\x15\x15\x15\x0c\x0f\x17\x18\x16\x14\x18\x12\x14\x15\x14\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07\"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00T\x9f\xff\xd9")
    return image_path


@pytest.fixture(scope="function")
def sample_audio_file(temp_upload_dir: Path) -> Path:
    """
    Create a sample audio file for testing.
    """
    audio_path = temp_upload_dir / "test_audio.wav"
    # Create a minimal valid WAV file
    with open(audio_path, "wb") as f:
        # WAV header
        f.write(b"RIFF")
        f.write((36).to_bytes(4, 'little'))  # file size - 8
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write((16).to_bytes(4, 'little'))  # chunk size
        f.write((1).to_bytes(2, 'little'))  # audio format (PCM)
        f.write((1).to_bytes(2, 'little'))  # num channels
        f.write((8000).to_bytes(4, 'little'))  # sample rate
        f.write((16000).to_bytes(4, 'little'))  # byte rate
        f.write((2).to_bytes(2, 'little'))  # block align
        f.write((16).to_bytes(2, 'little'))  # bits per sample
        f.write(b"data")
        f.write((0).to_bytes(4, 'little'))  # data size
    return audio_path
