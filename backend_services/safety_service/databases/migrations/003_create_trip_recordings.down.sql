-- Down Migration: Drop trip_recordings table

DROP TRIGGER IF EXISTS trigger_update_trip_recordings_updated_at ON trip_recordings;
DROP FUNCTION IF EXISTS update_trip_recordings_updated_at();

DROP TABLE IF EXISTS trip_recordings CASCADE;
