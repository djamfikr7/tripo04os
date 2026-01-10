-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    profile_picture_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_expiry_date DATE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_color VARCHAR(50),
    is_available BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    current_location_latitude DECIMAL(10, 8),
    current_location_longitude DECIMAL(11, 8),
    current_location_updated_at TIMESTAMP WITH TIME ZONE,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_trips INTEGER DEFAULT 0,
    total_earnings DECIMAL(15, 2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create Drivers indexes
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_vehicle_type ON drivers(vehicle_type);
CREATE INDEX idx_drivers_is_available ON drivers(is_available);
CREATE INDEX idx_drivers_is_online ON drivers(is_online);
CREATE INDEX idx_drivers_is_verified ON drivers(is_verified);
CREATE INDEX idx_drivers_rating ON drivers(rating);
CREATE INDEX idx_drivers_location ON drivers(current_location_latitude, current_location_longitude);

-- Create Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create Refresh Tokens indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Create Email Verification Tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create Email Verification Tokens indexes
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Create Phone Verification Tokens table
CREATE TABLE IF NOT EXISTS phone_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    token VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create Phone Verification Tokens indexes
CREATE INDEX idx_phone_verification_tokens_user_id ON phone_verification_tokens(user_id);
CREATE INDEX idx_phone_verification_tokens_phone_number ON phone_verification_tokens(phone_number);
CREATE INDEX idx_phone_verification_tokens_expires_at ON phone_verification_tokens(expires_at);

-- Create Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create Password Reset Tokens indexes
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Create User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(50),
    device_os VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create User Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_login_at ON user_sessions(login_at);

-- Create Driver Documents table
CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url TEXT NOT NULL,
    document_number VARCHAR(100),
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Driver Documents indexes
CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_document_type ON driver_documents(document_type);
CREATE INDEX idx_driver_documents_is_verified ON driver_documents(is_verified);

-- Create Driver Earnings table
CREATE TABLE IF NOT EXISTS driver_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    trip_id UUID,
    amount DECIMAL(15, 2) NOT NULL,
    commission DECIMAL(15, 2) NOT NULL,
    net_earnings DECIMAL(15, 2) NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Driver Earnings indexes
CREATE INDEX idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX idx_driver_earnings_trip_id ON driver_earnings(trip_id);
CREATE INDEX idx_driver_earnings_earned_at ON driver_earnings(earned_at);

-- Create User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'USD',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create User Preferences indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE UNIQUE INDEX idx_user_preferences_user_id_unique ON user_preferences(user_id);

-- Create audit_logs table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_documents_updated_at BEFORE UPDATE ON driver_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
