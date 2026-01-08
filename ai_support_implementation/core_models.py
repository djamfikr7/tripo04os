"""
AI Support Automation - Core Models
Phase 1: Foundation
Innovation: AI-Powered Support Automation
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON, Index, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

Base = declarative_base()


class ChannelType(str, enum.Enum):
    """Support channel types"""
    CHAT = "CHAT"
    VOICE = "VOICE"
    EMAIL = "EMAIL"


class ConversationStatus(str, enum.Enum):
    """Conversation status types"""
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"


class SenderType(str, enum.Enum):
    """Message sender types"""
    USER = "USER"
    AI = "AI"
    AGENT = "AGENT"
    SYSTEM = "SYSTEM"


class MessageType(str, enum.Enum):
    """Message types"""
    TEXT = "TEXT"
    VOICE_TRANSCRIPT = "VOICE_TRANSCRIPT"
    SYSTEM = "SYSTEM"


class PriorityType(str, enum.Enum):
    """Priority types"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class AvailabilityStatus(str, enum.Enum):
    """Agent availability status"""
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"


class SupportConversation(Base):
    """Support conversations table"""
    __tablename__ = "support_conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    channel = Column(SQLEnum(ChannelType), nullable=True)
    status = Column(SQLEnum(ConversationStatus), default=ConversationStatus.OPEN, index=True)
    ai_handled = Column(Boolean, default=True)
    sentiment_score = Column(Float, nullable=True)
    priority = Column(SQLEnum(PriorityType), default=PriorityType.LOW)
    assigned_agent_id = Column(UUID(as_uuid=True), nullable=True)
    escalation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "channel": self.channel.value if self.channel else None,
            "status": self.status.value,
            "ai_handled": self.ai_handled,
            "sentiment_score": self.sentiment_score,
            "priority": self.priority.value,
            "assigned_agent_id": str(self.assigned_agent_id) if self.assigned_agent_id else None,
            "escalation_reason": self.escalation_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class SupportMessage(Base):
    """Support messages table"""
    __tablename__ = "support_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("support_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(SQLEnum(SenderType), nullable=False)
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT, nullable=False)
    content = Column(Text, nullable=False)
    audio_url = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    language_code = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "conversation_id": str(self.conversation_id),
            "sender": self.sender.value,
            "message_type": self.message_type.value,
            "content": self.content,
            "audio_url": self.audio_url,
            "confidence_score": self.confidence_score,
            "language_code": self.language_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AIKnowledgeBase(Base):
    """AI knowledge base table"""
    __tablename__ = "ai_knowledge_base"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String, nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    keywords = Column(JSON, nullable=False)
    usage_count = Column(Integer, default=0)
    success_rate = Column(Float, default=1.0, index=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "category": self.category,
            "question": self.question,
            "answer": self.answer,
            "keywords": self.keywords,
            "usage_count": self.usage_count,
            "success_rate": self.success_rate,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AIResponseFeedback(Base):
    """AI response feedback table"""
    __tablename__ = "ai_response_feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("support_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("support_conversations.id", ondelete="CASCADE"), nullable=False)
    user_rating = Column(Integer, nullable=True)
    was_helpful = Column(Boolean, nullable=False)
    follow_up_required = Column(Boolean, default=False)
    user_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "message_id": str(self.message_id),
            "conversation_id": str(self.conversation_id),
            "user_rating": self.user_rating,
            "was_helpful": self.was_helpful,
            "follow_up_required": self.follow_up_required,
            "user_comment": self.user_comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SupportAgent(Base):
    """Support agents table"""
    __tablename__ = "support_agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    specialization = Column(JSON, nullable=True)
    language_skills = Column(JSON, nullable=True)
    availability_status = Column(SQLEnum(AvailabilityStatus), default=AvailabilityStatus.OFFLINE, index=True)
    current_conversation_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "specialization": self.specialization,
            "language_skills": self.language_skills,
            "availability_status": self.availability_status.value,
            "current_conversation_id": str(self.current_conversation_id) if self.current_conversation_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class EscalationRule(Base):
    """Escalation rules table"""
    __tablename__ = "escalation_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_name = Column(String, nullable=False)
    condition = Column(JSON, nullable=False)
    action = Column(JSON, nullable=False)
    priority = Column(Integer, nullable=False)
    active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "rule_name": self.rule_name,
            "condition": self.condition,
            "action": self.action,
            "priority": self.priority,
            "active": self.active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AIPerformanceMetrics(Base):
    """AI performance metrics table"""
    __tablename__ = "ai_performance_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(String, nullable=False, unique=True)  # YYYY-MM-DD format
    total_conversations = Column(Integer, default=0)
    ai_handled_conversations = Column(Integer, default=0)
    human_handled_conversations = Column(Integer, default=0)
    automation_rate = Column(Float, default=0.0)
    avg_confidence_score = Column(Float, default=0.0)
    avg_response_time_seconds = Column(Float, default=0.0)
    avg_resolution_time_minutes = Column(Float, default=0.0)
    user_satisfaction_score = Column(Float, default=0.0)
    first_contact_resolution_rate = Column(Float, default=0.0)
    escalation_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "date": self.date,
            "total_conversations": self.total_conversations,
            "ai_handled_conversations": self.ai_handled_conversations,
            "human_handled_conversations": self.human_handled_conversations,
            "automation_rate": self.automation_rate,
            "avg_confidence_score": self.avg_confidence_score,
            "avg_response_time_seconds": self.avg_response_time_seconds,
            "avg_resolution_time_minutes": self.avg_resolution_time_minutes,
            "user_satisfaction_score": self.user_satisfaction_score,
            "first_contact_resolution_rate": self.first_contact_resolution_rate,
            "escalation_rate": self.escalation_rate,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
