-- Down Migration: Drop ride_checks table

DROP TRIGGER IF EXISTS trigger_update_ride_checks_updated_at ON ride_checks;
DROP FUNCTION IF EXISTS update_ride_checks_updated_at();

DROP TABLE IF EXISTS ride_checks CASCADE;
