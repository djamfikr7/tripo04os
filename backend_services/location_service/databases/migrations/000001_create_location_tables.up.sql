-- Create Driver Locations table
CREATE TABLE IF NOT EXISTS driver_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    altitude DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2),
    location_updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_driver_locations_driver_id (driver_id),
    INDEX idx_driver_locations_created_at (created_at),
    INDEX idx_driver_locations_location (latitude, longitude)
);

-- Create Geofences table
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    polygon GEOGRAPHY(POLYGON, 4326) NOT NULL,
    geofence_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Geofence Zones table
CREATE TABLE IF NOT EXISTS geofence_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    zone_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Location History table
CREATE TABLE IF NOT EXISTS location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_location_history_driver_id (driver_id),
    INDEX idx_location_history_event_type (event_type),
    INDEX idx_location_history_created_at (created_at)
);

-- Create ETA Calculations table
CREATE TABLE IF NOT EXISTS eta_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    destination_latitude DECIMAL(10, 8) NOT NULL,
    destination_longitude DECIMAL(11, 8) NOT NULL,
    estimated_time_seconds INTEGER NOT NULL,
    distance_meters DECIMAL(10, 2),
    route_polyline TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_eta_calculations_driver_id (driver_id),
    INDEX idx_eta_calculations_created_at (created_at)
);

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL,
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    distance DECIMAL;
BEGIN
    SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint(lon1, lat1), 4326),
        ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)
    ) * 1000 INTO distance;
    RETURN distance;
END;
$$ LANGUAGE plpgsql;

-- Function to check if point is inside geofence
CREATE OR REPLACE FUNCTION is_point_in_geofence(
    geofence_id UUID,
    lat DECIMAL,
    lon DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    inside BOOLEAN;
BEGIN
    SELECT ST_Contains(
        polygon,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    ) INTO inside
    FROM geofences
    WHERE id = geofence_id;
    
    RETURN COALESCE(inside, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences
    FOR EACH ROW EXECUTE FUNCTION update_location_updated_at();
