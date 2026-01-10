-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50),
    base_fare DECIMAL(15, 2) NOT NULL,
    fare_per_km DECIMAL(15, 2) NOT NULL,
    fare_per_minute DECIMAL(15, 2) NOT NULL,
    minimum_fare DECIMAL(15, 2) DEFAULT 0,
    service_type VARCHAR(50),
    vehicle_type VARCHAR(50),
    vertical VARCHAR(50),
    ride_type VARCHAR(50),
    time_of_day VARCHAR(20),
    day_of_week VARCHAR(20),
    distance_km_from DECIMAL(10, 2),
    distance_km_to DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Pricing Rules indexes
CREATE INDEX idx_pricing_rules_rule_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_is_active ON pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_service_type ON pricing_rules(service_type);
CREATE INDEX idx_pricing_rules_vehicle_type ON pricing_rules(vehicle_type);
CREATE INDEX idx_pricing_rules_vertical ON pricing_rules(vertical);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority);
CREATE INDEX idx_pricing_rules_time_of_day ON pricing_rules(time_of_day);

-- Create pricing_calculations table
CREATE TABLE IF NOT EXISTS pricing_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    calculation_type VARCHAR(50) NOT NULL,
    base_fare DECIMAL(15, 2) NOT NULL,
    distance_fare DECIMAL(15, 2) DEFAULT 0,
    time_fare DECIMAL(15, 2) DEFAULT 0,
    surge_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    eta_minutes INTEGER,
    estimated_distance_km DECIMAL(10, 2),
    pricing_model VARCHAR(50),
    rule_id UUID REFERENCES pricing_rules(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Pricing Calculations indexes
CREATE INDEX idx_pricing_calculations_order_id ON pricing_calculations(order_id);
CREATE INDEX idx_pricing_calculations_calculation_type ON pricing_calculations(calculation_type);
CREATE INDEX idx_pricing_calculations_created_at ON pricing_calculations(created_at);

-- Create surge_zones table
CREATE TABLE IF NOT EXISTS surge_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(255) NOT NULL UNIQUE,
    polygon GEOGRAPHY(POLYGON, 4326) NOT NULL,
    center_latitude DECIMAL(10, 8) NOT NULL,
    center_longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL,
    base_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    current_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    max_multiplier DECIMAL(5, 2) DEFAULT 3.0,
    demand_level VARCHAR(50) DEFAULT 'LOW',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Surge Zones indexes
CREATE INDEX idx_surge_zones_is_active ON surge_zones(is_active);
CREATE INDEX idx_surge_zones_demand_level ON surge_zones(demand_level);
CREATE INDEX idx_surge_zones_center_point ON surge_zones(center_latitude, center_longitude);
CREATE INDEX idx_surge_zones_polygon ON surge_zones USING GIST (polygon);

-- Create fare_history table
CREATE TABLE IF NOT EXISTS fare_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    trip_id UUID,
    driver_id UUID,
    rider_id UUID NOT NULL,
    base_fare DECIMAL(15, 2) NOT NULL,
    distance_fare DECIMAL(15, 2) DEFAULT 0,
    time_fare DECIMAL(15, 2) DEFAULT 0,
    surge_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    commission_amount DECIMAL(15, 2) NOT NULL,
    driver_earnings DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Fare History indexes
CREATE INDEX idx_fare_history_order_id ON fare_history(order_id);
CREATE INDEX idx_fare_history_trip_id ON fare_history(trip_id);
CREATE INDEX idx_fare_history_driver_id ON fare_history(driver_id);
CREATE INDEX idx_fare_history_rider_id ON fare_history(rider_id);
CREATE INDEX idx_fare_history_created_at ON fare_history(created_at);

-- Create pricing_events table
CREATE TABLE IF NOT EXISTS pricing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    order_id UUID,
    pricing_data JSONB NOT NULL,
    calculation_result JSONB,
    pricing_rule_id UUID REFERENCES pricing_rules(id) ON DELETE SET NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Pricing Events indexes
CREATE INDEX idx_pricing_events_event_type ON pricing_events(event_type);
CREATE INDEX idx_pricing_events_order_id ON pricing_events(order_id);
CREATE idx_pricing_events_created_at ON pricing_events(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_pricing_updated_at();

CREATE TRIGGER update_surge_zones_updated_at BEFORE UPDATE ON surge_zones
    FOR EACH ROW EXECUTE FUNCTION update_pricing_updated_at();

-- Enable PostGIS for surge zones
CREATE EXTENSION IF NOT EXISTS postgis;
