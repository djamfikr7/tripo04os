package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TripStatus string

const (
	TripStatusCreated      TripStatus = "CREATED"
	TripStatusDriverAssigned TripStatus = "DRIVER_ASSIGNED"
	TripStatusDriverEnRoute TripStatus = "DRIVER_EN_ROUTE"
	TripStatusArrived    TripStatus = "ARRIVED"
	TripStatusInProgress    TripStatus = "IN_PROGRESS"
	TripStatusCompleted   TripStatus = "COMPLETED"
	TripStatusCancelled   TripStatus = "CANCELLED"
)

type Trip struct {
	ID               uuid.UUID   `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	OrderID          uuid.UUID   `json:"order_id" gorm:"type:uuid;not null;index"`
	DriverID         uuid.UUID   `json:"driver_id" gorm:"type:uuid;not null;index"`
	Status           TripStatus  `json:"status" gorm:"type:varchar(50);not null;index"`
	StartTime        *time.Time  `json:"start_time"`
	EndTime          *time.Time  `json:"end_time"`
	ActualDistanceKm float64    `json:"actual_distance_km" gorm:"type:decimal(10,2);default:0.00"`
	ActualDurationMin float64    `json:"actual_duration_min" gorm:"type:decimal(10,2);default:0.00"`
	BaseFare         float64    `json:"base_fare" gorm:"type:decimal(10,2);default:0.00"`
	SurgeMultiplier  float64    `json:"surge_multiplier" gorm:"type:decimal(3,2);default:1.00"`
	TotalFare        float64    `json:"total_fare" gorm:"type:decimal(10,2);default:0.00"`
	FinalFare        float64    `json:"final_fare" gorm:"type:decimal(10,2);default:0.00"`
	DriverCommission  float64    `json:"driver_commission" gorm:"type:decimal(10,2);default:0.00"`
	PlatformFee       float64    `json:"platform_fee" gorm:"type:decimal(10,2);default:0.00"`
	PaymentMethod     string      `json:"payment_method" gorm:"type:varchar(50)"`
	PaymentStatus    string      `json:"payment_status" gorm:"type:varchar(50);default:'PENDING'"`
	Route            *TripRoute `json:"route"`
	Metadata         map[string]any `json:"metadata" gorm:"type:jsonb"`
	CreatedAt        time.Time   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time   `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}

func (t *Trip) TableName() string {
	return "trips"
}

type TripLocation struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TripID    uuid.UUID `json:"trip_id" gorm:"type:uuid;not null;index"`
	Latitude  float64   `json:"latitude" gorm:"type:decimal(10,6);not null"`
	Longitude float64   `json:"longitude" gorm:"type:decimal(10,6);not null"`
	Accuracy  float64   `json:"accuracy" gorm:"type:decimal(10,2);default:0.00"`
	Speed     float64   `json:"speed" gorm:"type:decimal(5,2);default:0.00"`
	Heading   float64   `json:"heading" gorm:"type:decimal(5,2);default:0.00"`
	Timestamp time.Time `json:"timestamp" gorm:"not null"`
}

func (t *TripLocation) TableName() string {
	return "trip_locations"
}

type TripRoute struct {
	ID              uuid.UUID    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TripID          uuid.UUID    `json:"trip_id" gorm:"type:uuid;not null;index"`
	RoutePoints     string       `json:"route_points" gorm:"type:jsonb;not null"`
	TotalDistanceKm float64     `json:"total_distance_km" gorm:"type:decimal(10,2);default:0.00"`
	TotalDurationMin float64     `json:"total_duration_min" gorm:"type:decimal(10,2);default:0.00"`
	EstimatedEndTime *time.Time   `json:"estimated_end_time"`
}

func (t *TripRoute) TableName() string {
	return "trip_routes"
}
