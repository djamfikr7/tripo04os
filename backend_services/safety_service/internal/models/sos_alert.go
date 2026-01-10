package models

import (
	"time"

	"github.com/google/uuid"
	
)

type AlertType string

const (
	AlertTypeEmergency  AlertType = "EMERGENCY"
	AlertTypeMedical    AlertType = "MEDICAL"
	AlertTypeAccident   AlertType = "ACCIDENT"
	AlertTypeHarassment AlertType = "HARASSMENT"
	AlertTypeOther      AlertType = "OTHER"
)

type AlertSeverity string

const (
	SeverityLow      AlertSeverity = "LOW"
	SeverityMedium   AlertSeverity = "MEDIUM"
	SeverityHigh     AlertSeverity = "HIGH"
	SeverityCritical AlertSeverity = "CRITICAL"
)

type AlertStatus string

const (
	AlertStatusPending    AlertStatus = "PENDING"
	AlertStatusInProgress AlertStatus = "IN_PROGRESS"
	AlertStatusResolved   AlertStatus = "RESOLVED"
	AlertStatusFalseAlarm AlertStatus = "FALSE_ALARM"
)

type SOSAlert struct {
	ID              uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	TripID          uuid.UUID     `gorm:"type:uuid;not null;index" json:"trip_id"`
	OrderID         uuid.UUID     `gorm:"type:uuid;not null;index" json:"order_id"`
	RiderID         uuid.UUID     `gorm:"type:uuid;not null;index" json:"rider_id"`
	DriverID        *uuid.UUID    `gorm:"type:uuid;index" json:"driver_id,omitempty"`
	AlertType       AlertType     `gorm:"type:varchar(50);not null" json:"alert_type"`
	Severity        AlertSeverity `gorm:"type:varchar(50);not null;default:HIGH" json:"severity"`
	Status          AlertStatus   `gorm:"type:varchar(50);not null;default:PENDING;index" json:"status"`
	Description     *string       `gorm:"type:text" json:"description,omitempty"`
	LocationLat     *float64      `gorm:"type:double precision" json:"location_lat,omitempty"`
	LocationLng     *float64      `gorm:"type:double precision" json:"location_lng,omitempty"`
	Address         *string       `gorm:"type:text" json:"address,omitempty"`
	ContactNumber   *string       `gorm:"type:varchar(20)" json:"contact_number,omitempty"`
	AdditionalInfo  string        `gorm:"type:jsonb;default:'{}'" json:"additional_info,omitempty"`
	TriggeredAt     time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP;index" json:"triggered_at"`
	AcknowledgedAt  *time.Time    `gorm:"type:timestamp with time zone" json:"acknowledged_at,omitempty"`
	ResolvedAt      *time.Time    `gorm:"type:timestamp with time zone" json:"resolved_at,omitempty"`
	ResolvedBy      *uuid.UUID    `gorm:"type:uuid" json:"resolved_by,omitempty"`
	ResolutionNotes *string       `gorm:"type:text" json:"resolution_notes,omitempty"`
	CreatedAt       time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt       time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (SOSAlert) TableName() string {
	return "sos_alerts"
}
