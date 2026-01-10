-- Migration: Create message_receipts table
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS message_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    delivery_status VARCHAR(50) NOT NULL CHECK (delivery_status IN ('DELIVERED', 'READ')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    device_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_message_user_delivery UNIQUE (message_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_message_receipts_message_id ON message_receipts(message_id);
CREATE INDEX idx_message_receipts_user_id ON message_receipts(user_id);
CREATE INDEX idx_message_receipts_delivery_status ON message_receipts(delivery_status);
CREATE INDEX idx_message_receipts_delivered_at ON message_receipts(delivered_at DESC);
CREATE INDEX idx_message_receipts_read_at ON message_receipts(read_at DESC);

-- Index for finding unread messages
CREATE INDEX idx_message_receipts_unread ON message_receipts(user_id, delivery_status)
WHERE delivery_status = 'DELIVERED';

-- Partial index for finding messages by user
CREATE INDEX idx_message_receipts_user_messages ON message_receipts(user_id, delivery_status)
INCLUDE (message_id, read_at)
WHERE delivery_status IN ('DELIVERED', 'READ');

-- Comments
COMMENT ON TABLE message_receipts IS 'Tracks message delivery and read receipts for each user';
COMMENT ON COLUMN message_receipts.message_id IS 'References the messages table';
COMMENT ON COLUMN message_receipts.user_id IS 'User ID of the recipient who received/read the message';
COMMENT ON COLUMN message_receipts.delivery_status IS 'Status: DELIVERED (received by app), READ (opened by user)';
COMMENT ON COLUMN message_receipts.delivered_at IS 'Timestamp when message was delivered to user device';
COMMENT ON COLUMN message_receipts.read_at IS 'Timestamp when user opened/read the message';
COMMENT ON COLUMN message_receipts.device_id IS 'Optional device identifier for multi-device tracking';
COMMENT ON COLUMN message_receipts.unique_message_user_delivery IS 'Ensures one receipt per user per message';
