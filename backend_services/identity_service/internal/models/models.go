package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleRider   Role = "RIDER"
	RoleDriver  Role = "DRIVER"
	RoleEmployee Role = "EMPLOYEE"
	RoleAdmin   Role = "ADMIN"
)

type CertificationStatus string

const (
	CertificationPending   CertificationStatus = "PENDING"
	CertificationVerified CertificationStatus = "VERIFIED"
	CertificationSuspended CertificationStatus = "SUSPENDED"
	CertificationRevoked   CertificationStatus = "REVOKED"
)

type User struct {
	ID                uuid.UUID         `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email             string            `json:"email" gorm:"type:varchar(255);uniqueIndex;not null"`
	Phone             string            `json:"phone" gorm:"type:varchar(20);uniqueIndex;not null"`
	PasswordHash      string            `json:"-" gorm:"type:varchar(255);not null"`
	Role              Role              `json:"role" gorm:"type:varchar(50);not null"`
	Profile           map[string]any    `json:"profile" gorm:"type:jsonb"`
	IsEmailVerified   bool              `json:"is_email_verified" gorm:"default:false"`
	IsPhoneVerified   bool              `json:"is_phone_verified" gorm:"default:false"`
	IsActive          bool              `json:"is_active" gorm:"default:true;index:idx_role_active"`
	CreatedAt         time.Time         `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time         `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt         gorm.DeletedAt   `json:"-" gorm:"index"`
}

func (u *User) TableName() string {
	return "users"
}

type Driver struct {
	UserID                uuid.UUID            `json:"user_id" gorm:"type:uuid;primaryKey;uniqueIndex"`
	User                  User                 `json:"-" gorm:"foreignKey:UserID"`
	VehicleID             *uuid.UUID           `json:"vehicle_id" gorm:"type:uuid;index"`
	Vehicle               *Vehicle             `json:"-" gorm:"foreignKey:VehicleID"`
	DriverLicense         string               `json:"driver_license" gorm:"type:varchar(100);not null"`
	LicenseExpiry         time.Time            `json:"license_expiry" gorm:"not null"`
	CertificationStatus   CertificationStatus  `json:"certification_status" gorm:"type:varchar(50);default:'PENDING'"`
	QualityProfileID      *uuid.UUID           `json:"quality_profile_id" gorm:"type:uuid;index"`
	QualityProfile        *DriverQualityProfile `json:"-" gorm:"foreignKey:QualityProfileID"`
	CurrentLocation       string               `json:"current_location" gorm:"type:point"`
	IsOnline             bool                 `json:"is_online" gorm:"default:false;index:idx_availability"`
	IsAvailable          bool                 `json:"is_available" gorm:"default:false;index:idx_availability"`
	OnDutySince          *time.Time           `json:"on_duty_since"`
	TotalRides           int                  `json:"total_rides" gorm:"default:0"`
	TotalEarnings        float64              `json:"total_earnings" gorm:"type:decimal(10,2);default:0.00"`
	CreatedAt            time.Time            `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt            time.Time            `json:"updated_at" gorm:"autoUpdateTime"`
}

func (d *Driver) TableName() string {
	return "drivers"
}

type Vehicle struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	DriverID      uuid.UUID `json:"driver_id" gorm:"type:uuid;index:unique"`
	Driver        *Driver   `json:"-" gorm:"foreignKey:DriverID"`
	Type          string    `json:"type" gorm:"type:varchar(50);not null"`
	Make          string    `json:"make" gorm:"type:varchar(50);not null"`
	Model         string    `json:"model" gorm:"type:varchar(50);not null"`
	Year          int       `json:"year" gorm:"not null"`
	LicensePlate  string    `json:"license_plate" gorm:"type:varchar(20);uniqueIndex;not null"`
	Color         string    `json:"color" gorm:"type:varchar(50)"`
	Capacity      int       `json:"capacity" gorm:"default:4"`
	IsAvailable   bool      `json:"is_available" gorm:"default:true"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (v *Vehicle) TableName() string {
	return "vehicles"
}

type DriverQualityProfile struct {
	ID                 uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	DriverID           *uuid.UUID `json:"driver_id" gorm:"type:uuid;index:unique"`
	Driver             *Driver    `json:"-" gorm:"foreignKey:DriverID"`
	AverageRating      float64    `json:"average_rating" gorm:"type:decimal(3,2);default:0.00"`
	TotalRatings       int        `json:"total_ratings" gorm:"default:0"`
	CompletionRate     float64    `json:"completion_rate" gorm:"type:decimal(5,2);default:0.00"`
	CancellationRate   float64    `json:"cancellation_rate" gorm:"type:decimal(5,2);default:0.00"`
	OnTimeRate        float64    `json:"on_time_rate" gorm:"type:decimal(5,2);default:0.00"`
	SafetyScore       float64    `json:"safety_score" gorm:"type:decimal(5,2);default:0.00"`
	QualityTier       string     `json:"quality_tier" gorm:"type:varchar(20);default:'BRONZE'"`
	CreatedAt         time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (d *DriverQualityProfile) TableName() string {
	return "driver_quality_profiles"
}

type Token struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	Token     string    `json:"token" gorm:"type:varchar(500);uniqueIndex;not null"`
	TokenType string    `json:"token_type" gorm:"type:varchar(20);not null"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (t *Token) TableName() string {
	return "tokens"
}
