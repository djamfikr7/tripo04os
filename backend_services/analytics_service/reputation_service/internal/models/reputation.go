package models

import (
	"time"

	"github.com/google/uuid"
)

type ReviewType string

const (
	ReviewTypeRider  ReviewType = "RIDER"
	ReviewTypeDriver ReviewType = "DRIVER"
)

type RatingSource string

const (
	RatingSourceTrip    RatingSource = "TRIP"
	RatingSourceDispute RatingSource = "DISPUTE"
)

type RatingStatus string

const (
	RatingStatusPending  RatingStatus = "PENDING"
	RatingStatusActive   RatingStatus = "ACTIVE"
	RatingStatusArchived RatingStatus = "ARCHIVED"
)

type Review struct {
	ID           uuid.UUID    `gorm:"type:uuid;primaryKey" json:"id"`
	TripID       uuid.UUID    `gorm:"type:uuid;not null;index" json:"trip_id"`
	OrderID      uuid.UUID    `gorm:"type:uuid;not null;index" json:"order_id"`
	ReviewerID   uuid.UUID    `gorm:"type:uuid;not null;index" json:"reviewer_id"`
	ReviewerType ReviewType   `gorm:"type:varchar(20);not null" json:"reviewer_type"`
	RatedID      uuid.UUID    `gorm:"type:uuid;not null;index" json:"rated_id"`
	RatedType    ReviewType   `gorm:"type:varchar(20);not null" json:"rated_type"`
	Rating       int          `gorm:"type:integer;not null;check:rating >= 1 AND rating <= 5" json:"rating"`
	Comment      *string      `gorm:"type:text" json:"comment,omitempty"`
	Source       RatingSource `gorm:"type:varchar(20);not null;default:TRIP" json:"source"`
	Status       RatingStatus `gorm:"type:varchar(20);not null;default:ACTIVE;index" json:"status"`
	IsAnonymous  bool         `gorm:"default:false" json:"is_anonymous"`
	CreatedAt    time.Time    `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP;index" json:"created_at"`
	UpdatedAt    time.Time    `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (Review) TableName() string {
	return "reviews"
}

type ReputationScore struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID             uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_type" json:"user_id"`
	UserType           string    `gorm:"type:varchar(20);not null;uniqueIndex:idx_user_type" json:"user_type"`
	OverallScore       float64   `gorm:"type:decimal(5,2);not null;default:5.00" json:"overall_score"`
	RatingCount        int       `gorm:"type:integer;not null;default:0" json:"rating_count"`
	AverageRating      float64   `gorm:"type:decimal(5,2);not null;default:5.00" json:"average_rating"`
	ReliabilityScore   float64   `gorm:"type:decimal(5,2);not null;default:5.00" json:"reliability_score"`
	PunctualityScore   float64   `gorm:"type:decimal(5,2);not null;default:5.00" json:"punctuality_score"`
	CommunicationScore float64   `gorm:"type:decimal(5,2);not null;default:5.00" json:"communication_score"`
	VehicleScore       float64   `gorm:"type:decimal(5,2);not null;default:5.00" json:"vehicle_score"`
	BehaviorScore      float64   `gorm:"type:decimal(5,2);not null;default:5.00" json:"behavior_score"`
	TotalTrips         int       `gorm:"type:integer;not null;default:0" json:"total_trips"`
	CompletedTrips     int       `gorm:"type:integer;not null;default:0" json:"completed_trips"`
	CancelledTrips     int       `gorm:"type:integer;not null;default:0" json:"cancelled_trips"`
	PositiveReviews    int       `gorm:"type:integer;not null;default:0" json:"positive_reviews"`
	NegativeReviews    int       `gorm:"type:integer;not null;default:0" json:"negative_reviews"`
	TrustScore         float64   `gorm:"type:decimal(5,2);not null;default:5.00" json:"trust_score"`
	LastCalculatedAt   time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"last_calculated_at"`
	CreatedAt          time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt          time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (ReputationScore) TableName() string {
	return "reputation_scores"
}

type ReputationHistory struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID          uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	UserType        string     `gorm:"type:varchar(20);not null" json:"user_type"`
	OldScore        float64    `gorm:"type:decimal(5,2);not null" json:"old_score"`
	NewScore        float64    `gorm:"type:decimal(5,2);not null" json:"new_score"`
	ScoreChange     float64    `gorm:"type:decimal(5,2);not null" json:"score_change"`
	Reason          string     `gorm:"type:text;not null" json:"reason"`
	RelatedReviewID *uuid.UUID `gorm:"type:uuid" json:"related_review_id,omitempty"`
	RelatedTripID   *uuid.UUID `gorm:"type:uuid" json:"related_trip_id,omitempty"`
	CreatedAt       time.Time  `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (ReputationHistory) TableName() string {
	return "reputation_history"
}
