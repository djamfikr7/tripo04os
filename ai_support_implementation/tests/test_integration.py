"""
Integration tests for AI Support System
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from core_models import (
    SupportConversation,
    SupportMessage,
    AIKnowledgeBase,
    AIResponseFeedback,
    SupportAgent,
    EscalationRule,
    AIPerformanceMetrics,
    ConversationStatus,
    MessageRole,
    MessageType
)
from ai_engine import AIEngine
from api import app
from fastapi.testclient import TestClient


@pytest.mark.asyncio
class TestDatabaseIntegration:
    """Test database integration"""
    
    async def test_conversation_lifecycle(self, test_session: AsyncSession):
        """Test complete conversation lifecycle in database"""
        # Create conversation
        conversation = SupportConversation(
            user_id="user123",
            user_type="customer",
            service_type="RIDE",
            language="en",
            initial_message="I need help",
            status=ConversationStatus.OPEN
        )
        test_session.add(conversation)
        await test_session.commit()
        await test_session.refresh(conversation)
        
        # Add messages
        for i in range(3):
            message = SupportMessage(
                conversation_id=conversation.conversation_id,
                role=MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT,
                content=f"Message {i+1}",
                message_type=MessageType.TEXT
            )
            test_session.add(message)
        
        await test_session.commit()
        
        # Verify messages
        from sqlalchemy import select
        result = await test_session.execute(
            select(SupportMessage).where(
                SupportMessage.conversation_id == conversation.conversation_id
            )
        )
        messages = result.scalars().all()
        
        assert len(messages) == 3
        
        # Close conversation
        conversation.status = ConversationStatus.CLOSED
        conversation.closed_at = datetime.utcnow()
        conversation.resolution = "Resolved"
        await test_session.commit()
        
        # Verify closure
        await test_session.refresh(conversation)
        assert conversation.status == ConversationStatus.CLOSED
        assert conversation.resolution == "Resolved"
    
    async def test_knowledge_base_crud(self, test_session: AsyncSession):
        """Test CRUD operations on knowledge base"""
        # Create knowledge entry
        kb_entry = AIKnowledgeBase(
            category="refunds",
            question="How do I request a refund?",
            answer="You can request a refund within 30 days",
            language="en",
            service_types=["RIDE", "FOOD"],
            is_active=True
        )
        test_session.add(kb_entry)
        await test_session.commit()
        await test_session.refresh(kb_entry)
        
        # Read
        from sqlalchemy import select
        result = await test_session.execute(
            select(AIKnowledgeBase).where(
                AIKnowledgeBase.kb_id == kb_entry.kb_id
            )
        )
        retrieved = result.scalar_one_or_none()
        
        assert retrieved is not None
        assert retrieved.category == "refunds"
        
        # Update
        retrieved.answer = "Updated answer"
        await test_session.commit()
        await test_session.refresh(retrieved)
        
        assert "Updated" in retrieved.answer
        
        # Delete
        await test_session.delete(retrieved)
        await test_session.commit()
        
        result = await test_session.execute(
            select(AIKnowledgeBase).where(
                AIKnowledgeBase.kb_id == kb_entry.kb_id
            )
        )
        deleted = result.scalar_one_or_none()
        
        assert deleted is None
    
    async def test_agent_management(self, test_session: AsyncSession):
        """Test agent management in database"""
        # Create agent
        agent = SupportAgent(
            agent_id="agent123",
            name="John Doe",
            email="john@example.com",
            specialties=["refunds", "billing"],
            max_concurrent_conversations=5,
            is_available=True
        )
        test_session.add(agent)
        await test_session.commit()
        await test_session.refresh(agent)
        
        # Assign conversation
        conversation = SupportConversation(
            user_id="user456",
            user_type="customer",
            service_type="RIDE",
            language="en",
            initial_message="I need help",
            status=ConversationStatus.OPEN
        )
        test_session.add(conversation)
        await test_session.commit()
        await test_session.refresh(conversation)
        
        conversation.assigned_agent_id = agent.agent_id
        conversation.status = ConversationStatus.IN_PROGRESS
        await test_session.commit()
        
        # Verify assignment
        await test_session.refresh(conversation)
        assert conversation.assigned_agent_id == agent.agent_id
        assert conversation.status == ConversationStatus.IN_PROGRESS
    
    async def test_feedback_recording(self, test_session: AsyncSession):
        """Test recording and retrieving feedback"""
        # Create conversation and message
        conversation = SupportConversation(
            user_id="user789",
            user_type="customer",
            service_type="RIDE",
            language="en",
            initial_message="Test",
            status=ConversationStatus.OPEN
        )
        test_session.add(conversation)
        await test_session.commit()
        await test_session.refresh(conversation)
        
        message = SupportMessage(
            conversation_id=conversation.conversation_id,
            role=MessageRole.ASSISTANT,
            content="Response",
            message_type=MessageType.TEXT
        )
        test_session.add(message)
        await test_session.commit()
        await test_session.refresh(message)
        
        # Record feedback
        feedback = AIResponseFeedback(
            conversation_id=conversation.conversation_id,
            message_id=message.message_id,
            rating=5,
            helpful=True,
            comment="Very helpful"
        )
        test_session.add(feedback)
        await test_session.commit()
        await test_session.refresh(feedback)
        
        # Verify feedback
        from sqlalchemy import select
        result = await test_session.execute(
            select(AIResponseFeedback).where(
                AIResponseFeedback.message_id == message.message_id
            )
        )
        retrieved = result.scalar_one_or_none()
        
        assert retrieved is not None
        assert retrieved.rating == 5
        assert retrieved.helpful is True


@pytest.mark.asyncio
class TestAIEngineIntegration:
    """Test AI Engine integration with database and external services"""
    
    @pytest.fixture
    async def ai_engine(self, test_session: AsyncSession, mock_redis, mock_elasticsearch):
        """Create an AI engine instance"""
        engine = AIEngine(
            db_session=test_session,
            redis_client=mock_redis,
            elasticsearch_client=mock_elasticsearch
        )
        return engine
    
    async def test_full_conversation_flow(self, ai_engine: AIEngine):
        """Test complete conversation flow from creation to closure"""
        # Create conversation
        conversation = SupportConversation(
            user_id="user123",
            user_type="customer",
            service_type="RIDE",
            language="en",
            initial_message="I need a refund",
            status=ConversationStatus.OPEN
        )
        ai_engine.db_session.add(conversation)
        await ai_engine.db_session.commit()
        await ai_engine.db_session.refresh(conversation)
        
        # Process multiple messages
        messages = [
            "I need a refund for my ride",
            "The ride was on January 1st",
            "The order number is ORD12345"
        ]
        
        responses = []
        for msg in messages:
            response = await ai_engine.process_message(
                conversation_id=conversation.conversation_id,
                message=msg,
                message_type="text",
                user_id=conversation.user_id
            )
            responses.append(response)
        
        # Verify responses
        for response in responses:
            assert response is not None
            assert "response" in response
            assert "confidence" in response
        
        # Record feedback
        history = await ai_engine.get_conversation_history(conversation.conversation_id)
        if history:
            await ai_engine.record_feedback(
                conversation_id=conversation.conversation_id,
                message_id=history[-1].message_id,
                rating=5,
                helpful=True
            )
        
        # Close conversation
        result = await ai_engine.close_conversation(
            conversation_id=conversation.conversation_id,
            resolution="Refund processed"
        )
        
        assert result is True
        
        # Verify closure
        await ai_engine.db_session.refresh(conversation)
        assert conversation.status == ConversationStatus.CLOSED
    
    async def test_escalation_flow(self, ai_engine: AIEngine):
        """Test escalation flow from AI to human agent"""
        # Create agent
        agent = SupportAgent(
            agent_id="agent123",
            name="John Doe",
            email="john@example.com",
            specialties=["refunds"],
            max_concurrent_conversations=5,
            is_available=True
        )
        ai_engine.db_session.add(agent)
        
        # Create escalation rule
        rule = EscalationRule(
            rule_name="Negative Sentiment",
            condition_type="sentiment",
            condition_value=-0.5,
            operator="<=",
            priority=1,
            action="escalate_to_agent",
            target_agent_specialty="refunds"
        )
        ai_engine.db_session.add(rule)
        
        # Create conversation
        conversation = SupportConversation(
            user_id="user456",
            user_type="customer",
            service_type="RIDE",
            language="en",
            initial_message="I'm angry",
            status=ConversationStatus.OPEN
        )
        ai_engine.db_session.add(conversation)
        await ai_engine.db_session.commit()
        await ai_engine.db_session.refresh(conversation)
        
        # Process negative message
        response = await ai_engine.process_message(
            conversation_id=conversation.conversation_id,
            message="This is terrible, I'm furious!",
            message_type="text",
            user_id=conversation.user_id
        )
        
        # Verify escalation
        assert response["escalated"] is True
        
        # Verify agent assignment
        await ai_engine.db_session.refresh(conversation)
        assert conversation.assigned_agent_id == agent.agent_id
        assert conversation.status == ConversationStatus.ESCALATED
    
    async def test_knowledge_base_integration(self, ai_engine: AIEngine):
        """Test knowledge base integration with AI engine"""
        # Add knowledge
        kb_entry = await ai_engine.knowledge_manager.add_knowledge(
            category="refunds",
            question="How do I request a refund?",
            answer="You can request a refund within 30 days",
            language="en",
            service_types=["RIDE", "FOOD"],
            is_active=True
        )
        
        # Search knowledge
        results = await ai_engine.knowledge_manager.search_knowledge(
            query="refund policy",
            category="refunds",
            language="en",
            limit=5
        )
        
        # Verify search results
        assert results is not None
        assert isinstance(results, list)
    
    async def test_performance_metrics_tracking(self, ai_engine: AIEngine):
        """Test performance metrics tracking"""
        # Create multiple conversations
        for i in range(10):
            conversation = SupportConversation(
                user_id=f"user{i}",
                user_type="customer",
                service_type="RIDE",
                language="en",
                initial_message=f"Message {i}",
                status=ConversationStatus.OPEN
            )
            ai_engine.db_session.add(conversation)
            await ai_engine.db_session.commit()
            await ai_engine.db_session.refresh(conversation)
            
            # Process message
            await ai_engine.process_message(
                conversation_id=conversation.conversation_id,
                message=f"Test message {i}",
                message_type="text",
                user_id=conversation.user_id
            )
            
            # Close conversation
            await ai_engine.close_conversation(
                conversation_id=conversation.conversation_id,
                resolution=f"Resolved {i}"
            )
        
        # Get metrics
        metrics = await ai_engine.get_performance_metrics(
            start_date=datetime.utcnow() - timedelta(days=1),
            end_date=datetime.utcnow()
        )
        
        # Verify metrics
        assert metrics is not None
        assert metrics["total_conversations"] >= 10
        assert "automation_rate" in metrics
        assert "avg_response_time_ms" in metrics


@pytest.mark.asyncio
class TestAPIIntegration:
    """Test API integration with database and AI engine"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def auth_headers(self):
        """Create auth headers"""
        return {
            "Authorization": "Bearer test-token",
            "Content-Type": "application/json"
        }
    
    async def test_end_to_end_conversation(self, client, auth_headers):
        """Test end-to-end conversation through API"""
        # Create conversation
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.post(
                "/api/v1/conversations",
                json={
                    "user_id": "user123",
                    "user_type": "customer",
                    "service_type": "RIDE",
                    "language": "en",
                    "initial_message": "I need help"
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            conversation_data = response.json()
            conversation_id = conversation_data["conversation_id"]
            
            # Send messages
            messages = [
                "I need a refund",
                "Order number is ORD12345"
            ]
            
            for msg in messages:
                response = client.post(
                    f"/api/v1/conversations/{conversation_id}/messages",
                    json={
                        "content": msg,
                        "message_type": "text"
                    },
                    headers=auth_headers
                )
                
                assert response.status_code == 200
            
            # Get conversation history
            response = client.get(
                f"/api/v1/conversations/{conversation_id}/messages",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            history_data = response.json()
            assert "messages" in history_data
            
            # Close conversation
            response = client.post(
                f"/api/v1/conversations/{conversation_id}/close",
                json={"resolution": "Resolved"},
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    async def test_knowledge_base_api_integration(self, client, auth_headers):
        """Test knowledge base API integration"""
        # Add knowledge
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.post(
                "/api/v1/knowledge",
                json={
                    "category": "refunds",
                    "question": "How do I request a refund?",
                    "answer": "Within 30 days",
                    "language": "en",
                    "service_types": ["RIDE"],
                    "is_active": True
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            
            # Search knowledge
            response = client.get(
                "/api/v1/knowledge/search?query=refund&category=refunds",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            search_data = response.json()
            assert "results" in search_data
    
    async def test_analytics_api_integration(self, client, auth_headers):
        """Test analytics API integration"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            # Get conversation analytics
            response = client.get(
                "/api/v1/analytics/conversations?start_date=2024-01-01&end_date=2024-01-31",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            analytics_data = response.json()
            assert "total_conversations" in analytics_data
            assert "automation_rate" in analytics_data
            
            # Get performance metrics
            response = client.get(
                "/api/v1/analytics/performance?start_date=2024-01-01&end_date=2024-01-31",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            performance_data = response.json()
            assert "avg_response_time_ms" in performance_data
            assert "avg_confidence_score" in performance_data


@pytest.mark.asyncio
class TestCacheIntegration:
    """Test cache integration"""
    
    async def test_response_caching(self, test_session: AsyncSession, mock_redis):
        """Test that responses are cached"""
        engine = AIEngine(
            db_session=test_session,
            redis_client=mock_redis,
            elasticsearch_client=Mock()
        )
        
        # Create conversation
        conversation = SupportConversation(
            user_id="user123",
            user_type="customer",
            service_type="RIDE",
            language="en",
            initial_message="Test",
            status=ConversationStatus.OPEN
        )
        test_session.add(conversation)
        await test_session.commit()
        await test_session.refresh(conversation)
        
        # Process message
        response1 = await engine.process_message(
            conversation_id=conversation.conversation_id,
            message="How do I request a refund?",
            message_type="text",
            user_id=conversation.user_id
        )
        
        # Process same message again (should use cache)
        response2 = await engine.process_message(
            conversation_id=conversation.conversation_id,
            message="How do I request a refund?",
            message_type="text",
            user_id=conversation.user_id
        )
        
        # Verify cache was used
        assert mock_redis.get.called
    
    async def test_cache_invalidation(self, test_session: AsyncSession, mock_redis):
        """Test cache invalidation on knowledge updates"""
        engine = AIEngine(
            db_session=test_session,
            redis_client=mock_redis,
            elasticsearch_client=Mock()
        )
        
        # Add knowledge
        kb_entry = await engine.knowledge_manager.add_knowledge(
            category="refunds",
            question="How do I request a refund?",
            answer="Within 30 days",
            language="en",
            service_types=["RIDE"],
            is_active=True
        )
        
        # Update knowledge
        await engine.knowledge_manager.update_knowledge(
            kb_id=kb_entry.kb_id,
            answer="Updated answer"
        )
        
        # Verify cache was invalidated
        assert mock_redis.delete.called
