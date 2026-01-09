package models

import (
	"time"
)

type SafetyReport struct {
	ID           string    `json:"id" db:"id"`
	ReporterID   string    `json:"reporter_id" db:"reporter_id"`
	ReportedID   string    `json:"reported_id" db:"reported_id"`
	TripID       string    `json:"trip_id" db:"trip_id"`
	IncidentType string    `json:"incident_type" db:"incident_type"`
	Severity     string    `json:"severity" db:"severity"`
	Description  string    `json:"description" db:"description"`
	Status       string    `json:"status" db:"status"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	ResolvedAt   *time.Time `json:"resolved_at" db:"resolved_at"`
}

type SafetyAlert struct {
	ID          string    `json:"id" db:"id"`
	ReportID    string    `json:"report_id" db:"report_id"`
	Type        string    `json:"type" db:"type"`
	Severity    string    `json:"severity" db:"severity"`
	Status      string    `json:"status" db:"status"`
	ExpiresAt   time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	ResolvedAt  *time.Time `json:"resolved_at" db:"resolved_at"`
}

type EmergencyReport struct {
	ID          string    `json:"id"`
	UserID       string    `json:"user_id"`
	TripID       string    `json:"trip_id"`
	Type         string    `json:"type"`
	Location     Location  `json:"location"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
