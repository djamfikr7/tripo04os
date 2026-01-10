-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL,
    driver_id UUID,
    vertical VARCHAR(50) NOT NULL,
    product_id VARCHAR(50),
    ride_type VARCHAR(50) NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_latitude DECIMAL(10, 8) NOT NULL,
    destination_longitude DECIMAL(11, 8) NOT NULL,
    destination_address TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    base_fare DECIMAL(15, 2) DEFAULT 0,
    distance_fare DECIMAL(15, 2) DEFAULT 0,
    time_fare DECIMAL(15, 2) DEFAULT 0,
    surge_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2),
    estimated_duration_seconds INTEGER,
    estimated_distance_meters INTEGER,
    actual_duration_seconds INTEGER,
    actual_distance_meters INTEGER,
    cancellation_reason TEXT,
    cancellation_fee DECIMAL(15, 2),
    cancellation_fee_paid_by VARCHAR(50),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create Orders indexes
CREATE INDEX idx_orders_rider_id ON orders(rider_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_vertical ON orders(vertical);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_scheduled_for ON orders(scheduled_for);
CREATE INDEX idx_orders_pickup_location ON orders(pickup_latitude, pickup_longitude);
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at);

-- Create Order Items table (for multi-item orders like groceries)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    weight_kg DECIMAL(10, 2),
    dimensions_cm VARCHAR(50),
    special_instructions TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_type ON order_items(item_type);

-- Create Order Status History table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    reason TEXT,
    actor_type VARCHAR(50),
    actor_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Status History indexes
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_status ON order_status_history(status);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at);

-- Create Order Events table
CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    source VARCHAR(50),
    correlation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Events indexes
CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_event_type ON order_events(event_type);
CREATE INDEX idx_order_events_created_at ON order_events(created_at);
CREATE INDEX idx_order_events_correlation_id ON order_events(correlation_id);

-- Create Scheduled Orders table
CREATE TABLE IF NOT EXISTS scheduled_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    driver_assignment_started_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Scheduled Orders indexes
CREATE INDEX idx_scheduled_orders_order_id ON scheduled_orders(order_id);
CREATE INDEX idx_scheduled_orders_scheduled_for ON scheduled_orders(scheduled_for);
CREATE INDEX idx_scheduled_orders_status ON scheduled_orders(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_order_updated_at();

CREATE TRIGGER update_scheduled_orders_updated_at BEFORE UPDATE ON scheduled_orders
    FOR EACH ROW EXECUTE FUNCTION update_order_updated_at();
