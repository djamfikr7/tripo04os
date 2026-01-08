"""
Unit tests for API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
import json

from api import app
from core_models import (
    SupportConversation,
    SupportMessage,
    AIKnowledgeBase,
    AIResponseFeedback,
    SupportAgent,
    EscalationRule,
    ConversationStatus,
    MessageRole,
    MessageType
)


@pytest.fixture
def client():
    """Create a test client for the API"""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Create authentication headers for testing"""
    return {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json"
    }


@pytest.mark.asyncio
class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_check(self, client):
        """Test the health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_readiness_check(self, client):
        """Test the readiness check endpoint"""
        response = client.get("/health/ready")
        
        assert response.status_code == 200
        data = response.json()
        assert data["ready"] is True
    
    def test_liveness_check(self, client):
        """Test the liveness check endpoint"""
        response = client.get("/health/live")
        
        assert response.status_code == 200
        data = response.json()
        assert data["alive"] is True


@pytest.mark.asyncio
class TestConversationEndpoints:
    """Test conversation management endpoints"""
    
    def test_create_conversation(self, client, auth_headers, sample_conversation_data):
        """Test creating a new conversation"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.post(
                "/api/v1/conversations",
                json=sample_conversation_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "conversation_id" in data
            assert data["user_id"] == sample_conversation_data["user_id"]
    
    def test_get_conversation(self, client, auth_headers, test_conversation):
        """Test retrieving a conversation by ID"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_conversation
            mock_db.return_value = mock_session
            
            response = client.get(
                f"/api/v1/conversations/{test_conversation.conversation_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["conversation_id"] == str(test_conversation.conversation_id)
    
    def test_list_conversations(self, client, auth_headers):
        """Test listing conversations with filters"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/conversations?user_id=user123&status=open&limit=10",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "conversations" in data
            assert "total" in data
    
    def test_update_conversation_status(self, client, auth_headers, test_conversation):
        """Test updating conversation status"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_conversation
            mock_db.return_value = mock_session
            
            response = client.patch(
                f"/api/v1/conversations/{test_conversation.conversation_id}/status",
                json={"status": "in_progress"},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "in_progress"
    
    def test_close_conversation(self, client, auth_headers, test_conversation):
        """Test closing a conversation"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_conversation
            mock_db.return_value = mock_session
            
            response = client.post(
                f"/api/v1/conversations/{test_conversation.conversation_id}/close",
                json={"resolution": "Issue resolved"},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "closed"
    
    def test_get_conversation_history(self, client, auth_headers, test_conversation, test_message):
        """Test retrieving conversation history"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalars.return_value.all.return_value = [test_message]
            mock_db.return_value = mock_session
            
            response = client.get(
                f"/api/v1/conversations/{test_conversation.conversation_id}/messages",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "messages" in data


@pytest.mark.asyncio
class TestMessageEndpoints:
    """Test message management endpoints"""
    
    def test_send_message(self, client, auth_headers, test_conversation, sample_message_data):
        """Test sending a message"""
        with patch('api.get_db_session') as mock_db, \
             patch('api.get_redis') as mock_redis:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_conversation
            mock_db.return_value = mock_session
            
            # Mock AI engine response
            mock_redis.return_value = AsyncMock()
            
            response = client.post(
                f"/api/v1/conversations/{test_conversation.conversation_id}/messages",
                json=sample_message_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "message_id" in data
            assert "response" in data
    
    def test_send_message_with_image(self, client, auth_headers, test_conversation, temp_upload_dir):
        """Test sending a message with image attachment"""
        # Create a test image file
        image_path = temp_upload_dir / "test_image.jpg"
        image_path.write_bytes(b"fake image data")
        
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_conversation
            mock_db.return_value = mock_session
            
            with open(image_path, "rb") as f:
                response = client.post(
                    f"/api/v1/conversations/{test_conversation.conversation_id}/messages",
                    files={"file": ("test_image.jpg", f, "image/jpeg")},
                    data={"message_type": "image"},
                    headers=auth_headers
                )
            
            assert response.status_code == 200
    
    def test_get_message(self, client, auth_headers, test_message):
        """Test retrieving a message by ID"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_message
            mock_db.return_value = mock_session
            
            response = client.get(
                f"/api/v1/messages/{test_message.message_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["message_id"] == str(test_message.message_id)
    
    def test_record_feedback(self, client, auth_headers, test_message, sample_feedback_data):
        """Test recording feedback for a message"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_message
            mock_db.return_value = mock_session
            
            response = client.post(
                f"/api/v1/messages/{test_message.message_id}/feedback",
                json=sample_feedback_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["rating"] == sample_feedback_data["rating"]


@pytest.mark.asyncio
class TestKnowledgeBaseEndpoints:
    """Test knowledge base management endpoints"""
    
    def test_add_knowledge(self, client, auth_headers, sample_knowledge_base_data):
        """Test adding knowledge to the knowledge base"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.post(
                "/api/v1/knowledge",
                json=sample_knowledge_base_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "kb_id" in data
    
    def test_search_knowledge(self, client, auth_headers):
        """Test searching the knowledge base"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/knowledge/search?query=refund&category=refunds&limit=10",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
    
    def test_get_knowledge_by_id(self, client, auth_headers, test_knowledge_base):
        """Test retrieving knowledge by ID"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_knowledge_base
            mock_db.return_value = mock_session
            
            response = client.get(
                f"/api/v1/knowledge/{test_knowledge_base.kb_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["kb_id"] == test_knowledge_base.kb_id
    
    def test_update_knowledge(self, client, auth_headers, test_knowledge_base):
        """Test updating knowledge"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_knowledge_base
            mock_db.return_value = mock_session
            
            response = client.patch(
                f"/api/v1/knowledge/{test_knowledge_base.kb_id}",
                json={"answer": "Updated answer"},
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_delete_knowledge(self, client, auth_headers, test_knowledge_base):
        """Test deleting knowledge"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_knowledge_base
            mock_db.return_value = mock_session
            
            response = client.delete(
                f"/api/v1/knowledge/{test_knowledge_base.kb_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 200


@pytest.mark.asyncio
class TestAgentEndpoints:
    """Test agent management endpoints"""
    
    def test_create_agent(self, client, auth_headers, sample_agent_data):
        """Test creating a new agent"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.post(
                "/api/v1/agents",
                json=sample_agent_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "agent_id" in data
    
    def test_list_agents(self, client, auth_headers):
        """Test listing agents"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/agents?is_available=true",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "agents" in data
    
    def test_get_agent(self, client, auth_headers, test_agent):
        """Test retrieving an agent by ID"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_agent
            mock_db.return_value = mock_session
            
            response = client.get(
                f"/api/v1/agents/{test_agent.agent_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["agent_id"] == test_agent.agent_id
    
    def test_update_agent_availability(self, client, auth_headers, test_agent):
        """Test updating agent availability"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_agent
            mock_db.return_value = mock_session
            
            response = client.patch(
                f"/api/v1/agents/{test_agent.agent_id}/availability",
                json={"is_available": False},
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_assign_conversation_to_agent(self, client, auth_headers, test_conversation, test_agent):
        """Test assigning a conversation to an agent"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_conversation
            mock_db.return_value = mock_session
            
            response = client.post(
                f"/api/v1/conversations/{test_conversation.conversation_id}/assign",
                json={"agent_id": test_agent.agent_id},
                headers=auth_headers
            )
            
            assert response.status_code == 200


@pytest.mark.asyncio
class TestEscalationRuleEndpoints:
    """Test escalation rule management endpoints"""
    
    def test_create_escalation_rule(self, client, auth_headers, sample_escalation_rule_data):
        """Test creating a new escalation rule"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.post(
                "/api/v1/escalation-rules",
                json=sample_escalation_rule_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "rule_id" in data
    
    def test_list_escalation_rules(self, client, auth_headers):
        """Test listing escalation rules"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/escalation-rules?is_active=true",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "rules" in data
    
    def test_update_escalation_rule(self, client, auth_headers, test_escalation_rule):
        """Test updating an escalation rule"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_escalation_rule
            mock_db.return_value = mock_session
            
            response = client.patch(
                f"/api/v1/escalation-rules/{test_escalation_rule.rule_id}",
                json={"priority": 2},
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    def test_delete_escalation_rule(self, client, auth_headers, test_escalation_rule):
        """Test deleting an escalation rule"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = test_escalation_rule
            mock_db.return_value = mock_session
            
            response = client.delete(
                f"/api/v1/escalation-rules/{test_escalation_rule.rule_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 200


@pytest.mark.asyncio
class TestAnalyticsEndpoints:
    """Test analytics and metrics endpoints"""
    
    def test_get_conversation_analytics(self, client, auth_headers):
        """Test retrieving conversation analytics"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/analytics/conversations?start_date=2024-01-01&end_date=2024-01-31",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "total_conversations" in data
            assert "automation_rate" in data
    
    def test_get_performance_metrics(self, client, auth_headers):
        """Test retrieving performance metrics"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/analytics/performance?start_date=2024-01-01&end_date=2024-01-31",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "avg_response_time_ms" in data
            assert "avg_confidence_score" in data
    
    def test_get_user_satisfaction(self, client, auth_headers):
        """Test retrieving user satisfaction metrics"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/analytics/satisfaction?start_date=2024-01-01&end_date=2024-01-31",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "average_rating" in data
            assert "helpful_percentage" in data
    
    def test_get_intent_distribution(self, client, auth_headers):
        """Test retrieving intent distribution"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/analytics/intents?start_date=2024-01-01&end_date=2024-01-31",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "intents" in data


@pytest.mark.asyncio
class TestErrorHandling:
    """Test error handling in API endpoints"""
    
    def test_unauthorized_access(self, client):
        """Test that unauthorized requests are rejected"""
        response = client.get("/api/v1/conversations")
        
        assert response.status_code == 401
    
    def test_invalid_conversation_id(self, client, auth_headers):
        """Test handling of invalid conversation ID"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value.scalar_one_or_none.return_value = None
            mock_db.return_value = mock_session
            
            response = client.get(
                "/api/v1/conversations/invalid-id",
                headers=auth_headers
            )
            
            assert response.status_code == 404
    
    def test_invalid_request_body(self, client, auth_headers):
        """Test handling of invalid request body"""
        response = client.post(
            "/api/v1/conversations",
            json={"invalid": "data"},
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    def test_rate_limiting(self, client, auth_headers):
        """Test rate limiting"""
        with patch('api.get_db_session') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value = mock_session
            
            # Make multiple rapid requests
            for _ in range(101):
                response = client.get(
                    "/api/v1/conversations",
                    headers=auth_headers
                )
            
            # Last request should be rate limited
            assert response.status_code == 429


@pytest.mark.asyncio
class TestWebSocketEndpoints:
    """Test WebSocket endpoints"""
    
    def test_websocket_connection(self, client):
        """Test WebSocket connection"""
        with client.websocket_connect("/ws/conversations/test-id") as websocket:
            data = websocket.receive_json()
            assert data["type"] == "connected"
    
    def test_websocket_message(self, client):
        """Test sending and receiving messages via WebSocket"""
        with client.websocket_connect("/ws/conversations/test-id") as websocket:
            # Send a message
            websocket.send_json({
                "type": "message",
                "content": "Hello"
            })
            
            # Receive response
            data = websocket.receive_json()
            assert data["type"] in ["response", "error"]
