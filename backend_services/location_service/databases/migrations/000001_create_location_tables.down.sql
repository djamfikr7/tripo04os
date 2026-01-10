-- Drop triggers
DROP TRIGGER IF EXISTS update_geofences_updated_at ON geofences;

-- Drop functions
DROP FUNCTION IF EXISTS update_location_updated_at();
DROP FUNCTION IF EXISTS is_point_in_geofence();
DROP FUNCTION IF EXISTS calculate_distance();

-- Drop tables in reverse order
DROP TABLE IF EXISTS eta_calculations CASCADE;
DROP TABLE IF EXISTS location_history CASCADE;
DROP TABLE IF EXISTS geofence_zones CASCADE;
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS driver_locations CASCADE;

-- Drop PostGIS extension
DROP EXTENSION IF EXISTS postgis;
