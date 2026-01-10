-- Create Trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    vehicle_id UUID,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_time TIMESTAMP WITH TIME ZONE,
    destination_latitude DECIMAL(10, 8) NOT NULL,
    destination_longitude DECIMAL(11, 8) NOT NULL,
    destination_address TEXT NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE,
    dropoff_time TIMESTAMP WITH TIME ZONE,
    actual_distance_meters INTEGER,
    actual_duration_seconds INTEGER,
    fare DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    ride_type VARCHAR(50),
    is_shared BOOLEAN DEFAULT FALSE,
    shared_trip_id UUID,
    number_of_stops INTEGER DEFAULT 0,
    stops TEXT,
    route_polyline TEXT,
    trip_start_time TIMESTAMP WITH TIME ZONE,
    trip_end_time TIMESTAMP WITH TIME ZONE,
    wait_time_seconds INTEGER,
    delay_minutes INTEGER,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create Trips indexes
CREATE INDEX idx_trips_order_id ON trips(order_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_created_at ON trips(created_at);
CREATE INDEX idx_trips_pickup_time ON trips(pickup_time);
CREATE INDEX idx_trips_is_shared ON trips(is_shared);
CREATE INDEX idx_trips_shared_trip_id ON trips(shared_trip_id);

-- Create Shared Trips table
CREATE TABLE IF NOT EXISTS shared_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    child_trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    pickup_sequence INTEGER NOT NULL,
    pickup_time TIMESTAMP WITH TIME ZONE,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    pickup_address TEXT,
    dropoff_time TIMESTAMP WITH TIME ZONE,
    dropoff_latitude DECIMAL(10, 8),
    dropoff_longitude DECIMAL(11, 8),
    dropoff_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Shared Trips indexes
CREATE INDEX idx_shared_trips_parent_trip_id ON shared_trips(parent_trip_id);
CREATE INDEX idx_shared_trips_child_trip_id ON shared_trips(child_trip_id);
CREATE INDEX idx_shared_trips_pickup_sequence ON shared_trips(pickup_sequence);

-- Create Trip Stops table
CREATE TABLE IF NOT EXISTS trip_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    stop_type VARCHAR(50) NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE,
    departure_time TIMESTAMP WITH TIME ZONE,
    wait_time_seconds INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Trip Stops indexes
CREATE INDEX idx_trip_stops_trip_id ON trip_stops(trip_id);
CREATE INDEX idx_trip_stops_sequence_number ON trip_stops(sequence_number);

-- Create Trip Events table
CREATE TABLE IF NOT EXISTS trip_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    driver_id UUID,
    rider_id UUID,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    source VARCHAR(50),
    correlation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Trip Events indexes
CREATE INDEX idx_trip_events_trip_id ON trip_events(trip_id);
CREATE INDEX idx_trip_events_event_type ON trip_events(event_type);
CREATE INDEX idx_trip_events_created_at ON trip_events(created_at);
CREATE INDEX idx_trip_events_correlation_id ON trip_events(correlation_id);

-- Create Trip Tracking table
CREATE TABLE IF NOT EXISTS trip_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    speed DECIMAL(6, 2),
    heading DECIMAL(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Trip Tracking indexes
CREATE INDEX idx_trip_tracking_trip_id ON trip_tracking(trip_id);
CREATE INDEX idx_trip_tracking_driver_id ON trip_tracking(driver_id);
CREATE INDEX idx_trip_tracking_timestamp ON trip_tracking(timestamp);
CREATE INDEX idx_trip_tracking_timestamp_trip ON trip_tracking(trip_id, timestamp);

-- Create Trip Ratings table
CREATE TABLE IF NOT EXISTS trip_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    rating_type VARCHAR(50) NOT NULL,
    rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
    comments TEXT,
    rated_by UUID NOT NULL,
    rated_for UUID NOT NULL,
    category VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Trip Ratings indexes
CREATE INDEX idx_trip_ratings_trip_id ON trip_ratings(trip_id);
CREATE INDEX idx_trip_ratings_rated_by ON trip_ratings(rated_by);
CREATE INDEX idx_trip_ratings_rated_for ON trip_ratings(rated_for);

-- Create Route Optimization table
CREATE TABLE IF NOT EXISTS route_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL,
    original_distance_meters INTEGER,
    original_duration_seconds INTEGER,
    optimized_distance_meters INTEGER,
    optimized_duration_seconds INTEGER,
    savings_meters INTEGER,
    savings_seconds INTEGER,
    savings_percentage DECIMAL(5, 2),
    route_polyline TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Route Optimization indexes
CREATE INDEX idx_route_optimizations_trip_id ON route_optimizations(trip_id);
CREATE INDEX idx_route_optimizations_type ON route_optimizations(optimization_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_trip_updated_at();
