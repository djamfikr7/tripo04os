-- Down Migration: Drop sos_alerts table

DROP TRIGGER IF EXISTS trigger_update_sos_alerts_updated_at ON sos_alerts;
DROP FUNCTION IF EXISTS update_sos_alerts_updated_at();

DROP TABLE IF EXISTS sos_alerts CASCADE;
