-- Drop triggers
DROP TRIGGER IF EXISTS update_surge_zones_updated_at ON surge_zones;
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;

-- Drop function
DROP FUNCTION IF EXISTS update_pricing_updated_at();

-- Drop PostGIS extension
DROP EXTENSION IF EXISTS postgis;

-- Drop tables in reverse order
DROP TABLE IF EXISTS pricing_events CASCADE;
DROP TABLE IF EXISTS fare_history CASCADE;
DROP TABLE IF EXISTS surge_zones CASCADE;
DROP TABLE IF EXISTS pricing_calculations CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
