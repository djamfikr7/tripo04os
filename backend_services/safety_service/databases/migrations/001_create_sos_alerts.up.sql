-- Migration: Create sos_alerts table
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    order_id UUID NOT NULL,
    rider_id UUID NOT NULL,
    driver_id UUID,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('EMERGENCY', 'MEDICAL', 'ACCIDENT', 'HARASSMENT', 'OTHER')),
    severity VARCHAR(50) NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'FALSE_ALARM')),
    description TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    address TEXT,
    contact_number VARCHAR(20),
    additional_info JSONB DEFAULT '{}',
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_sos_alerts_trip_id ON sos_alerts(trip_id);
CREATE INDEX idx_sos_alerts_order_id ON sos_alerts(order_id);
CREATE INDEX idx_sos_alerts_rider_id ON sos_alerts(rider_id);
CREATE INDEX idx_sos_alerts_driver_id ON sos_alerts(driver_id);
CREATE INDEX idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX idx_sos_alerts_severity ON sos_alerts(severity);
CREATE INDEX idx_sos_alerts_triggered_at ON sos_alerts(triggered_at DESC);
CREATE INDEX idx_sos_alerts_location ON sos_alerts(location_lat, location_lng);

-- Index for active alerts (pending or in_progress)
CREATE INDEX idx_sos_alerts_active ON sos_alerts(status, triggered_at DESC)
WHERE status IN ('PENDING', 'IN_PROGRESS');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_sos_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sos_alerts_updated_at
    BEFORE UPDATE ON sos_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_sos_alerts_updated_at();

-- Comments
COMMENT ON TABLE sos_alerts IS 'Stores SOS/emergency alerts triggered by riders during trips';
COMMENT ON COLUMN sos_alerts.alert_type IS 'Type of emergency: EMERGENCY, MEDICAL, ACCIDENT, HARASSMENT, OTHER';
COMMENT ON COLUMN sos_alerts.severity IS 'Severity level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN sos_alerts.status IS 'Alert status: PENDING, IN_PROGRESS, RESOLVED, FALSE_ALARM';
COMMENT ON COLUMN sos_alerts.location_lat IS 'Latitude of SOS location';
COMMENT ON COLUMN sos_alerts.location_lng IS 'Longitude of SOS location';
COMMENT ON COLUMN sos_alerts.triggered_at IS 'Timestamp when SOS was triggered';
COMMENT ON COLUMN sos_alerts.acknowledged_at IS 'Timestamp when support team acknowledged the alert';
COMMENT ON COLUMN sos_alerts.resolved_at IS 'Timestamp when alert was resolved';
