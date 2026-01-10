-- Migration: Create safety_events table
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS safety_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID,
    order_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'SPEEDING',
        'HARD_BRAKING',
        'HARD_ACCELERATION',
        'SHARP_TURN',
        'OFF_ROUTE',
        'LONG_STOP',
        'DEVICE_TAMPER',
        'SUSPICIOUS_BEHAVIOR',
        'ROUTINE_VIOLATION',
        'OTHER'
    )),
    severity VARCHAR(50) NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED', 'REVIEWING', 'CONFIRMED', 'DISMISSED')),
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    address TEXT,
    speed_kmh DOUBLE PRECISION,
    threshold_value DOUBLE PRECISION,
    actual_value DOUBLE PRECISION,
    device_info JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    action_taken VARCHAR(50) CHECK (action_taken IN ('NONE', 'WARNING_SENT', 'DRIVER_SUSPENDED', 'ACCOUNT_FLAGGED', 'INVESTIGATION_INITIATED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_safety_events_trip_id ON safety_events(trip_id);
CREATE INDEX idx_safety_events_order_id ON safety_events(order_id);
CREATE INDEX idx_safety_events_driver_id ON safety_events(driver_id);
CREATE INDEX idx_safety_events_event_type ON safety_events(event_type);
CREATE INDEX idx_safety_events_status ON safety_events(status);
CREATE INDEX idx_safety_events_severity ON safety_events(severity);
CREATE INDEX idx_safety_events_created_at ON safety_events(created_at DESC);

-- Index for events needing review
CREATE INDEX idx_safety_events_review ON safety_events(status, created_at DESC)
WHERE status IN ('DETECTED', 'REVIEWING');

-- Index for high severity events
CREATE INDEX idx_safety_events_high_severity ON safety_events(driver_id, severity, created_at DESC)
WHERE severity IN ('HIGH', 'CRITICAL');

-- Index for location-based queries
CREATE INDEX idx_safety_events_location ON safety_events(location_lat, location_lng);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_safety_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_safety_events_updated_at
    BEFORE UPDATE ON safety_events
    FOR EACH ROW
    EXECUTE FUNCTION update_safety_events_updated_at();

-- Comments
COMMENT ON TABLE safety_events IS 'Stores safety events detected during trips (speeding, hard braking, etc.)';
COMMENT ON COLUMN safety_events.event_type IS 'Type of safety event detected';
COMMENT ON COLUMN safety_events.severity IS 'Severity level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN safety_events.status IS 'Event status: DETECTED, REVIEWING, CONFIRMED, DISMISSED';
COMMENT ON COLUMN safety_events.speed_kmh IS 'Speed at time of event (if applicable)';
COMMENT ON COLUMN safety_events.threshold_value IS 'Threshold that was exceeded';
COMMENT ON COLUMN safety_events.actual_value IS 'Actual value recorded';
COMMENT ON COLUMN safety_events.action_taken IS 'Action taken: NONE, WARNING_SENT, DRIVER_SUSPENDED, etc.';
