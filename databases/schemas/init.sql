-- Tripo04OS Identity Service Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('RIDER', 'DRIVER', 'EMPLOYEE', 'ADMIN')),
    profile JSONB DEFAULT '{}',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT email_format CHECK (email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    CONSTRAINT phone_format CHECK (phone ~* '^\+[1-9]\d{1,14}$')
);

-- Indexes for users
CREATE INDEX idx_users_role_active ON users(role, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(user_id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(50),
    capacity INTEGER DEFAULT 4,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vehicles
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_license VARCHAR(100) NOT NULL,
    license_expiry DATE NOT NULL,
    certification_status VARCHAR(50) DEFAULT 'PENDING' CHECK (certification_status IN ('PENDING', 'VERIFIED', 'SUSPENDED', 'REVOKED')),
    quality_profile_id UUID REFERENCES driver_quality_profiles(id) ON DELETE SET NULL,
    current_location GEOGRAPHY(POINT, 4326),
    is_online BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT FALSE,
    on_duty_since TIMESTAMP,
    total_rides INTEGER DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT license_expiry_check CHECK (license_expiry > CURRENT_DATE)
);

-- Indexes for drivers
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_vehicle_id ON drivers(vehicle_id);
CREATE INDEX idx_drivers_quality_profile_id ON drivers(quality_profile_id);
CREATE INDEX idx_drivers_current_location ON drivers USING GIN(current_location);
CREATE INDEX idx_drivers_availability ON drivers(is_online, is_available);

-- Driver quality profiles table
CREATE TABLE IF NOT EXISTS driver_quality_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(user_id) ON DELETE SET NULL UNIQUE,
    average_rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_ratings INTEGER DEFAULT 0,
    completion_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    cancellation_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (cancellation_rate >= 0 AND cancellation_rate <= 100),
    on_time_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (on_time_rate >= 0 AND on_time_rate <= 100),
    safety_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (safety_score >= 0 AND safety_score <= 100),
    quality_tier VARCHAR(20) DEFAULT 'BRONZE' CHECK (quality_tier IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for driver quality profiles
CREATE INDEX idx_driver_quality_profiles_driver_id ON driver_quality_profiles(driver_id);

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    token_type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tokens
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_quality_profiles_updated_at BEFORE UPDATE ON driver_quality_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
