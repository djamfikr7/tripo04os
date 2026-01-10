-- Migration: Create trip_recordings table
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS trip_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    order_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    rider_id UUID NOT NULL,
    recording_type VARCHAR(50) NOT NULL CHECK (recording_type IN ('VIDEO', 'AUDIO', 'LOCATION_LOG', 'SENSOR_DATA')),
    storage_url TEXT,
    storage_provider VARCHAR(50) DEFAULT 'S3',
    file_size BIGINT,
    file_format VARCHAR(20),
    duration_seconds INTEGER,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    is_encrypted BOOLEAN DEFAULT TRUE,
    encryption_key_id VARCHAR(255),
    retention_until TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADING' CHECK (status IN ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED', 'EXPIRED')),
    upload_started_at TIMESTAMP WITH TIME ZONE,
    upload_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_trip_recordings_trip_id ON trip_recordings(trip_id);
CREATE INDEX idx_trip_recordings_order_id ON trip_recordings(order_id);
CREATE INDEX idx_trip_recordings_driver_id ON trip_recordings(driver_id);
CREATE INDEX idx_trip_recordings_rider_id ON trip_recordings(rider_id);
CREATE INDEX idx_trip_recordings_status ON trip_recordings(status);
CREATE INDEX idx_trip_recordings_recording_type ON trip_recordings(recording_type);
CREATE INDEX idx_trip_recordings_created_at ON trip_recordings(created_at DESC);

-- Index for recordings that need to be deleted
CREATE INDEX idx_trip_recordings_expiry ON trip_recordings(retention_until, status)
WHERE retention_until IS NOT NULL;

-- Partial index for active recordings
CREATE INDEX idx_trip_recordings_active ON trip_recordings(trip_id, status)
WHERE status IN ('UPLOADING', 'PROCESSING', 'READY');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_trip_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trip_recordings_updated_at
    BEFORE UPDATE ON trip_recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_recordings_updated_at();

-- Comments
COMMENT ON TABLE trip_recordings IS 'Stores trip recordings (video, audio, location logs) for safety purposes';
COMMENT ON COLUMN trip_recordings.recording_type IS 'Type of recording: VIDEO, AUDIO, LOCATION_LOG, SENSOR_DATA';
COMMENT ON COLUMN trip_recordings.storage_url IS 'URL where recording is stored';
COMMENT ON COLUMN trip_recordings.storage_provider IS 'Storage provider: S3, GCS, Azure';
COMMENT ON COLUMN trip_recordings.is_encrypted IS 'Whether recording is encrypted at rest';
COMMENT ON COLUMN trip_recordings.retention_until IS 'When recording should be deleted per data retention policy';
COMMENT ON COLUMN trip_recordings.status IS 'Recording status: UPLOADING, PROCESSING, READY, FAILED, DELETED, EXPIRED';
