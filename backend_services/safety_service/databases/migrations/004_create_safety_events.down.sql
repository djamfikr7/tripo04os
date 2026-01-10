-- Down Migration: Drop safety_events table

DROP TRIGGER IF EXISTS trigger_update_safety_events_updated_at ON safety_events;
DROP FUNCTION IF EXISTS update_safety_events_updated_at();

DROP TABLE IF EXISTS safety_events CASCADE;
