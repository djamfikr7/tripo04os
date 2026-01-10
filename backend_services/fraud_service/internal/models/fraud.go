package models

import (
	"time"

	"github.com/google/uuid"
)

type FraudType string

const (
	FraudTypeRatingManipulation  FraudType = "RATING_MANIPULATION"
	FraudTypeFakeTrips           FraudType = "FAKE_TRIPS"
	FraudTypeAccountTakeover     FraudType = "ACCOUNT_TAKEOVER"
	FraudTypePaymentFraud        FraudType = "PAYMENT_FRAUD"
	FraudTypeFakeLocation        FraudType = "FAKE_LOCATION"
	FraudTypeSybilAttack         FraudType = "SYBIL_ATTACK"
	FraudTypeBotActivity         FraudType = "BOT_ACTIVITY"
	FraudTypeDriverIdentityFraud FraudType = "DRIVER_IDENTITY_FRAUD"
	FraudTypeReferralAbuse       FraudType = "REFERRAL_ABUSE"
)

type FraudSeverity string

const (
	FraudSeverityLow      FraudSeverity = "LOW"
	FraudSeverityMedium   FraudSeverity = "MEDIUM"
	FraudSeverityHigh     FraudSeverity = "HIGH"
	FraudSeverityCritical FraudSeverity = "CRITICAL"
)

type FraudStatus string

const (
	FraudStatusDetected  FraudStatus = "DETECTED"
	FraudStatusReviewing FraudStatus = "REVIEWING"
	FraudStatusConfirmed FraudStatus = "CONFIRMED"
	FraudStatusDismissed FraudStatus = "DISMISSED"
	FraudStatusEscalated FraudStatus = "ESCALATED"
)

type FraudReport struct {
	ID                uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	UserID            uuid.UUID     `gorm:"type:uuid;not null;index" json:"user_id"`
	UserType          string        `gorm:"type:varchar(20);not null" json:"user_type"`
	TripID            *uuid.UUID    `gorm:"type:uuid;index" json:"trip_id,omitempty"`
	OrderID           *uuid.UUID    `gorm:"type:uuid;index" json:"order_id,omitempty"`
	FraudType         FraudType     `gorm:"type:varchar(50);not null;index" json:"fraud_type"`
	Severity          FraudSeverity `gorm:"type:varchar(20);not null;index" json:"severity"`
	Status            FraudStatus   `gorm:"type:varchar(20);not null;index;default:DETECTED" json:"status"`
	Description       *string       `gorm:"type:text" json:"description,omitempty"`
	Evidence          string        `gorm:"type:jsonb;default:'{}'" json:"evidence"`
	IPAddress         *string       `gorm:"type:varchar(45)" json:"ip_address,omitempty"`
	DeviceFingerprint string        `gorm:"type:varchar(255);not null" json:"device_fingerprint"`
	DetectedAt        time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP;index" json:"detected_at"`
	ReviewedBy        *uuid.UUID    `gorm:"type:uuid" json:"reviewed_by,omitempty"`
	ReviewedAt        *time.Time    `gorm:"type:timestamp with time zone" json:"reviewed_at,omitempty"`
	ResolutionNotes   *string       `gorm:"type:text" json:"resolution_notes,omitempty"`
	ActionTaken       string        `gorm:"type:varchar(50);default:NONE" json:"action_taken"`
	CreatedAt         time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt         time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (FraudReport) TableName() string {
	return "fraud_reports"
}

type FraudRule struct {
	ID             uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	Name           string        `gorm:"type:varchar(100);not null;unique" json:"name"`
	FraudType      FraudType     `gorm:"type:varchar(50);not null" json:"fraud_type"`
	Description    string        `gorm:"type:text;not null" json:"description"`
	ThresholdType  string        `gorm:"type:varchar(20);not null;json:'RATING_COUNT,LOCATION_VELOCITY,PAYMENT_AMOUNT,BOT_ACTIVITY_SCORE'" json:"threshold_type"`
	ThresholdValue float64       `gorm:"type:double precision;not null" json:"threshold_value"`
	SeverityLevel  FraudSeverity `gorm:"type:varchar(20);not null" json:"severity_level"`
	IsActive       bool          `gorm:"default:true" json:"is_active"`
	Priority       int           `gorm:"default:100" json:"priority"`
	CreatedAt      time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt      time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (FraudRule) TableName() string {
	return "fraud_rules"
}

type FraudAlert struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	UserType      string     `gorm:"type:varchar(20);not null" json:"user_type"`
	RuleID        uuid.UUID  `gorm:"type:uuid;not null" json:"rule_id"`
	AlertLevel    string     `gorm:"type:varchar(20);not null" json:"alert_level"`
	Message       string     `gorm:"type:text;not null" json:"message"`
	RiskScore     float64    `gorm:"type:double precision;not null" json:"risk_score"`
	IsAutoBlocked bool       `gorm:"default:false" json:"is_auto_blocked"`
	CreatedAt     time.Time  `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP;index" json:"created_at"`
	ExpiresAt     time.Time  `gorm:"type:timestamp with time zone;not null" json:"expires_at"`
	DismissedAt   *time.Time `gorm:"type:timestamp with time zone" json:"dismissed_at,omitempty"`
	DismissedBy   *uuid.UUID `gorm:"type:uuid" json:"dismissed_by,omitempty"`
}

func (FraudAlert) TableName() string {
	return "fraud_alerts"
}

type UserRiskProfile struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID           uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	UserType         string    `gorm:"type:varchar(20);not null" json:"user_type"`
	RiskScore        float64   `gorm:"type:double precision;not null;default:0" json:"risk_score"`
	RiskLevel        string    `gorm:"type:varchar(20);not null;default:LOW" json:"risk_level"`
	TotalReports     int       `gorm:"type:integer;not null;default:0" json:"total_reports"`
	ConfirmedReports int       `gorm:"type:integer;not null;default:0" json:"confirmed_reports"`
	DismissedReports int       `gorm:"type:integer;not null;default:0" json:"dismissed_reports"`
	LastActivityAt   time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"last_activity_at"`
	CreatedAt        time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt        time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (UserRiskProfile) TableName() string {
	return "user_risk_profiles"
}
