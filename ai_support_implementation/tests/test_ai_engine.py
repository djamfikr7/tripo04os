"""
Unit tests for AI Engine
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from ai_engine import AIEngine, AIModelManager, KnowledgeBaseManager, EscalationManager
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


@pytest.mark.asyncio
class TestAIModelManager:
    """Test AI Model Manager functionality"""
    
    @pytest.fixture
    def model_manager(self, mock_ai_models):
        """Create a model manager with mock AI models"""
        manager = AIModelManager(device="cpu")
        manager.intent_classifier = mock_ai_models.intent_classifier
        manager.entity_extractor = mock_ai_models.entity_extractor
        manager.sentiment_analyzer = mock_ai_models.sentiment_analyzer
        return manager
    
    async def test_classify_intent(self, model_manager):
        """Test intent classification"""
        message = "I need a refund for my order"
        
        result = await model_manager.classify_intent(message)
        
        assert result is not None
        assert "intent" in result
        assert "confidence" in result
        assert result["intent"] == "refund_request"
        assert result["confidence"] == 0.85
    
    async def test_extract_entities(self, model_manager):
        """Test entity extraction"""
        message = "I want a refund of $50 for order ORD12345"
        
        result = await model_manager.extract_entities(message)
        
        assert result is not None
        assert "entities" in result
        assert len(result["entities"]) == 2
    
    async def test_analyze_sentiment(self, model_manager):
        """Test sentiment analysis"""
        message = "This is terrible service, I'm very angry"
        
        result = await model_manager.analyze_sentiment(message)
        
        assert result is not None
        assert "sentiment" in result
        assert "score" in result
        assert result["sentiment"] == "negative"
        assert result["score"] < 0
    
    async def test_low_confidence_intent(self, model_manager):
        """Test handling of low confidence intent classification"""
        # Mock low confidence response
        model_manager.intent_classifier.return_value = {
            "intent": "unknown",
            "confidence": 0.3
        }
        
        message = "Some unclear message"
        result = await model_manager.classify_intent(message)
        
        assert result["confidence"] < 0.5


@pytest.mark.asyncio
class TestKnowledgeBaseManager:
    """Test Knowledge Base Manager functionality"""
    
    @pytest.fixture
    async def kb_manager(self, test_session: AsyncSession, mock_elasticsearch):
        """Create a knowledge base manager"""
        manager = KnowledgeBaseManager(test_session, mock_elasticsearch)
        return manager
    
    async def test_add_knowledge(self, kb_manager, sample_knowledge_base_data):
        """Test adding knowledge to the knowledge base"""
        kb_entry = await kb_manager.add_knowledge(**sample_knowledge_base_data)
        
        assert kb_entry is not None
        assert kb_entry.category == sample_knowledge_base_data["category"]
        assert kb_entry.question == sample_knowledge_base_data["question"]
    
    async def test_search_knowledge(self, kb_manager, test_knowledge_base):
        """Test searching the knowledge base"""
        results = await kb_manager.search_knowledge(
            query="refund policy",
            category="refunds",
            language="en",
            limit=5
        )
        
        assert results is not None
        assert isinstance(results, list)
    
    async def test_update_knowledge(self, kb_manager, test_knowledge_base):
        """Test updating knowledge in the knowledge base"""
        updated_entry = await kb_manager.update_knowledge(
            kb_id=test_knowledge_base.kb_id,
            answer="Updated refund policy information"
        )
        
        assert updated_entry is not None
        assert "Updated" in updated_entry.answer
    
    async def test_delete_knowledge(self, kb_manager, test_knowledge_base):
        """Test deleting knowledge from the knowledge base"""
        result = await kb_manager.delete_knowledge(test_knowledge_base.kb_id)
        
        assert result is True
    
    async def test_get_knowledge_by_id(self, kb_manager, test_knowledge_base):
        """Test retrieving knowledge by ID"""
        kb_entry = await kb_manager.get_knowledge_by_id(test_knowledge_base.kb_id)
        
        assert kb_entry is not None
        assert kb_entry.kb_id == test_knowledge_base.kb_id


@pytest.mark.asyncio
class TestEscalationManager:
    """Test Escalation Manager functionality"""
    
    @pytest.fixture
    async def escalation_manager(self, test_session: AsyncSession):
        """Create an escalation manager"""
        manager = EscalationManager(test_session)
        return manager
    
    async def test_check_escalation_rules(self, escalation_manager, test_escalation_rule):
        """Test checking escalation rules"""
        should_escalate = await escalation_manager.check_escalation_rules(
            sentiment_score=-0.6,
            confidence_score=0.4,
            conversation_age_seconds=200
        )
        
        assert should_escalate is True
    
    async def test_find_available_agent(self, escalation_manager, test_agent):
        """Test finding an available agent"""
        agent = await escalation_manager.find_available_agent(
            specialty="refunds"
        )
        
        assert agent is not None
        assert agent.agent_id == test_agent.agent_id
    
    async def test_escalate_conversation(self, escalation_manager, test_conversation, test_agent):
        """Test escalating a conversation to an agent"""
        result = await escalation_manager.escalate_conversation(
            conversation_id=test_conversation.conversation_id,
            agent_id=test_agent.agent_id,
            reason="Negative sentiment detected"
        )
        
        assert result is True
    
    async def test_no_escalation_for_positive_sentiment(self, escalation_manager, test_escalation_rule):
        """Test that positive sentiment doesn't trigger escalation"""
        should_escalate = await escalation_manager.check_escalation_rules(
            sentiment_score=0.6,
            confidence_score=0.8,
            conversation_age_seconds=100
        )
        
        assert should_escalate is False


@pytest.mark.asyncio
class TestAIEngine:
    """Test AI Engine functionality"""
    
    @pytest.fixture
    async def ai_engine(self, test_session: AsyncSession, mock_redis, mock_elasticsearch):
        """Create an AI engine instance"""
        engine = AIEngine(
            db_session=test_session,
            redis_client=mock_redis,
            elasticsearch_client=mock_elasticsearch
        )
        return engine
    
    async def test_process_message_success(self, ai_engine, test_conversation, sample_message_data):
        """Test successful message processing"""
        response = await ai_engine.process_message(
            conversation_id=test_conversation.conversation_id,
            message=sample_message_data["content"],
            message_type=sample_message_data["message_type"],
            user_id=test_conversation.user_id
        )
        
        assert response is not None
        assert "response" in response
        assert "confidence" in response
        assert "escalated" in response
    
    async def test_process_message_with_escalation(self, ai_engine, test_conversation, test_agent):
        """Test message processing that triggers escalation"""
        # Create escalation rule for negative sentiment
        rule = EscalationRule(
            rule_name="Test Negative Sentiment",
            condition_type="sentiment",
            condition_value=-0.5,
            operator="<=",
            priority=1,
            action="escalate_to_agent",
            target_agent_specialty="refunds"
        )
        await ai_engine.db_session.add(rule)
        await ai_engine.db_session.commit()
        
        response = await ai_engine.process_message(
            conversation_id=test_conversation.conversation_id,
            message="This is terrible, I'm very angry!",
            message_type="text",
            user_id=test_conversation.user_id
        )
        
        assert response["escalated"] is True
    
    async def test_process_message_with_low_confidence(self, ai_engine, test_conversation):
        """Test message processing with low confidence AI response"""
        # Mock low confidence response
        with patch.object(ai_engine.model_manager, 'generate_response') as mock_gen:
            mock_gen.return_value = {
                "response": "I'm not sure about that",
                "confidence": 0.3,
                "sources": []
            }
            
            response = await ai_engine.process_message(
                conversation_id=test_conversation.conversation_id,
                message="Some unclear question",
                message_type="text",
                user_id=test_conversation.user_id
            )
            
            assert response["confidence"] < 0.5
    
    async def test_get_conversation_history(self, ai_engine, test_conversation, test_message):
        """Test retrieving conversation history"""
        history = await ai_engine.get_conversation_history(
            conversation_id=test_conversation.conversation_id
        )
        
        assert history is not None
        assert len(history) >= 1
    
    async def test_record_feedback(self, ai_engine, test_conversation, test_message, sample_feedback_data):
        """Test recording user feedback"""
        feedback = await ai_engine.record_feedback(
            conversation_id=test_conversation.conversation_id,
            message_id=test_message.message_id,
            **sample_feedback_data
        )
        
        assert feedback is not None
        assert feedback.rating == sample_feedback_data["rating"]
    
    async def test_get_conversation_context(self, ai_engine, test_conversation, test_message):
        """Test getting conversation context"""
        context = await ai_engine.get_conversation_context(
            conversation_id=test_conversation.conversation_id
        )
        
        assert context is not None
        assert "conversation" in context
        assert "messages" in context
    
    async def test_close_conversation(self, ai_engine, test_conversation):
        """Test closing a conversation"""
        result = await ai_engine.close_conversation(
            conversation_id=test_conversation.conversation_id,
            resolution="Issue resolved successfully"
        )
        
        assert result is True
        
        # Verify conversation is closed
        await ai_engine.db_session.refresh(test_conversation)
        assert test_conversation.status == ConversationStatus.CLOSED
    
    async def test_get_performance_metrics(self, ai_engine):
        """Test retrieving performance metrics"""
        metrics = await ai_engine.get_performance_metrics(
            start_date=datetime.utcnow() - timedelta(days=7),
            end_date=datetime.utcnow()
        )
        
        assert metrics is not None
        assert "total_conversations" in metrics
        assert "automation_rate" in metrics
    
    async def test_cache_hit(self, ai_engine, test_conversation, mock_redis):
        """Test that cached responses are used"""
        # Set up cache
        cache_key = f"response:{test_conversation.conversation_id}:test message"
        mock_redis.get.return_value = '{"response": "Cached response", "confidence": 0.9}'
        
        response = await ai_engine.process_message(
            conversation_id=test_conversation.conversation_id,
            message="test message",
            message_type="text",
            user_id=test_conversation.user_id
        )
        
        assert "Cached" in response["response"]
        mock_redis.get.assert_called_once()
    
    async def test_multilingual_support(self, ai_engine, test_conversation):
        """Test processing messages in different languages"""
        response_en = await ai_engine.process_message(
            conversation_id=test_conversation.conversation_id,
            message="I need help",
            message_type="text",
            user_id=test_conversation.user_id
        )
        
        # Update conversation language
        test_conversation.language = "es"
        await ai_engine.db_session.commit()
        
        response_es = await ai_engine.process_message(
            conversation_id=test_conversation.conversation_id,
            message="Necesito ayuda",
            message_type="text",
            user_id=test_conversation.user_id
        )
        
        assert response_en is not None
        assert response_es is not None
    
    async def test_handle_image_message(self, ai_engine, test_conversation, temp_upload_dir):
        """Test handling image messages"""
        image_path = temp_upload_dir / "test_image.jpg"
        image_path.write_bytes(b"fake image data")
        
        response = await ai_engine.process_message(
            conversation_id=test_conversation.conversation_id,
            message=str(image_path),
            message_type="image",
            user_id=test_conversation.user_id
        )
        
        assert response is not None
    
    async def test_handle_audio_message(self, ai_engine, test_conversation, temp_upload_dir):
        """Test handling audio messages"""
        audio_path = temp_upload_dir / "test_audio.wav"
        audio_path.write_bytes(b"fake audio data")
        
        response = await ai_engine.process_message(
            conversation_id=test_conversation.conversation_id,
            message=str(audio_path),
            message_type="audio",
            user_id=test_conversation.user_id
        )
        
        assert response is not None


@pytest.mark.asyncio
class TestAIEngineIntegration:
    """Integration tests for AI Engine"""
    
    async def test_full_conversation_flow(self, test_session: AsyncSession, mock_redis, mock_elasticsearch):
        """Test a full conversation flow from start to finish"""
        engine = AIEngine(
            db_session=test_session,
            redis_client=mock_redis,
            elasticsearch_client=mock_elasticsearch
        )
        
        # Create conversation
        conversation = SupportConversation(
            user_id="user123",
            user_type="customer",
            service_type="RIDE",
            language="en",
            initial_message="I need help with a refund",
            status=ConversationStatus.OPEN
        )
        test_session.add(conversation)
        await test_session.commit()
        
        # Process multiple messages
        messages = [
            "I need a refund for my ride",
            "The ride was on January 1st",
            "The order number is ORD12345"
        ]
        
        for msg in messages:
            response = await engine.process_message(
                conversation_id=conversation.conversation_id,
                message=msg,
                message_type="text",
                user_id=conversation.user_id
            )
            assert response is not None
        
        # Record feedback
        history = await engine.get_conversation_history(conversation.conversation_id)
        if history:
            await engine.record_feedback(
                conversation_id=conversation.conversation_id,
                message_id=history[-1].message_id,
                rating=5,
                helpful=True
            )
        
        # Close conversation
        result = await engine.close_conversation(
            conversation_id=conversation.conversation_id,
            resolution="Refund processed successfully"
        )
        
        assert result is True
    
    async def test_escalation_flow(self, test_session: AsyncSession, mock_redis, mock_elasticsearch):
        """Test the escalation flow from AI to human agent"""
        engine = AIEngine(
            db_session=test_session,
            redis_client=mock_redis,
            elasticsearch_client=mock_elasticsearch
        )
        
        # Create agent
        agent = SupportAgent(
            agent_id="agent123",
            name="John Doe",
            email="john@example.com",
            specialties=["refunds"],
            max_concurrent_conversations=5,
            is_available=True
        )
        test_session.add(agent)
        
        # Create escalation rule
        rule = EscalationRule(
            rule_name="Negative Sentiment Rule",
            condition_type="sentiment",
            condition_value=-0.5,
            operator="<=",
            priority=1,
            action="escalate_to_agent",
            target_agent_specialty="refunds"
        )
        test_session.add(rule)
        
        # Create conversation
        conversation = SupportConversation(
            user_id="user456",
            user_type="customer",
            service_type="RIDE",
            language="en",
            initial_message="I'm very angry",
            status=ConversationStatus.OPEN
        )
        test_session.add(conversation)
        await test_session.commit()
        
        # Process negative message
        response = await engine.process_message(
            conversation_id=conversation.conversation_id,
            message="This is terrible service, I'm furious!",
            message_type="text",
            user_id=conversation.user_id
        )
        
        assert response["escalated"] is True
