package models

import (
	"time"

	"github.com/google/uuid"
	
)

type EventType string

const (
	EventTypeSpeeding           EventType = "SPEEDING"
	EventTypeHardBraking        EventType = "HARD_BRAKING"
	EventTypeHardAcceleration   EventType = "HARD_ACCELERATION"
	EventTypeSharpTurn          EventType = "SHARP_TURN"
	EventTypeOffRoute           EventType = "OFF_ROUTE"
	EventTypeLongStop           EventType = "LONG_STOP"
	EventTypeDeviceTamper       EventType = "DEVICE_TAMPER"
	EventTypeSuspiciousBehavior EventType = "SUSPICIOUS_BEHAVIOR"
	EventTypeRouteViolation     EventType = "ROUTE_VIOLATION"
	EventTypeOther              EventType = "OTHER"
)

type EventSeverity string

const (
	EventSeverityLow      EventSeverity = "LOW"
	EventSeverityMedium   EventSeverity = "MEDIUM"
	EventSeverityHigh     EventSeverity = "HIGH"
	EventSeverityCritical EventSeverity = "CRITICAL"
)

type EventStatus string

const (
	EventStatusDetected  EventStatus = "DETECTED"
	EventStatusReviewing EventStatus = "REVIEWING"
	EventStatusConfirmed EventStatus = "CONFIRMED"
	EventStatusDismissed EventStatus = "DISMISSED"
)

type ActionTaken string

const (
	ActionTakenNone                   ActionTaken = "NONE"
	ActionTakenWarningSent            ActionTaken = "WARNING_SENT"
	ActionTakenDriverSuspended        ActionTaken = "DRIVER_SUSPENDED"
	ActionTakenAccountFlagged         ActionTaken = "ACCOUNT_FLAGGED"
	ActionTakenInvestigationInitiated ActionTaken = "INVESTIGATION_INITIATED"
)

type SafetyEvent struct {
	ID             uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	TripID         *uuid.UUID    `gorm:"type:uuid;index" json:"trip_id,omitempty"`
	OrderID        uuid.UUID     `gorm:"type:uuid;not null;index" json:"order_id"`
	DriverID       uuid.UUID     `gorm:"type:uuid;not null;index" json:"driver_id"`
	EventType      EventType     `gorm:"type:varchar(50);not null;index" json:"event_type"`
	Severity       EventSeverity `gorm:"type:varchar(50);not null;default:LOW;index" json:"severity"`
	Status         EventStatus   `gorm:"type:varchar(50);not null;default:DETECTED;index" json:"status"`
	LocationLat    *float64      `gorm:"type:double precision" json:"location_lat,omitempty"`
	LocationLng    *float64      `gorm:"type:double precision" json:"location_lng,omitempty"`
	Address        *string       `gorm:"type:text" json:"address,omitempty"`
	SpeedKmh       *float64      `gorm:"type:double precision" json:"speed_kmh,omitempty"`
	ThresholdValue *float64      `gorm:"type:double precision" json:"threshold_value,omitempty"`
	ActualValue    *float64      `gorm:"type:double precision" json:"actual_value,omitempty"`
	DeviceInfo     string        `gorm:"type:jsonb;default:'{}'" json:"device_info,omitempty"`
	Context        string        `gorm:"type:jsonb;default:'{}'" json:"context,omitempty"`
	ReviewedBy     *uuid.UUID    `gorm:"type:uuid" json:"reviewed_by,omitempty"`
	ReviewedAt     *time.Time    `gorm:"type:timestamp with time zone" json:"reviewed_at,omitempty"`
	ReviewNotes    *string       `gorm:"type:text" json:"review_notes,omitempty"`
	ActionTaken    ActionTaken   `gorm:"type:varchar(50)" json:"action_taken,omitempty"`
	CreatedAt      time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP;index" json:"created_at"`
	UpdatedAt      time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (SafetyEvent) TableName() string {
	return "safety_events"
}
