-- Migration: Create ride_checks table
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS ride_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    order_id UUID NOT NULL,
    rider_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    check_type VARCHAR(50) NOT NULL CHECK (check_type IN ('SCHEDULED', 'MANUAL', 'AUTOMATED')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED')),
    check_time TIMESTAMP WITH TIME ZONE,
    response_time TIMESTAMP WITH TIME ZONE,
    response_type VARCHAR(50) CHECK (response_type IN ('OK', 'CONCERN', 'DISTRESS', 'NO_RESPONSE', 'SYSTEM_ERROR')),
    driver_location_lat DOUBLE PRECISION,
    driver_location_lng DOUBLE PRECISION,
    rider_location_lat DOUBLE PRECISION,
    rider_location_lng DOUBLE PRECISION,
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_ride_checks_trip_id ON ride_checks(trip_id);
CREATE INDEX idx_ride_checks_order_id ON ride_checks(order_id);
CREATE INDEX idx_ride_checks_rider_id ON ride_checks(rider_id);
CREATE INDEX idx_ride_checks_driver_id ON ride_checks(driver_id);
CREATE INDEX idx_ride_checks_status ON ride_checks(status);
CREATE INDEX idx_ride_checks_scheduled_for ON ride_checks(scheduled_for);
CREATE INDEX idx_ride_checks_check_time ON ride_checks(check_time DESC);

-- Index for scheduled checks that need to be executed
CREATE INDEX idx_ride_checks_pending ON ride_checks(status, scheduled_for)
WHERE status = 'SCHEDULED' AND scheduled_for IS NOT NULL;

-- Index for checks requiring follow-up
CREATE INDEX idx_ride_checks_followup ON ride_checks(follow_up_required, check_time DESC)
WHERE follow_up_required = TRUE;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ride_checks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ride_checks_updated_at
    BEFORE UPDATE ON ride_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_ride_checks_updated_at();

-- Comments
COMMENT ON TABLE ride_checks IS 'Stores ride check/safety check records for active trips';
COMMENT ON COLUMN ride_checks.check_type IS 'Type of check: SCHEDULED (automated), MANUAL (triggered), AUTOMATED (system-generated)';
COMMENT ON COLUMN ride_checks.status IS 'Check status: SCHEDULED, IN_PROGRESS, COMPLETED, SKIPPED, FAILED';
COMMENT ON COLUMN ride_checks.response_type IS 'Rider response: OK (fine), CONCERN (worried), DISTRESS (danger), NO_RESPONSE, SYSTEM_ERROR';
COMMENT ON COLUMN ride_checks.follow_up_required IS 'Whether additional follow-up is needed';
COMMENT ON COLUMN ride_checks.scheduled_for IS 'When the check was scheduled to occur';
COMMENT ON COLUMN ride_checks.check_time IS 'When the check was actually performed';
