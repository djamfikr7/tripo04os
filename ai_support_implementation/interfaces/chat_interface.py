"""
Chat Interface for AI Support System
Provides real-time chat interface for user support conversations
"""

import asyncio
from typing import Optional, Dict, List
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from ai_engine import AIEngine
from core_models import (
    SupportConversation,
    SupportMessage,
    MessageRole,
    MessageType,
    ConversationStatus
)


class ChatMessage(BaseModel):
    """Chat message model for WebSocket communication."""
    role: MessageRole
    content: str
    message_type: MessageType = MessageType.TEXT
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict] = None


class ChatResponse(BaseModel):
    """Chat response model."""
    message_id: str
    role: MessageRole
    content: str
    message_type: MessageType
    timestamp: datetime
    confidence: Optional[float] = None
    escalated: bool = False
    suggested_questions: Optional[List[str]] = None


class ChatInterface:
    """Manages chat interface for support conversations."""
    
    def __init__(self, ai_engine: AIEngine):
        self.ai_engine = ai_engine
        self.active_connections: Dict[str, WebSocket] = {}
        self.conversation_sessions: Dict[str, str] = {}  # user_id -> conversation_id
    
    async def handle_websocket_connection(
        self, 
        websocket: WebSocket, 
        conversation_id: str,
        user_id: str
    ):
        """
        Handle new WebSocket connection for chat.
        
        Args:
            websocket: WebSocket connection
            conversation_id: Conversation ID
            user_id: User ID
        """
        # Store connection
        self.active_connections[conversation_id] = websocket
        
        # Send welcome message
        welcome_message = ChatMessage(
            role=MessageRole.ASSISTANT,
            content="Hello! I'm your AI support assistant. How can I help you today?",
            message_type=MessageType.TEXT,
            timestamp=datetime.utcnow()
        )
        
        await websocket.send_json(welcome_message.dict())
        
        # Load conversation history
        history = await self.ai_engine.get_conversation_history(conversation_id)
        
        if history:
            # Send recent messages (last 10)
            recent_messages = history[-10:]
            for msg in recent_messages:
                chat_msg = ChatMessage(
                    role=msg.role,
                    content=msg.content,
                    message_type=msg.message_type,
                    timestamp=msg.created_at
                )
                await websocket.send_json(chat_msg.dict())
        
        print(f"User {user_id} connected to conversation {conversation_id}")
    
    async def handle_chat_message(
        self,
        conversation_id: str,
        message: ChatMessage
    ) -> ChatResponse:
        """
        Process incoming chat message and generate AI response.
        
        Args:
            conversation_id: Conversation ID
            message: Chat message from user
            
        Returns:
            ChatResponse with AI-generated reply
        """
        try:
            # Process message through AI engine
            response = await self.ai_engine.process_message(
                conversation_id=conversation_id,
                message=message.content,
                message_type=message.message_type.value,
                user_id=message.metadata.get("user_id") if message.metadata else None
            )
            
            # Create chat response
            chat_response = ChatResponse(
                message_id=response.get("message_id", ""),
                role=MessageRole.ASSISTANT,
                content=response["response"],
                message_type=MessageType.TEXT,
                timestamp=datetime.utcnow(),
                confidence=response.get("confidence"),
                escalated=response.get("escalated", False),
                suggested_questions=response.get("suggested_questions")
            )
            
            return chat_response
            
        except Exception as e:
            # Handle errors gracefully
            error_response = ChatResponse(
                message_id="",
                role=MessageRole.ASSISTANT,
                content=f"I apologize, but I encountered an error processing your request. Please try again or contact human support.",
                message_type=MessageType.TEXT,
                timestamp=datetime.utcnow(),
                confidence=0.0,
                escalated=True  # Escalate on error
            )
            
            return error_response
    
    async def broadcast_message(
        self,
        conversation_id: str,
        message: ChatMessage,
        exclude_user_id: Optional[str] = None
    ):
        """
        Broadcast message to all connections in a conversation.
        
        Args:
            conversation_id: Conversation ID
            message: Message to broadcast
            exclude_user_id: User ID to exclude (sender)
        """
        if conversation_id not in self.active_connections:
            return
        
        websocket = self.active_connections[conversation_id]
        await websocket.send_json(message.dict())
        
        print(f"Broadcasted message to conversation {conversation_id}")
    
    async def handle_disconnection(
        self,
        conversation_id: str,
        user_id: str
    ):
        """
        Handle WebSocket disconnection.
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID
        """
        if conversation_id in self.active_connections:
            del self.active_connections[conversation_id]
        
        if user_id in self.conversation_sessions:
            del self.conversation_sessions[user_id]
        
        print(f"User {user_id} disconnected from conversation {conversation_id}")
    
    async def get_typing_indicator(
        self,
        conversation_id: str
    ) -> Dict[str, int]:
        """
        Get typing indicator for conversation.
        
        Args:
            conversation_id: Conversation ID
            
        Returns:
            Dict with typing status and user count
        """
        user_count = len([c for c in self.active_connections.keys() if c.startswith(conversation_id)])
        
        return {
            "is_typing": False,  # Could be enhanced with actual typing detection
            "active_users": user_count
        }
    
    async def send_suggested_questions(
        self,
        conversation_id: str
    ):
        """
        Send suggested follow-up questions based on conversation context.
        
        Args:
            conversation_id: Conversation ID
        """
        try:
            # Get conversation context
            context = await self.ai_engine.get_conversation_context(conversation_id)
            
            # Generate suggested questions based on recent messages
            suggestions = await self._generate_suggestions(context)
            
            if suggestions:
                suggestion_message = ChatMessage(
                    role=MessageRole.ASSISTANT,
                    content="Here are some related questions that might help:",
                    message_type=MessageType.TEXT,
                    timestamp=datetime.utcnow(),
                    metadata={"suggestions": suggestions}
                )
                
                await self.broadcast_message(conversation_id, suggestion_message)
        
        except Exception as e:
            print(f"Error generating suggestions: {e}")
    
    async def _generate_suggestions(
        self,
        context: Dict
    ) -> List[str]:
        """
        Generate suggested questions based on conversation context.
        
        Args:
            context: Conversation context
            
        Returns:
            List of suggested questions
        """
        suggestions = []
        
        # Get last user message
        messages = context.get("messages", [])
        if not messages:
            return suggestions
        
        last_user_message = None
        for msg in reversed(messages):
            if msg["role"] == MessageRole.USER.value:
                last_user_message = msg["content"]
                break
        
        if not last_user_message:
            return suggestions
        
        # Generate suggestions based on keywords
        message_lower = last_user_message.lower()
        
        # Refund-related suggestions
        if any(word in message_lower for word in ["refund", "money", "charge", "fee"]):
            suggestions.extend([
                "How do I request a refund?",
                "What is the refund policy?",
                "How long does a refund take?",
                "Why was I charged a cancellation fee?"
            ])
        
        # Booking-related suggestions
        elif any(word in message_lower for word in ["book", "ride", "order", "schedule"]):
            suggestions.extend([
                "How do I book a ride?",
                "Can I schedule a ride for later?",
                "How do I cancel my booking?",
                "What ride types are available?"
            ])
        
        # Account-related suggestions
        elif any(word in message_lower for word in ["account", "password", "login", "profile"]):
            suggestions.extend([
                "How do I reset my password?",
                "How do I update my profile?",
                "How do I change my phone number?",
                "How do I delete my account?"
            ])
        
        # Payment-related suggestions
        elif any(word in message_lower for word in ["payment", "card", "wallet"]):
            suggestions.extend([
                "How do I add a payment method?",
                "What payment methods do you accept?",
                "How do I view my payment history?",
                "How do I remove a payment method?"
            ])
        
        # Safety-related suggestions
        elif any(word in message_lower for word in ["safety", "emergency", "sos", "help"]):
            suggestions.extend([
                "How does the SOS feature work?",
                "How do I share my trip with someone?",
                "What safety features are available?",
                "How do I report a safety incident?"
            ])
        
        # Limit to top 3 suggestions
        return suggestions[:3]
    
    async def get_conversation_stats(
        self,
        conversation_id: str
    ) -> Dict:
        """
        Get statistics for a conversation.
        
        Args:
            conversation_id: Conversation ID
            
        Returns:
            Dict with conversation statistics
        """
        try:
            history = await self.ai_engine.get_conversation_history(conversation_id)
            
            if not history:
                return {
                    "total_messages": 0,
                    "user_messages": 0,
                    "assistant_messages": 0,
                    "escalated": False
                }
            
            user_messages = [m for m in history if m.role == MessageRole.USER]
            assistant_messages = [m for m in history if m.role == MessageRole.ASSISTANT]
            
            # Check if escalated
            escalated = any(
                m.metadata.get("escalated", False) 
                for m in assistant_messages
            )
            
            return {
                "total_messages": len(history),
                "user_messages": len(user_messages),
                "assistant_messages": len(assistant_messages),
                "escalated": escalated,
                "automation_rate": len(assistant_messages) / len(history) if history else 0
            }
        
        except Exception as e:
            print(f"Error getting conversation stats: {e}")
            return {
                "total_messages": 0,
                "error": str(e)
            }
    
    def get_active_connections_count(self) -> int:
        """Get count of active WebSocket connections."""
        return len(self.active_connections)
    
    def get_connection_info(self) -> List[Dict]:
        """Get information about all active connections."""
        connections_info = []
        
        for conversation_id, websocket in self.active_connections.items():
            connections_info.append({
                "conversation_id": conversation_id,
                "connected": True,
                "user_count": len([c for c in self.active_connections.keys() if c.startswith(conversation_id)])
            })
        
        return connections_info


# HTML templates for chat interface
CHAT_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tripo04OS AI Support Chat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .chat-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .chat-header {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            color: white;
            margin-bottom: 20px;
        }
        
        .chat-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        
        .chat-header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        
        .chat-messages {
            flex: 1;
            background: white;
            border-radius: 10px;
            padding: 20px;
            overflow-y: auto;
            max-height: calc(100vh - 200px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .message {
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 10px;
            max-width: 80%;
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .message.user {
            background: #f0f0f0;
            margin-left: auto;
        }
        
        .message.assistant {
            background: #e3f2fd;
            margin-right: auto;
        }
        
        .message.escalated {
            background: #fff3cd;
            border: 2px solid #dc3545;
        }
        
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
            color: #666;
        }
        
        .message-role {
            font-weight: 600;
            margin-right: 8px;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            font-size: 10px;
        }
        
        .message-role.user {
            background: #e3f2fd;
            color: white;
        }
        
        .message-role.assistant {
            background: #f0f0f0;
            color: white;
        }
        
        .message-content {
            line-height: 1.6;
            color: #333;
        }
        
        .message-timestamp {
            font-size: 11px;
            color: #999;
            margin-top: 8px;
        }
        
        .message-confidence {
            display: inline-block;
            margin-left: 10px;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .confidence-high {
            background: #10b981;
            color: white;
        }
        
        .confidence-medium {
            background: #f59e0b;
            color: white;
        }
        
        .confidence-low {
            background: #ef4444;
            color: white;
        }
        
        .suggested-questions {
            margin-top: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .suggested-questions h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #667eea;
        }
        
        .suggested-questions ul {
            list-style: none;
            padding: 0;
        }
        
        .suggested-questions li {
            padding: 8px 0;
            margin-bottom: 5px;
        }
        
        .suggested-questions a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }
        
        .suggested-questions a:hover {
            color: #764ba2;
            text-decoration: underline;
        }
        
        .chat-input-container {
            background: white;
            padding: 20px;
            border-radius: 10px 10px 10px 10px;
            box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .chat-input-wrapper {
            display: flex;
            gap: 10px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .chat-input {
            flex: 1;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .chat-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .send-button {
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .send-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
        }
        
        .typing-indicator {
            display: inline-block;
            padding: 8px 16px;
            background: #f0f0f0;
            border-radius: 20px;
            font-size: 12px;
            color: #666;
            margin-left: 10px;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .connection-status {
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .status-online {
            color: #10b981;
        }
        
        .status-offline {
            color: #ef4444;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h1>🤖️ Tripo04OS AI Support</h1>
            <p>Your intelligent assistant for rides, food delivery, and more</p>
        </div>
        
        <div id="chat-messages" class="chat-messages">
            <!-- Messages will be dynamically inserted here -->
        </div>
        
        <div class="chat-input-container">
            <div class="connection-status" id="connection-status">
                <span class="status-online">● Connected</span>
            </div>
            <div class="chat-input-wrapper">
                <input 
                    type="text" 
                    id="chat-input" 
                    class="chat-input" 
                    placeholder="Type your message here..."
                    autocomplete="off"
                >
                <button class="send-button" onclick="sendMessage()">
                    Send
                </button>
            </div>
        </div>
    </div>
    
    <script>
        let conversationId = '{{ conversation_id }}';
        let ws = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        // Connect to WebSocket
        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/conversations/${conversationId}`;
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                console.log('Connected to chat server');
                document.getElementById('connection-status').innerHTML = 
                    '<span class="status-online">● Connected</span>';
                reconnectAttempts = 0;
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                displayMessage(message);
            };
            
            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                document.getElementById('connection-status').innerHTML = 
                    '<span class="status-offline">● Connection Error</span>';
            };
            
            ws.onclose = function() {
                console.log('Disconnected from chat server');
                document.getElementById('connection-status').innerHTML = 
                    '<span class="status-offline">● Disconnected</span>';
                
                // Attempt to reconnect
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    setTimeout(connect, 3000);
                }
            };
        }
        
        // Display message in chat
        function displayMessage(message) {
            const messagesDiv = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            
            const roleClass = message.role === 'user' ? 'user' : 'assistant';
            const escalatedClass = message.escalated ? 'escalated' : '';
            
            messageDiv.className = `message ${roleClass} ${escalatedClass}`;
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-role ${roleClass}">${message.role}</span>
                    <span class="message-timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="message-content">${message.content}</div>
                ${message.confidence ? `<span class="message-confidence ${getConfidenceClass(message.confidence)}">${(message.confidence * 100).toFixed(0)}% confident</span>` : ''}
                ${message.suggested_questions ? `
                    <div class="suggested-questions">
                        <h4>💡 Suggested Questions:</h4>
                        <ul>
                            ${message.suggested_questions.map(q => `<li><a href="#" onclick="sendSuggestedQuestion('${q}')">${q}</a></li>`).join('')}
                        </ul>
                    </div>
                ` : ''
            `;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // Get confidence class
        function getConfidenceClass(confidence) {
            if (confidence >= 0.8) return 'confidence-high';
            if (confidence >= 0.5) return 'confidence-medium';
            return 'confidence-low';
        }
        
        // Send message
        function sendMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    role: 'user',
                    content: message,
                    message_type: 'text',
                    timestamp: new Date().toISOString()
                }));
                
                input.value = '';
            } else {
                alert('Not connected to chat server');
            }
        }
        
        // Send suggested question
        function sendSuggestedQuestion(question) {
            document.getElementById('chat-input').value = question;
            sendMessage();
        }
        
        // Handle Enter key
        document.getElementById('chat-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Connect on page load
        window.addEventListener('load', connect);
    </script>
</body>
</html>
"""


def get_chat_html(conversation_id: str) -> str:
    """Generate HTML for chat interface."""
    return CHAT_HTML_TEMPLATE.replace('{{ conversation_id }}', conversation_id)


def get_chat_interface_html() -> str:
    """Get simplified chat interface HTML."""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tripo04OS AI Support</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .chat-container {
            border: 1px solid #ddd;
            border-radius: 10px;
            overflow: hidden;
        }
        .chat-header {
            background: #667eea;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .chat-messages {
            height: 400px;
            overflow-y: auto;
            padding: 20px;
            background: #f9f9f9;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
            max-width: 80%;
        }
        .message.user {
            background: #e3f2fd;
            margin-left: auto;
        }
        .message.assistant {
            background: #f0f0f0;
            margin-right: auto;
        }
        .chat-input {
            display: flex;
            padding: 20px;
            background: white;
            border-top: 1px solid #ddd;
        }
        .chat-input input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin-right: 10px;
        }
        .chat-input button {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h2>AI Support Chat</h2>
        </div>
        <div class="chat-messages" id="messages">
            <!-- Messages will appear here -->
        </div>
        <div class="chat-input">
            <input type="text" id="messageInput" placeholder="Type your message...">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>
    <script>
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (message) {
                // Send via WebSocket
                console.log('Sending:', message);
                input.value = '';
            }
        }
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
    """
