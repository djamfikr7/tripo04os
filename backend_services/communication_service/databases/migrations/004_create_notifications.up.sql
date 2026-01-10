-- Migration: Create notifications table
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'ORDER_ASSIGNED',
        'ORDER_CANCELLED',
        'DRIVER_ARRIVED',
        'TRIP_STARTED',
        'TRIP_COMPLETED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'PROMOTION',
        'SYSTEM_ALERT',
        'RATING_REQUEST',
        'NEW_MESSAGE'
    )),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')),
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    expiry_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_delivery_status ON notifications(delivery_status);
CREATE INDEX idx_notifications_read_status ON notifications(read_status);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expiry_at ON notifications(expiry_at) WHERE expiry_at IS NOT NULL;

-- Index for user's unread notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_status, created_at DESC)
WHERE read_status = FALSE;

-- Index for pending delivery
CREATE INDEX idx_notifications_pending_delivery ON notifications(delivery_status, created_at ASC)
WHERE delivery_status = 'PENDING';

-- Partial index for high-priority notifications
CREATE INDEX idx_notifications_high_priority ON notifications(user_id, priority, created_at DESC)
WHERE priority IN ('HIGH', 'URGENT');

-- Comments
COMMENT ON TABLE notifications IS 'Stores system notifications and alerts for users';
COMMENT ON COLUMN notifications.user_id IS 'User ID to receive the notification';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: ORDER_ASSIGNED, DRIVER_ARRIVED, etc.';
COMMENT ON COLUMN notifications.title IS 'Notification title (short, < 255 chars)';
COMMENT ON COLUMN notifications.body IS 'Notification body text';
COMMENT ON COLUMN notifications.data IS 'Additional data payload (order_id, driver_id, etc.)';
COMMENT ON COLUMN notifications.priority IS 'Priority level: LOW, NORMAL, HIGH, URGENT';
COMMENT ON COLUMN notifications.delivery_status IS 'Push notification delivery status';
COMMENT ON COLUMN notifications.read_status IS 'Whether user has opened/read the notification';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was read';
COMMENT ON COLUMN notifications.expiry_at IS 'Optional expiry time for time-sensitive notifications';
COMMENT ON COLUMN notifications.action_url IS 'Optional deep link URL for notification action';
