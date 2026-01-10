-- 002_create_reputation_scores.up.sql
CREATE TABLE IF NOT EXISTS reputation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('RIDER', 'DRIVER')),
    overall_score DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (overall_score >= 0 AND overall_score <= 5),
    rating_count INTEGER NOT NULL DEFAULT 0,
    average_rating DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (average_rating >= 1 AND average_rating <= 5),
    reliability_score DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (reliability_score >= 0 AND reliability_score <= 5),
    punctuality_score DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (punctuality_score >= 0 AND punctuality_score <= 5),
    communication_score DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (communication_score >= 0 AND communication_score <= 5),
    vehicle_score DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (vehicle_score >= 0 AND vehicle_score <= 5),
    behavior_score DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (behavior_score >= 0 AND behavior_score <= 5),
    total_trips INTEGER NOT NULL DEFAULT 0,
    completed_trips INTEGER NOT NULL DEFAULT 0,
    cancelled_trips INTEGER NOT NULL DEFAULT 0,
    positive_reviews INTEGER NOT NULL DEFAULT 0,
    negative_reviews INTEGER NOT NULL DEFAULT 0,
    trust_score DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (trust_score >= 0 AND trust_score <= 100),
    last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_type UNIQUE (user_id, user_type)
);

CREATE INDEX IF NOT EXISTS idx_reputation_scores_user_id ON reputation_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_scores_trust_score ON reputation_scores(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_scores_user_type ON reputation_scores(user_type);
