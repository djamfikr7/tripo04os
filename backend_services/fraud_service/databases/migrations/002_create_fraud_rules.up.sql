-- 002_create_fraud_rules.up.sql
CREATE TABLE IF NOT EXISTS fraud_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    fraud_type VARCHAR(50) NOT NULL CHECK (fraud_type IN ('RATING_MANIPULATION', 'FAKE_TRIPS', 'ACCOUNT_TAKEOVER', 'PAYMENT_FRAUD', 'FAKE_LOCATION', 'SYBIL_ATTACK', 'BOT_ACTIVITY', 'DRIVER_IDENTITY_FRAUD', 'REFERRAL_ABUSE')),
    description TEXT,
    threshold_type VARCHAR(20) NOT NULL CHECK (threshold_type IN ('RATING_COUNT', 'LOCATION_VELOCITY', 'PAYMENT_AMOUNT', 'BOT_ACTIVITY_SCORE')),
    threshold_value DOUBLE PRECISION NOT NULL,
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_rules_fraud_type ON fraud_rules(fraud_type);
CREATE INDEX IF NOT EXISTS idx_fraud_rules_severity_level ON fraud_rules(severity_level);
CREATE INDEX IF NOT EXISTS idx_fraud_rules_is_active ON fraud_rules(is_active);
