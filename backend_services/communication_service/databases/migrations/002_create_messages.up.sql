-- Migration: Create messages table
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    sender_role VARCHAR(50) NOT NULL CHECK (sender_role IN ('RIDER', 'DRIVER', 'SYSTEM')),
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'LOCATION', 'IMAGE', 'SYSTEM', 'CANCELLED', 'COMPLETED')),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'READ', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_order_id ON messages(order_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Index for pagination queries
CREATE INDEX idx_messages_pagination ON messages(conversation_id, created_at DESC)
INCLUDE (id, sender_id, content, status);

-- Partial index for undelivered messages
CREATE INDEX idx_messages_undelivered ON messages(conversation_id, status)
WHERE status IN ('SENT', 'FAILED');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Trigger to update conversation message_count and last_message fields
CREATE OR REPLACE FUNCTION update_conversation_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        last_message_content = LEFT(NEW.content, 100)
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_message_stats
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_stats();

-- Comments
COMMENT ON TABLE messages IS 'Stores all chat messages between riders and drivers';
COMMENT ON COLUMN messages.conversation_id IS 'References the conversations table';
COMMENT ON COLUMN messages.order_id IS 'References the Order entity for quick lookup';
COMMENT ON COLUMN messages.sender_id IS 'User ID of the message sender';
COMMENT ON COLUMN messages.receiver_id IS 'User ID of the intended receiver';
COMMENT ON COLUMN messages.sender_role IS 'Role of the sender: RIDER, DRIVER, or SYSTEM';
COMMENT ON COLUMN messages.content IS 'Message content (text, JSON for location data, etc.)';
COMMENT ON COLUMN messages.message_type IS 'Type of message: TEXT, LOCATION, IMAGE, SYSTEM, CANCELLED, COMPLETED';
COMMENT ON COLUMN messages.metadata IS 'Additional metadata (image URL, location coordinates, etc.)';
COMMENT ON COLUMN messages.status IS 'Message delivery status: SENT, DELIVERED, READ, FAILED';
