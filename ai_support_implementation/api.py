"""
AI Support Automation - API Layer
Phase 1: Foundation
Innovation: AI-Powered Support Automation
Framework: FastAPI
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import logging

from .core_models import (
    SupportConversation,
    SupportMessage,
    AIKnowledgeBase,
    AIResponseFeedback,
    SupportAgent,
    EscalationRule,
    AIPerformanceMetrics,
    ChannelType,
    ConversationStatus,
    SenderType,
    MessageType,
    PriorityType,
    AvailabilityStatus
)

from .ai_engine import AIEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Support Automation API",
    description="AI-Powered Support Automation System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize AI Engine
ai_engine = None


@app.on_event("startup")
async def startup_event():
    """Initialize AI engine on startup"""
    global ai_engine
    config = {
        "intent_model_path": "models/intent-classifier",
        "response_model_path": "models/response-generator",
        "sentence_transformer_path": "models/sentence-transformer",
        "knowledge_base_path": "data/knowledge-base.json",
    }
    ai_engine = AIEngine(config)
    logger.info("AI Support API started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global ai_engine
    ai_engine = None
    logger.info("AI Support API stopped")


# Pydantic Models
class ConversationCreate(BaseModel):
    """Request model for creating conversation"""
    channel: ChannelType
    message: str = Field(..., min_length=1, max_length=5000)
    order_id: Optional[uuid.UUID] = None


class MessageCreate(BaseModel):
    """Request model for sending message"""
    message: str = Field(..., min_length=1, max_length=5000)
    message_type: MessageType = MessageType.TEXT


class EscalateRequest(BaseModel):
    """Request model for escalating conversation"""
    reason: str = Field(..., min_length=1, max_length=500)
    priority: PriorityType = PriorityType.MEDIUM


class FeedbackRequest(BaseModel):
    """Request model for providing feedback"""
    message_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    was_helpful: bool
    comment: Optional[str] = Field(None, max_length=1000)


class KnowledgeBaseEntry(BaseModel):
    """Request model for knowledge base entry"""
    category: str = Field(..., min_length=1, max_length=100)
    question: str = Field(..., min_length=1, max_length=500)
    answer: str = Field(..., min_length=1, max_length=2000)
    keywords: List[str] = Field(..., min_items=1, max_items=20)


class AgentStatusUpdate(BaseModel):
    """Request model for updating agent status"""
    status: AvailabilityStatus


class AgentAssignment(BaseModel):
    """Request model for assigning conversation to agent"""
    conversation_id: uuid.UUID


# API Endpoints

@app.post("/api/v1/support/conversations", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: ConversationCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Create or continue support conversation
    
    Args:
        request: Conversation creation request
        credentials: Authorization credentials
        
    Returns:
        Created conversation with AI response
    """
    try:
        # Validate user from token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Create conversation
        conversation_id = str(uuid.uuid4())
        
        # Process message with AI
        ai_response = await ai_engine.process_message(
            conversation_id=conversation_id,
            user_id=str(user_id),
            message=request.message,
            message_type=MessageType.TEXT,
            language_code="en"
        )
        
        # Return response
        return {
            "conversation_id": conversation_id,
            "ai_response": ai_response.get("response"),
            "confidence_score": ai_response.get("confidence_score"),
            "status": ConversationStatus.OPEN.value,
            "message_id": ai_response.get("message_id"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/support/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: uuid.UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get conversation details
    
    Args:
        conversation_id: Conversation ID
        credentials: Authorization credentials
        
    Returns:
        Conversation details with messages
    """
    try:
        # Validate user from token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get conversation from database (placeholder)
        # In real implementation, this would query the database
        conversation = {
            "id": str(conversation_id),
            "user_id": str(user_id),
            "channel": ChannelType.CHAT.value,
            "status": ConversationStatus.OPEN.value,
            "messages": [],
            "ai_handled": True,
            "sentiment_score": 0.0,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/support/conversations/{conversation_id}/message")
async def send_message(
    conversation_id: uuid.UUID,
    request: MessageCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Send message to conversation
    
    Args:
        conversation_id: Conversation ID
        request: Message creation request
        credentials: Authorization credentials
        
    Returns:
        AI response to message
    """
    try:
        # Validate user from token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Process message with AI
        ai_response = await ai_engine.process_message(
            conversation_id=str(conversation_id),
            user_id=str(user_id),
            message=request.message,
            message_type=request.message_type,
            language_code="en"
        )
        
        # Return response
        return {
            "message_id": ai_response.get("message_id"),
            "ai_response": ai_response.get("response"),
            "confidence_score": ai_response.get("confidence_score"),
            "processing_time_ms": ai_response.get("processing_time_ms"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/support/conversations/{conversation_id}/escalate")
async def escalate_conversation(
    conversation_id: uuid.UUID,
    request: EscalateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Escalate conversation to human agent
    
    Args:
        conversation_id: Conversation ID
        request: Escalation request
        credentials: Authorization credentials
        
    Returns:
        Escalation confirmation
    """
    try:
        # Validate user from token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Find available agent (placeholder)
        agent_id = await _find_available_agent()
        
        if not agent_id:
            raise HTTPException(status_code=503, detail="No agents available")
        
        # Update conversation status (placeholder)
        # In real implementation, this would update the database
        
        return {
            "escalated": True,
            "agent_assigned": True,
            "agent_id": str(agent_id),
            "estimated_wait_time_minutes": 5,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error escalating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/support/conversations/{conversation_id}/feedback")
async def submit_feedback(
    conversation_id: uuid.UUID,
    request: FeedbackRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Provide feedback on AI response
    
    Args:
        conversation_id: Conversation ID
        request: Feedback request
        credentials: Authorization credentials
        
    Returns:
        Feedback confirmation
    """
    try:
        # Validate user from token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Store feedback (placeholder)
        # In real implementation, this would store in database
        
        return {
            "feedback_recorded": True,
            "message_id": str(request.message_id),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/support/knowledge-base")
async def get_knowledge_base(
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get knowledge base entries
    
    Args:
        category: Filter by category
        limit: Number of entries to return
        offset: Number of entries to skip
        credentials: Authorization credentials
        
    Returns:
        Knowledge base entries
    """
    try:
        # Validate admin token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if admin (placeholder)
        is_admin = await _check_admin(user_id)
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get knowledge base entries (placeholder)
        # In real implementation, this would query the database
        entries = []
        
        return {
            "entries": entries,
            "total": len(entries),
            "limit": limit,
            "offset": offset,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting knowledge base: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/support/knowledge-base", status_code=status.HTTP_201_CREATED)
async def create_knowledge_entry(
    request: KnowledgeBaseEntry,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Add knowledge base entry
    
    Args:
        request: Knowledge base entry request
        credentials: Authorization credentials
        
    Returns:
        Created entry
    """
    try:
        # Validate admin token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if admin (placeholder)
        is_admin = await _check_admin(user_id)
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Create knowledge base entry (placeholder)
        entry_id = str(uuid.uuid4())
        
        return {
            "entry_id": entry_id,
            "created": True,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating knowledge entry: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/support/agents/available")
async def get_available_agents(
    specialization: Optional[str] = None,
    language: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get available support agents
    
    Args:
        specialization: Filter by specialization
        language: Filter by language
        credentials: Authorization credentials
        
    Returns:
        Available agents
    """
    try:
        # Validate admin token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if admin (placeholder)
        is_admin = await _check_admin(user_id)
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get available agents (placeholder)
        # In real implementation, this would query the database
        agents = []
        
        return {
            "agents": agents,
            "total": len(agents),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting available agents: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/support/analytics/performance")
async def get_performance_metrics(
    start_date: str,
    end_date: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get AI performance metrics
    
    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        credentials: Authorization credentials
        
    Returns:
        Performance metrics
    """
    try:
        # Validate admin token
        user_id = await _validate_token(credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if admin (placeholder)
        is_admin = await _check_admin(user_id)
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get performance metrics (placeholder)
        # In real implementation, this would query the database
        metrics = {
            "date": start_date,
            "total_conversations": 1000,
            "ai_handled_conversations": 800,
            "human_handled_conversations": 200,
            "automation_rate": 0.8,
            "avg_confidence_score": 0.85,
            "avg_response_time_seconds": 0.5,
            "avg_resolution_time_minutes": 5.0,
            "user_satisfaction_score": 4.3,
            "first_contact_resolution_rate": 0.85,
            "escalation_rate": 0.2,
        }
        
        return metrics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# WebSocket Endpoint
@app.websocket("/ws/support/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: str
):
    """
    WebSocket endpoint for real-time communication
    
    Args:
        websocket: WebSocket connection
        conversation_id: Conversation ID
    """
    try:
        await websocket.accept()
        logger.info(f"WebSocket connected for conversation {conversation_id}")
        
        # Send welcome message
        await websocket.send_json({
            "type": "CONNECTED",
            "conversation_id": conversation_id,
            "timestamp": datetime.utcnow().isoformat(),
        })
        
        # Handle messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_json()
                
                # Process message
                if data.get("type") == "SEND_MESSAGE":
                    # Get user ID from token (simplified)
                    user_id = data.get("user_id")
                    
                    # Process with AI
                    ai_response = await ai_engine.process_message(
                        conversation_id=conversation_id,
                        user_id=user_id,
                        message=data.get("message"),
                        message_type=MessageType.TEXT,
                        language_code="en"
                    )
                    
                    # Send AI response
                    await websocket.send_json({
                        "type": "AI_RESPONSE",
                        "conversation_id": conversation_id,
                        "message_id": ai_response.get("message_id"),
                        "response": ai_response.get("response"),
                        "confidence_score": ai_response.get("confidence_score"),
                        "processing_time_ms": ai_response.get("processing_time_ms"),
                    })
                
                elif data.get("type") == "ESCALATE":
                    # Handle escalation
                    agent_id = await _find_available_agent()
                    
                    if agent_id:
                        await websocket.send_json({
                            "type": "AGENT_ASSIGNED",
                            "conversation_id": conversation_id,
                            "agent_id": str(agent_id),
                            "agent_name": "Support Agent",
                            "estimated_wait_time_minutes": 5,
                        })
                    else:
                        await websocket.send_json({
                            "type": "ERROR",
                            "code": "NO_AGENTS_AVAILABLE",
                            "message": "No agents available at this time",
                        })
                
                elif data.get("type") == "SUBMIT_FEEDBACK":
                    # Handle feedback
                    await websocket.send_json({
                        "type": "FEEDBACK_RECEIVED",
                        "message_id": data.get("message_id"),
                        "status": "recorded",
                    })
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for conversation {conversation_id}")
                break
            except Exception as e:
                logger.error(f"Error in WebSocket: {str(e)}")
                await websocket.send_json({
                    "type": "ERROR",
                    "code": "INTERNAL_ERROR",
                    "message": str(e),
                })
                
    except Exception as e:
        logger.error(f"Error in WebSocket endpoint: {str(e)}")


# Helper Functions

async def _validate_token(credentials: HTTPAuthorizationCredentials) -> Optional[str]:
    """
    Validate JWT token and return user ID
    
    Args:
        credentials: Authorization credentials
        
    Returns:
        User ID if valid, None otherwise
    """
    # In real implementation, this would validate JWT token
    # and return user ID
    return "user_id_placeholder"


async def _check_admin(user_id: str) -> bool:
    """
    Check if user is admin
    
    Args:
        user_id: User ID
        
    Returns:
        True if admin, False otherwise
    """
    # In real implementation, this would check user roles
    return True


async def _find_available_agent() -> Optional[uuid.UUID]:
    """
    Find available support agent
    
    Returns:
        Agent ID if available, None otherwise
    """
    # In real implementation, this would query database for available agents
    return uuid.uuid4()


# Health Check Endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }


# Root Endpoint
@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "AI Support Automation API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
