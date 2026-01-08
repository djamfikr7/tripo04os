-- Tripo04OS Location Service Database Schema

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Driver locations table
CREATE TABLE IF NOT EXISTS driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID UNIQUE NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy DECIMAL(10, 2) DEFAULT 0.00,
    heading DECIMAL(5, 2) DEFAULT 0.00,
    speed DECIMAL(5, 2) DEFAULT 0.00,
    is_online BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for driver_locations
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_location ON driver_locations USING GIST(location);
CREATE INDEX idx_driver_locations_availability ON driver_locations(is_online, is_available) WHERE is_online = TRUE AND is_available = TRUE;
CREATE INDEX idx_driver_locations_last_seen ON driver_locations(last_seen DESC);

-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CITY', 'AREA', 'SURGE', 'RESTRICTED')),
    area GEOGRAPHY(POLYGON, 4326) NOT NULL,
    center_point GEOGRAPHY(POINT, 4326),
    radius_meters INTEGER DEFAULT 0,
    surge_multiplier DECIMAL(3, 2) DEFAULT 1.00 CHECK (surge_multiplier >= 1.00),
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for geofences
CREATE INDEX idx_geofences_type ON geofences(type);
CREATE INDEX idx_geofences_area ON geofences USING GIST(area);
CREATE INDEX idx_geofences_active ON geofences(is_active, priority DESC) WHERE is_active = TRUE;
CREATE INDEX idx_geofences_deleted_at ON geofences(deleted_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_location_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_driver_locations_updated_at BEFORE UPDATE ON driver_locations
    FOR EACH ROW EXECUTE FUNCTION update_location_updated_at_column();

CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences
    FOR EACH ROW EXECUTE FUNCTION update_location_updated_at_column();
