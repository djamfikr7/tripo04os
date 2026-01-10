-- Migration: Create conversations table
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    rider_id UUID NOT NULL,
    driver_id UUID,
    vertical VARCHAR(50) NOT NULL CHECK (vertical IN ('RIDE', 'MOTO', 'FOOD', 'GROCERY', 'GOODS', 'TRUCK_VAN')),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'CLOSED')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER NOT NULL DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_conversations_order_id ON conversations(order_id);
CREATE INDEX idx_conversations_rider_id ON conversations(rider_id);
CREATE INDEX idx_conversations_driver_id ON conversations(driver_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);

-- Unique constraint: one active conversation per order
CREATE UNIQUE INDEX idx_conversations_unique_active ON conversations(order_id)
WHERE status = 'ACTIVE';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversations_updated_at();

-- Comments
COMMENT ON TABLE conversations IS 'Stores conversation metadata for order-based messaging between riders and drivers';
COMMENT ON COLUMN conversations.order_id IS 'References the Order entity';
COMMENT ON COLUMN conversations.rider_id IS 'User ID of the rider';
COMMENT ON COLUMN conversations.driver_id IS 'User ID of the assigned driver (if any)';
COMMENT ON COLUMN conversations.vertical IS 'Service vertical type';
COMMENT ON COLUMN conversations.status IS 'Conversation status: ACTIVE (ongoing), ARCHIVED (saved but closed), CLOSED (permanently closed)';
COMMENT ON COLUMN conversations.message_count IS 'Total number of messages in this conversation';
COMMENT ON COLUMN conversations.last_message_at IS 'Timestamp of the last message';
COMMENT ON COLUMN conversations.last_message_content IS 'Preview of the last message content';
