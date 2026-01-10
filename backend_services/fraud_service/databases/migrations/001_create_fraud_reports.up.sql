-- 001_create_fraud_reports.up.sql
CREATE TABLE IF NOT EXISTS fraud_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('RIDER', 'DRIVER')),
    trip_id UUID,
    order_id UUID,
    fraud_type VARCHAR(50) NOT NULL CHECK (fraud_type IN ('RATING_MANIPULATION', 'FAKE_TRIPS', 'ACCOUNT_TAKEOVER', 'PAYMENT_FRAUD', 'FAKE_LOCATION', 'SYBIL_ATTACK', 'BOT_ACTIVITY', 'DRIVER_IDENTITY_FRAUD', 'REFERRAL_ABUSE')),
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED', 'REVIEWING', 'CONFIRMED', 'DISMISSED', 'ESCALATED')),
    description TEXT,
    evidence JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    action_taken VARCHAR(50) DEFAULT 'NONE' CHECK (action_taken IN ('NONE', 'WARNING_SENT', 'USER_SUSPENDED', 'ACCOUNT_LOCKED', 'PAYMENT_REFUNDED', 'LEGAL_ACTION', 'BANNED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_reports_user_id ON fraud_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_user_type ON fraud_reports(user_type);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_trip_id ON fraud_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_order_id ON fraud_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_status ON fraud_reports(status);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_severity ON fraud_reports(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_detected_at ON fraud_reports(detected_at DESC);
