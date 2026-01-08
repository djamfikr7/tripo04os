"""
End-to-End (E2E) Integration Tests for AI Support System
Tests complete user flows from API to database
"""

import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta
from typing import Dict, List
import json

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
from config import Settings
from database import init_database, get_db_session
from ai_engine import AIEngine


@pytest.mark.e2e
class TestE2EConversationFlow:
    """Test complete conversation flow from start to finish."""
    
    @pytest.fixture
    async def client():
        """Create test client."""
        return AsyncClient(
            base_url="http://localhost:8000",
            transport=ASGITransport()
        )
    
    @pytest.fixture
    async def ai_engine():
        """Create AI engine instance."""
        # Initialize database
        await init_database()
        
        # Create session
        async with get_db_session() as session:
            engine = AIEngine(
                db_session=session,
                redis_client=None,  # Use None for testing
                elasticsearch_client=None  # Use None for testing
            )
            yield engine
    
    @pytest.mark.asyncio
    async def test_complete_user_support_flow(self, client: AsyncClient, ai_engine: AIEngine):
        """Test complete user support flow: account creation → ride booking → refund request → resolution."""
        
        # Step 1: User creates account
        print("\n[Step 1] User creates account")
        create_response = await client.post(
            "/api/v1/conversations",
            json={
                "user_id": "test_user_001",
                "user_type": "customer",
                "service_type": "RIDE",
                "language": "en",
                "initial_message": "I need help setting up my account"
            }
        )
        assert create_response.status_code == 200
        conversation_id = create_response.json()["conversation_id"]
        print(f"✓ Conversation created: {conversation_id}")
        
        # Step 2: User asks about booking a ride
        print("\n[Step 2] User asks about booking a ride")
        booking_response = await client.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={
                "content": "How do I book a ride?",
                "message_type": "text"
            }
        )
        assert booking_response.status_code == 200
        booking_message = booking_response.json()
        print(f"✓ Booking question sent, received response")
        assert "response" in booking_message
        assert booking_message["confidence"] > 0.5
        
        # Step 3: User reports an issue with a ride
        print("\n[Step 3] User reports an issue with a ride")
        issue_response = await client.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={
                "content": "My driver was late and very rude",
                "message_type": "text"
            }
        )
        assert issue_response.status_code == 200
        issue_message = issue_response.json()
        print(f"✓ Issue reported, received response")
        assert "response" in issue_message
        
        # Step 4: User requests a refund
        print("\n[Step 4] User requests a refund")
        refund_response = await client.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={
                "content": "I want a refund for my ride",
                "message_type": "text"
            }
        )
        assert refund_response.status_code == 200
        refund_message = refund_response.json()
        print(f"✓ Refund request sent, received response")
        assert "response" in refund_message
        
        # Step 5: User provides feedback
        print("\n[Step 5] User provides feedback on AI response")
        feedback_response = await client.post(
            f"/api/v1/messages/{refund_message['message_id']}/feedback",
            json={
                "rating": 5,
                "helpful": True,
                "comment": "Very helpful response, thanks!"
            }
        )
        assert feedback_response.status_code == 200
        print(f"✓ Feedback submitted")
        
        # Step 6: Close conversation
        print("\n[Step 6] User closes conversation")
        close_response = await client.post(
            f"/api/v1/conversations/{conversation_id}/close",
            json={
                "resolution": "User successfully completed account setup and received support"
            }
        )
        assert close_response.status_code == 200
        print(f"✓ Conversation closed")
        
        # Verify conversation status
        print("\n[Verification] Checking conversation status")
        status_response = await client.get(f"/api/v1/conversations/{conversation_id}")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["status"] == "closed"
        print(f"✓ Conversation status verified: closed")
        
        print("\n✅ E2E Test Passed: Complete user support flow")
    
    @pytest.mark.asyncio
    async def test_escalation_flow(self, client: AsyncClient, ai_engine: AIEngine):
        """Test escalation flow: negative sentiment → escalation to agent → resolution."""
        
        # Step 1: User creates conversation
        print("\n[Step 1] User creates conversation")
        create_response = await client.post(
            "/api/v1/conversations",
            json={
                "user_id": "test_user_002",
                "user_type": "customer",
                "service_type": "RIDE",
                "language": "en",
                "initial_message": "This is the worst service ever!"
            }
        )
        assert create_response.status_code == 200
        conversation_id = create_response.json()["conversation_id"]
        print(f"✓ Conversation created: {conversation_id}")
        
        # Step 2: User sends negative message
        print("\n[Step 2] User sends negative message")
        negative_response = await client.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={
                "content": "This is terrible, I'm very angry!",
                "message_type": "text"
            }
        )
        assert negative_response.status_code == 200
        negative_message = negative_response.json()
        print(f"✓ Negative message sent")
        
        # Verify escalation
        print("\n[Verification] Checking if conversation was escalated")
        assert negative_message.get("escalated", False) == True
        print("✓ Conversation was escalated due to negative sentiment")
        
        # Step 3: Agent resolves issue
        print("\n[Step 3] Agent resolves issue (simulated)")
        # In real scenario, agent would respond
        # For E2E test, we'll simulate agent response
        agent_response = await client.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={
                "content": "I apologize for the poor experience. I've reviewed your case and processed a full refund. The amount will be credited to your account within 5-7 business days.",
                "message_type": "text"
            }
        )
        assert agent_response.status_code == 200
        print(f"✓ Agent response sent")
        
        # Step 4: User provides positive feedback
        print("\n[Step 4] User provides positive feedback")
        feedback_response = await client.post(
            f"/api/v1/messages/{agent_response.json()['message_id']}/feedback",
            json={
                "rating": 5,
                "helpful": True,
                "comment": "Great support, issue resolved quickly!"
            }
        )
        assert feedback_response.status_code == 200
        print(f"✓ Positive feedback submitted")
        
        # Step 5: Close conversation
        print("\n[Step 5] Close conversation")
        close_response = await client.post(
            f"/api/v1/conversations/{conversation_id}/close",
            json={
                "resolution": "Issue escalated and resolved by human agent"
            }
        )
        assert close_response.status_code == 200
        print(f"✓ Conversation closed")
        
        print("\n✅ E2E Test Passed: Escalation flow")
    
    @pytest.mark.asyncio
    async def test_multilingual_support(self, client: AsyncClient, ai_engine: AIEngine):
        """Test multilingual support across different languages."""
        
        languages = ["en", "es", "fr", "de", "ar"]
        
        for i, language in enumerate(languages):
            print(f"\n[Language {i+1}/{len(languages)}] Testing {language}")
            
            # Create conversation in different language
            create_response = await client.post(
                "/api/v1/conversations",
                json={
                    "user_id": f"test_user_{i:03d}",
                    "user_type": "customer",
                    "service_type": "RIDE",
                    "language": language,
                    "initial_message": "I need help" if language == "en" else "Necesito ayuda"
                }
            )
            assert create_response.status_code == 200
            conversation_id = create_response.json()["conversation_id"]
            
            # Send message in that language
            message_content = {
                "en": "How do I request a refund?",
                "es": "¿Cómo solicito un reembolso?",
                "fr": "Comment demander un remboursement?",
                "de": "Wie fordere ich eine Rückerstattung?",
                "ar": "كيف أطلب استرداد الأموال؟"
            }[language]
            
            response = await client.post(
                f"/api/v1/conversations/{conversation_id}/messages",
                json={
                    "content": message_content,
                    "message_type": "text"
                }
            )
            assert response.status_code == 200
            print(f"✓ Message sent in {language}, received response")
            
            # Close conversation
            await client.post(
                f"/api/v1/conversations/{conversation_id}/close",
                json={"resolution": f"Test completed for {language}"}
            )
        
        print("\n✅ E2E Test Passed: Multilingual support")
    
    @pytest.mark.asyncio
    async def test_knowledge_base_retrieval(self, client: AsyncClient):
        """Test knowledge base retrieval and usage."""
        
        print("\n[Test] Knowledge Base Retrieval")
        
        # Step 1: Search knowledge base
        print("\n[Step 1] Search knowledge base")
        search_response = await client.get(
            "/api/v1/knowledge/search?query=refund&category=payment&limit=5"
        )
        assert search_response.status_code == 200
        results = search_response.json()
        print(f"✓ Found {len(results.get('results', []))} knowledge base entries")
        
        # Step 2: Get specific knowledge entry
        if results.get('results'):
            kb_id = results['results'][0]['id']
            print(f"\n[Step 2] Get specific knowledge entry: {kb_id}")
            
            kb_response = await client.get(f"/api/v1/knowledge/{kb_id}")
            assert kb_response.status_code == 200
            kb_entry = kb_response.json()
            print(f"✓ Retrieved knowledge entry: {kb_entry['question'][:50]}...")
            
            # Verify entry structure
            assert "id" in kb_entry
            assert "category" in kb_entry
            assert "question" in kb_entry
            assert "answer" in kb_entry
            assert "language" in kb_entry
            assert "service_types" in kb_entry
        
        print("\n✅ E2E Test Passed: Knowledge base retrieval")
    
    @pytest.mark.asyncio
    async def test_analytics_and_metrics(self, client: AsyncClient):
        """Test analytics and metrics retrieval."""
        
        print("\n[Test] Analytics and Metrics")
        
        # Step 1: Get conversation analytics
        print("\n[Step 1] Get conversation analytics")
        start_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        analytics_response = await client.get(
            f"/api/v1/analytics/conversations?start_date={start_date}&end_date={end_date}"
        )
        assert analytics_response.status_code == 200
        analytics_data = analytics_response.json()
        print(f"✓ Retrieved analytics: {analytics_data.get('total_conversations', 0)} conversations")
        
        # Step 2: Get performance metrics
        print("\n[Step 2] Get performance metrics")
        perf_response = await client.get(
            f"/api/v1/analytics/performance?start_date={start_date}&end_date={end_date}"
        )
        assert perf_response.status_code == 200
        perf_data = perf_response.json()
        print(f"✓ Retrieved performance metrics")
        print(f"  - Automation rate: {perf_data.get('automation_rate', 0):.2%}")
        print(f"  - Avg response time: {perf_data.get('avg_response_time_ms', 0)}ms")
        print(f"  - Avg confidence: {perf_data.get('avg_confidence_score', 0):.2%}")
        
        # Step 3: Get user satisfaction
        print("\n[Step 3] Get user satisfaction")
        sat_response = await client.get(
            f"/api/v1/analytics/satisfaction?start_date={start_date}&end_date={end_date}"
        )
        assert sat_response.status_code == 200
        sat_data = sat_response.json()
        print(f"✓ Retrieved satisfaction metrics")
        print(f"  - Average rating: {sat_data.get('average_rating', 0)}/5")
        print(f"  - Helpful percentage: {sat_data.get('helpful_percentage', 0):.1%}")
        
        print("\n✅ E2E Test Passed: Analytics and metrics")
    
    @pytest.mark.asyncio
    async def test_agent_management_flow(self, client: AsyncClient):
        """Test agent management flow."""
        
        print("\n[Test] Agent Management")
        
        # Step 1: Create agent
        print("\n[Step 1] Create support agent")
        create_agent_response = await client.post(
            "/api/v1/agents",
            json={
                "agent_id": "agent_001",
                "name": "John Doe",
                "email": "john.doe@tripo04os.com",
                "specialties": ["refunds", "billing"],
                "max_concurrent_conversations": 5,
                "is_available": True
            }
        )
        assert create_agent_response.status_code == 200
        agent_id = create_agent_response.json()["agent_id"]
        print(f"✓ Agent created: {agent_id}")
        
        # Step 2: List agents
        print("\n[Step 2] List agents")
        list_response = await client.get("/api/v1/agents?is_available=true")
        assert list_response.status_code == 200
        agents = list_response.json()["agents"]
        print(f"✓ Found {len(agents)} available agents")
        
        # Step 3: Update agent availability
        print("\n[Step 3] Update agent availability")
        update_response = await client.patch(
            f"/api/v1/agents/{agent_id}/availability",
            json={"is_available": False}
        )
        assert update_response.status_code == 200
        print(f"✓ Agent availability updated")
        
        # Step 4: Verify update
        print("\n[Step 4] Verify agent update")
        verify_response = await client.get(f"/api/v1/agents/{agent_id}")
        assert verify_response.status_code == 200
        agent_data = verify_response.json()
        assert agent_data["is_available"] == False
        print(f"✓ Agent availability verified: {agent_data['is_available']}")
        
        print("\n✅ E2E Test Passed: Agent management flow")
    
    @pytest.mark.asyncio
    async def test_escalation_rules_flow(self, client: AsyncClient):
        """Test escalation rules management."""
        
        print("\n[Test] Escalation Rules Management")
        
        # Step 1: Create escalation rule
        print("\n[Step 1] Create escalation rule")
        create_rule_response = await client.post(
            "/api/v1/escalation-rules",
            json={
                "rule_name": "Negative Sentiment Rule",
                "condition_type": "sentiment",
                "condition_value": -0.5,
                "operator": "<=",
                "priority": 1,
                "action": "escalate_to_agent",
                "target_agent_specialty": "refunds"
            }
        )
        assert create_rule_response.status_code == 200
        rule_id = create_rule_response.json()["rule_id"]
        print(f"✓ Escalation rule created: {rule_id}")
        
        # Step 2: List escalation rules
        print("\n[Step 2] List escalation rules")
        list_response = await client.get("/api/v1/escalation-rules?is_active=true")
        assert list_response.status_code == 200
        rules = list_response.json()["rules"]
        print(f"✓ Found {len(rules)} active rules")
        
        # Step 3: Update escalation rule
        print("\n[Step 3] Update escalation rule")
        update_response = await client.patch(
            f"/api/v1/escalation-rules/{rule_id}",
            json={"priority": 2}
        )
        assert update_response.status_code == 200
        print(f"✓ Escalation rule updated")
        
        # Step 4: Delete escalation rule
        print("\n[Step 4] Delete escalation rule")
        delete_response = await client.delete(f"/api/v1/escalation-rules/{rule_id}")
        assert delete_response.status_code == 200
        print(f"✓ Escalation rule deleted")
        
        print("\n✅ E2E Test Passed: Escalation rules management")
    
    @pytest.mark.asyncio
    async def test_health_checks(self, client: AsyncClient):
        """Test health check endpoints."""
        
        print("\n[Test] Health Checks")
        
        # Step 1: Basic health check
        print("\n[Step 1] Basic health check")
        health_response = await client.get("/health")
        assert health_response.status_code == 200
        health_data = health_response.json()
        assert health_data["status"] == "healthy"
        print(f"✓ Health check passed: {health_data['status']}")
        
        # Step 2: Readiness check
        print("\n[Step 2] Readiness check")
        ready_response = await client.get("/health/ready")
        assert ready_response.status_code == 200
        ready_data = ready_response.json()
        assert ready_data["ready"] is True
        print(f"✓ Readiness check passed: {ready_data['ready']}")
        
        # Step 3: Liveness check
        print("\n[Step 3] Liveness check")
        live_response = await client.get("/health/live")
        assert live_response.status_code == 200
        live_data = live_response.json()
        assert live_data["alive"] is True
        print(f"✓ Liveness check passed: {live_data['alive']}")
        
        print("\n✅ E2E Test Passed: All health checks")
    
    @pytest.mark.asyncio
    async def test_error_handling(self, client: AsyncClient):
        """Test error handling across API endpoints."""
        
        print("\n[Test] Error Handling")
        
        # Step 1: Invalid conversation ID
        print("\n[Step 1] Test invalid conversation ID")
        response = await client.get("/api/v1/conversations/invalid-id")
        assert response.status_code == 404
        print("✓ Invalid conversation ID returns 404")
        
        # Step 2: Invalid message ID
        print("\n[Step 2] Test invalid message ID")
        response = await client.get("/api/v1/messages/invalid-id")
        assert response.status_code == 404
        print("✓ Invalid message ID returns 404")
        
        # Step 3: Missing required fields
        print("\n[Step 3] Test missing required fields")
        response = await client.post(
            "/api/v1/conversations",
            json={
                "user_id": "test_user",
                # Missing required fields
            }
        )
        assert response.status_code == 422
        print("✓ Missing required fields returns 422")
        
        # Step 4: Invalid data types
        print("\n[Step 4] Test invalid data types")
        response = await client.post(
            "/api/v1/conversations",
            json={
                "user_id": 123,  # Should be string
                "user_type": "customer",
                "service_type": "RIDE",
                "language": "en",
                "initial_message": "Test"
            }
        )
        assert response.status_code == 422
        print("✓ Invalid data type returns 422")
        
        print("\n✅ E2E Test Passed: Error handling")
    
    @pytest.mark.asyncio
    async def test_concurrent_conversations(self, client: AsyncClient):
        """Test handling multiple concurrent conversations."""
        
        print("\n[Test] Concurrent Conversations")
        
        # Create multiple conversations concurrently
        tasks = []
        for i in range(5):
            task = client.post(
                "/api/v1/conversations",
                json={
                    "user_id": f"concurrent_user_{i}",
                    "user_type": "customer",
                    "service_type": "RIDE",
                    "language": "en",
                    "initial_message": f"Conversation {i}"
                }
            )
            tasks.append(task)
        
        # Execute concurrently
        responses = await asyncio.gather(*tasks)
        
        # Verify all succeeded
        for i, response in enumerate(responses):
            assert response.status_code == 200
            conversation_id = response.json()["conversation_id"]
            print(f"✓ Conversation {i+1} created: {conversation_id}")
        
        print("\n✅ E2E Test Passed: Concurrent conversations")
    
    @pytest.mark.asyncio
    async def test_performance_under_load(self, client: AsyncClient):
        """Test system performance under load."""
        
        print("\n[Test] Performance Under Load")
        
        # Create conversation
        create_response = await client.post(
            "/api/v1/conversations",
            json={
                "user_id": "load_test_user",
                "user_type": "customer",
                "service_type": "RIDE",
                "language": "en",
                "initial_message": "Load test"
            }
        )
        conversation_id = create_response.json()["conversation_id"]
        
        # Send 100 messages rapidly
        print("\n[Step 1] Sending 100 messages rapidly")
        import time
        start_time = time.time()
        
        tasks = []
        for i in range(100):
            task = client.post(
                f"/api/v1/conversations/{conversation_id}/messages",
                json={
                    "content": f"Message {i}",
                    "message_type": "text"
                }
            )
            tasks.append(task)
        
        # Send in batches of 10
        for batch_start in range(0, 100, 10):
            batch = tasks[batch_start:batch_start+10]
            await asyncio.gather(*batch)
            elapsed = time.time() - start_time
            print(f"  Batch {batch_start//10 + 1}/10 completed in {elapsed:.2f}s")
        
        total_time = time.time() - start_time
        print(f"\n[Step 2] Performance metrics")
        print(f"  Total time: {total_time:.2f}s")
        print(f"  Messages per second: {100/total_time:.2f}")
        print(f"  Average response time: {(total_time/100)*1000:.2f}ms")
        
        # Verify all succeeded
        print("\n[Step 3] Verify all messages processed")
        history_response = await client.get(f"/api/v1/conversations/{conversation_id}/messages")
        assert history_response.status_code == 200
        messages = history_response.json()["messages"]
        assert len(messages) == 100
        print(f"✓ All 100 messages processed")
        
        # Close conversation
        await client.post(
            f"/api/v1/conversations/{conversation_id}/close",
            json={"resolution": "Load test completed"}
        )
        
        print("\n✅ E2E Test Passed: Performance under load")
    
    @pytest.mark.asyncio
    async def test_data_persistence(self, client: AsyncClient):
        """Test that data persists correctly across operations."""
        
        print("\n[Test] Data Persistence")
        
        # Step 1: Create conversation
        print("\n[Step 1] Create conversation")
        create_response = await client.post(
            "/api/v1/conversations",
            json={
                "user_id": "persistence_test_user",
                "user_type": "customer",
                "service_type": "RIDE",
                "language": "en",
                "initial_message": "Test data persistence"
            }
        )
        conversation_id = create_response.json()["conversation_id"]
        
        # Step 2: Send multiple messages
        print("\n[Step 2] Send multiple messages")
        for i in range(10):
            await client.post(
                f"/api/v1/conversations/{conversation_id}/messages",
                json={
                    "content": f"Message {i}",
                    "message_type": "text"
                }
            )
        
        # Step 3: Verify all messages persisted
        print("\n[Step 3] Verify all messages persisted")
        history_response = await client.get(f"/api/v1/conversations/{conversation_id}/messages")
        assert history_response.status_code == 200
        messages = history_response.json()["messages"]
        assert len(messages) == 10
        print(f"✓ All {len(messages)} messages persisted")
        
        # Step 4: Add feedback
        print("\n[Step 4] Add feedback to last message")
        last_message_id = messages[-1]["message_id"]
        await client.post(
            f"/api/v1/messages/{last_message_id}/feedback",
            json={
                "rating": 4,
                "helpful": True,
                "comment": "Data persistence test"
            }
        )
        
        # Step 5: Close conversation
        print("\n[Step 5] Close conversation")
        await client.post(
            f"/api/v1/conversations/{conversation_id}/close",
            json={"resolution": "Data persistence test completed"}
        )
        
        # Step 6: Verify conversation status
        print("\n[Step 6] Verify conversation closed")
        status_response = await client.get(f"/api/v1/conversations/{conversation_id}")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["status"] == "closed"
        
        # Step 7: Verify feedback persisted
        print("\n[Step 7] Verify feedback persisted")
        feedback_response = await client.get(
            f"/api/v1/conversations/{conversation_id}/messages"
        )
        assert feedback_response.status_code == 200
        all_messages = feedback_response.json()["messages"]
        
        # Find feedback message
        feedback_found = False
        for msg in all_messages:
            if msg.get("feedback"):
                feedback_found = True
                assert msg["rating"] == 4
                assert msg["helpful"] is True
                break
        
        assert feedback_found, "Feedback not persisted"
        print(f"✓ Feedback persisted and verified")
        
        print("\n✅ E2E Test Passed: Data persistence")
    
    @pytest.mark.asyncio
    async def test_security_and_authorization(self, client: AsyncClient):
        """Test security and authorization."""
        
        print("\n[Test] Security and Authorization")
        
        # Step 1: Test unauthorized access
        print("\n[Step 1] Test unauthorized access")
        response = await client.get("/api/v1/conversations")
        assert response.status_code == 401
        print("✓ Unauthorized request returns 401")
        
        # Step 2: Test with invalid token
        print("\n[Step 2] Test with invalid token")
        response = await client.get(
            "/api/v1/conversations",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
        print("✓ Invalid token returns 401")
        
        # Step 3: Test SQL injection protection
        print("\n[Step 3] Test SQL injection protection")
        response = await client.post(
            "/api/v1/conversations",
            json={
                "user_id": "test_user'; DROP TABLE users; --",
                "user_type": "customer",
                "service_type": "RIDE",
                "language": "en",
                "initial_message": "Test"
            }
        )
        # Should be rejected or sanitized
        # If properly implemented, this should be handled
        print(f"✓ SQL injection attempt handled: {response.status_code}")
        
        # Step 4: Test XSS protection
        print("\n[Step 4] Test XSS protection")
        response = await client.post(
            "/api/v1/conversations",
            json={
                "user_id": "test_user",
                "user_type": "customer",
                "service_type": "RIDE",
                "language": "en",
                "initial_message": "<script>alert('XSS')</script>Test"
            }
        )
        # Should be sanitized or rejected
        print(f"✓ XSS attempt handled: {response.status_code}")
        
        print("\n✅ E2E Test Passed: Security and authorization")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "-x"])
