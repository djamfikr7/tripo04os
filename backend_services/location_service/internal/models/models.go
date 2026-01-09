package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DriverLocation struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	DriverID    uuid.UUID  `json:"driver_id" gorm:"type:uuid;uniqueIndex;not null"`
	Location    string     `json:"location" gorm:"type:geography(POINT,4326);not null"`
	Accuracy    float64    `json:"accuracy" gorm:"type:decimal(10,2)"`
	Heading     float64    `json:"heading" gorm:"type:decimal(5,2)"`
	Speed       float64    `json:"speed" gorm:"type:decimal(5,2)"`
	IsOnline    bool       `json:"is_online" gorm:"default:true;index"`
	IsAvailable bool       `json:"is_available" gorm:"default:true;index"`
	LastSeen    time.Time   `json:"last_seen" gorm:"default:now()"`
	CreatedAt   time.Time   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time   `json:"updated_at" gorm:"autoUpdateTime"`
}

func (d *DriverLocation) TableName() string {
	return "driver_locations"
}

type GeofenceType string

const (
	GeofenceTypeCity     GeofenceType = "CITY"
	GeofenceTypeArea     GeofenceType = "AREA"
	GeofenceTypeSurge    GeofenceType = "SURGE"
	GeofenceTypeRestricted GeofenceType = "RESTRICTED"
)

type Geofence struct {
	ID          uuid.UUID     `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string        `json:"name" gorm:"type:varchar(255);not null"`
	Type        GeofenceType `json:"type" gorm:"type:varchar(50);not null"`
	Area        string        `json:"area" gorm:"type:geography(POLYGON,4326);not null"`
	CenterPoint string        `json:"center_point" gorm:"type:geography(POINT,4326)"`
	RadiusMeters int          `json:"radius_meters" gorm:"default:0"`
	SurgeMultiplier float64   `json:"surge_multiplier" gorm:"type:decimal(3,2);default:1.00"`
	IsActive    bool          `json:"is_active" gorm:"default:true;index"`
	Priority    int           `json:"priority" gorm:"default:0"`
	Description string        `json:"description" gorm:"type:text"`
	CreatedAt   time.Time     `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time     `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (g *Geofence) TableName() string {
	return "geofences"
}

type LocationPoint struct {
	Latitude  float64 `json:"latitude" binding:"required,min:-90,max:90"`
	Longitude float64 `json:"longitude" binding:"required,min:-180,max:180"`
}
