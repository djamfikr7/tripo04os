package models

import (
	"time"
)

type Driver struct {
	ID             string    `json:"id" db:"id"`
	UserID         string    `json:"user_id" db:"user_id"`
	Vertical       string    `json:"vertical" db:"vertical"`
	VehicleType    string    `json:"vehicle_type" db:"vehicle_type"`
	VehiclePlate   string    `json:"vehicle_plate" db:"vehicle_plate"`
	Rating         float64   `json:"rating" db:"rating"`
	TotalTrips     int       `json:"total_trips" db:"total_trips"`
	IsAvailable    bool      `json:"is_available" db:"is_available"`
	CurrentLat     float64   `json:"current_lat" db:"current_lat"`
	CurrentLng     float64   `json:"current_lng" db:"current_lng"`
	LastLocationAt time.Time `json:"last_location_at" db:"last_location_at"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type DriverMatch struct {
	ID           string    `json:"id" db:"id"`
	DriverID     string    `json:"driver_id" db:"driver_id"`
	OrderID      string    `json:"order_id" db:"order_id"`
	Status       string    `json:"status" db:"status"`
	MatchScore   float64   `json:"match_score" db:"match_score"`
	ETAMinutes   int       `json:"eta_minutes" db:"eta_minutes"`
	DistanceKM   float64   `json:"distance_km" db:"distance_km"`
	ResponseTime int       `json:"response_time_seconds" db:"response_time_seconds"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type DriverLocation struct {
	DriverID     string    `json:"driver_id" db:"driver_id"`
	Latitude     float64   `json:"latitude" db:"latitude"`
	Longitude    float64   `json:"longitude" db:"longitude"`
	Accuracy     float64   `json:"accuracy" db:"accuracy"`
	Speed        float64   `json:"speed" db:"speed"`
	Heading      float64   `json:"heading" db:"heading"`
	LocationAt   time.Time `json:"location_at" db:"location_at"`
	ReceivedAt   time.Time `json:"received_at" db:"received_at"`
}

type MatchRequest struct {
	OrderID        string  `json:"order_id"`
	Vertical       string  `json:"vertical"`
	Product        string  `json:"product"`
	PickupLat      float64 `json:"pickup_lat"`
	PickupLng      float64 `json:"pickup_lng"`
	DestinationLat float64 `json:"destination_lat"`
	DestinationLng float64 `json:"destination_lng"`
}

type MatchResponse struct {
	MatchID   string   `json:"match_id"`
	DriverID  string   `json:"driver_id"`
	OrderID   string   `json:"order_id"`
	Status    string   `json:"status"`
	ETAMinutes int     `json:"eta_minutes"`
	Score     float64  `json:"score"`
}

type AvailableDriversResponse struct {
	DriverID     string  `json:"driver_id"`
	Vertical     string  `json:"vertical"`
	VehicleType  string  `json:"vehicle_type"`
	Rating       float64 `json:"rating"`
	DistanceKM   float64 `json:"distance_km"`
	ETAMinutes   int     `json:"eta_minutes"`
}
