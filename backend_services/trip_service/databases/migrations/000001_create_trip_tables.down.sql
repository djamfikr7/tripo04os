-- Drop triggers
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;

-- Drop function
DROP FUNCTION IF EXISTS update_trip_updated_at();

-- Drop tables in reverse order
DROP TABLE IF EXISTS route_optimizations CASCADE;
DROP TABLE IF EXISTS trip_ratings CASCADE;
DROP TABLE IF EXISTS trip_tracking CASCADE;
DROP TABLE IF EXISTS trip_events CASCADE;
DROP TABLE IF EXISTS trip_stops CASCADE;
DROP TABLE IF EXISTS shared_trips CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
