package models

import (
	"time"

	"github.com/google/uuid"
	
)

type CheckType string

const (
	CheckTypeScheduled CheckType = "SCHEDULED"
	CheckTypeManual    CheckType = "MANUAL"
	CheckTypeAutomated CheckType = "AUTOMATED"
)

type CheckStatus string

const (
	CheckStatusScheduled  CheckStatus = "SCHEDULED"
	CheckStatusInProgress CheckStatus = "IN_PROGRESS"
	CheckStatusCompleted  CheckStatus = "COMPLETED"
	CheckStatusSkipped    CheckStatus = "SKIPPED"
	CheckStatusFailed     CheckStatus = "FAILED"
)

type ResponseType string

const (
	ResponseTypeOK          ResponseType = "OK"
	ResponseTypeConcern     ResponseType = "CONCERN"
	ResponseTypeDistress    ResponseType = "DISTRESS"
	ResponseTypeNoResponse  ResponseType = "NO_RESPONSE"
	ResponseTypeSystemError ResponseType = "SYSTEM_ERROR"
)

type RideCheck struct {
	ID                uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	TripID            uuid.UUID     `gorm:"type:uuid;not null;index" json:"trip_id"`
	OrderID           uuid.UUID     `gorm:"type:uuid;not null;index" json:"order_id"`
	RiderID           uuid.UUID     `gorm:"type:uuid;not null;index" json:"rider_id"`
	DriverID          uuid.UUID     `gorm:"type:uuid;not null;index" json:"driver_id"`
	CheckType         CheckType     `gorm:"type:varchar(50);not null" json:"check_type"`
	ScheduledFor      *time.Time    `gorm:"type:timestamp with time zone;index" json:"scheduled_for,omitempty"`
	Status            CheckStatus   `gorm:"type:varchar(50);not null;default:SCHEDULED;index" json:"status"`
	CheckTime         *time.Time    `gorm:"type:timestamp with time zone;index" json:"check_time,omitempty"`
	ResponseTime      *time.Time    `gorm:"type:timestamp with time zone" json:"response_time,omitempty"`
	ResponseType      *ResponseType `gorm:"type:varchar(50)" json:"response_type,omitempty"`
	DriverLocationLat *float64      `gorm:"type:double precision" json:"driver_location_lat,omitempty"`
	DriverLocationLng *float64      `gorm:"type:double precision" json:"driver_location_lng,omitempty"`
	RiderLocationLat  *float64      `gorm:"type:double precision" json:"rider_location_lat,omitempty"`
	RiderLocationLng  *float64      `gorm:"type:double precision" json:"rider_location_lng,omitempty"`
	Notes             *string       `gorm:"type:text" json:"notes,omitempty"`
	FollowUpRequired  bool          `gorm:"not null;default:false" json:"follow_up_required"`
	FollowUpAt        *time.Time    `gorm:"type:timestamp with time zone" json:"follow_up_at,omitempty"`
	CreatedAt         time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt         time.Time     `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (RideCheck) TableName() string {
	return "ride_checks"
}
