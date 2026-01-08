package services

import (
	"context"
	"errors"
	"time"

	"github.com/djamfikr7/tripo04os/trip-service/internal/models"
	"github.com/djamfikr7/tripo04os/trip-service/internal/repositories"
	"github.com/google/uuid"
)

var (
	ErrTripNotFound         = errors.New("trip not found")
	ErrInvalidTripStatus    = errors.New("invalid trip status transition")
	ErrTripAlreadyStarted   = errors.New("trip already started")
	ErrTripAlreadyCompleted = errors.New("trip already completed")
)

type TripService interface {
	CreateTrip(ctx context.Context, orderID uuid.UUID, driverID uuid.UUID, baseFare, surgeMultiplier float64) (*models.Trip, error)
	GetTrip(ctx context.Context, id uuid.UUID) (*models.Trip, error)
	UpdateTrip(ctx context.Context, trip *models.Trip) error
	UpdateTripStatus(ctx context.Context, id uuid.UUID, status models.TripStatus) (*models.Trip, error)
	StartTrip(ctx context.Context, id uuid.UUID) (*models.Trip, error)
	CompleteTrip(ctx context.Context, id uuid.UUID, finalFare, driverCommission, platformFee float64) (*models.Trip, error)
	CancelTrip(ctx context.Context, id uuid.UUID, reason string) (*models.Trip, error)
	UpdateTripLocation(ctx context.Context, tripID uuid.UUID, latitude, longitude, accuracy, heading, speed float64) error
	GetActiveTrips(ctx context.Context, limit int) ([]*models.Trip, error)
	GetTripByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Trip, error)
	GetDriverActiveTrip(ctx context.Context, driverID uuid.UUID) (*models.Trip, error)
	GetDriverTrips(ctx context.Context, driverID uuid.UUID, limit, offset int) ([]*models.Trip, int64, error)
	GetCompletedTrips(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]*models.Trip, int64, error)
}

type tripService struct {
	tripRepo         repositories.TripRepository
	driverLocationRepo repositories.DriverLocationRepository
}

func NewTripService(tripRepo repositories.TripRepository, driverLocationRepo repositories.DriverLocationRepository) TripService {
	return &tripService{
		tripRepo:         tripRepo,
		driverLocationRepo: driverLocationRepo,
	}
}

func (s *tripService) CreateTrip(ctx context.Context, orderID uuid.UUID, driverID uuid.UUID, baseFare, surgeMultiplier float64) (*models.Trip, error) {
	trip := &models.Trip{
		OrderID:         orderID,
		DriverID:        driverID,
		Status:          models.TripStatusCreated,
		BaseFare:        baseFare,
		SurgeMultiplier: surgeMultiplier,
		TotalFare:       baseFare * surgeMultiplier,
		DriverCommission: baseFare * surgeMultiplier * 0.80,
		PlatformFee:      baseFare * surgeMultiplier * 0.20,
	}

	if err := s.tripRepo.Create(ctx, trip); err != nil {
		return nil, err
	}

	return trip, nil
}

func (s *tripService) GetTrip(ctx context.Context, id uuid.UUID) (*models.Trip, error) {
	return s.tripRepo.GetByID(ctx, id)
}

func (s *tripService) UpdateTrip(ctx context.Context, trip *models.Trip) error {
	return s.tripRepo.Update(ctx, trip)
}

func (s *tripService) UpdateTripStatus(ctx context.Context, id uuid.UUID, status models.TripStatus) (*models.Trip, error) {
	trip, err := s.tripRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if !s.isValidStatusTransition(trip.Status, status) {
		return nil, ErrInvalidTripStatus
	}

	return s.tripRepo.UpdateStatus(ctx, id, status)
}

func (s *tripService) StartTrip(ctx context.Context, id uuid.UUID) (*models.Trip, error) {
	trip, err := s.tripRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if trip.Status != models.TripStatusDriverEnRoute {
		return nil, ErrInvalidTripStatus
	}

	now := time.Now()
	trip.Status = models.TripStatusInProgress
	trip.StartTime = &now

	if err := s.tripRepo.Update(ctx, trip); err != nil {
		return nil, err
	}

	return trip, nil
}

func (s *tripService) CompleteTrip(ctx context.Context, id uuid.UUID, finalFare, driverCommission, platformFee float64) (*models.Trip, error) {
	trip, err := s.tripRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if trip.Status != models.TripStatusInProgress {
		return nil, ErrInvalidTripStatus
	}

	now := time.Now()
	trip.Status = models.TripStatusCompleted
	trip.EndTime = &now
	trip.FinalFare = finalFare
	trip.DriverCommission = driverCommission
	trip.PlatformFee = platformFee
	trip.PaymentStatus = "COMPLETED"

	if err := s.tripRepo.Update(ctx, trip); err != nil {
		return nil, err
	}

	return trip, nil
}

func (s *tripService) CancelTrip(ctx context.Context, id uuid.UUID, reason string) (*models.Trip, error) {
	trip, err := s.tripRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if trip.Status == models.TripStatusCompleted {
		return nil, ErrTripAlreadyCompleted
	}

	trip.Status = models.TripStatusCancelled
	trip.Metadata = map[string]any{
		"cancellation_reason": reason,
	}

	if err := s.tripRepo.Update(ctx, trip); err != nil {
		return nil, err
	}

	return trip, nil
}

func (s *tripService) UpdateTripLocation(ctx context.Context, tripID uuid.UUID, latitude, longitude, accuracy, heading, speed float64) error {
	location := &models.TripLocation{
		TripID:   tripID,
		Latitude:  latitude,
		Longitude: longitude,
		Accuracy:  accuracy,
		Speed:     speed,
		Heading:   heading,
		Timestamp: time.Now(),
	}

	return s.driverLocationRepo.Create(ctx, location)
}

func (s *tripService) GetActiveTrips(ctx context.Context, limit int) ([]*models.Trip, error) {
	return s.tripRepo.GetActiveTrips(ctx, limit)
}

func (s *tripService) GetTripByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Trip, error) {
	return s.tripRepo.GetByOrderID(ctx, orderID)
}

func (s *tripService) GetDriverActiveTrip(ctx context.Context, driverID uuid.UUID) (*models.Trip, error) {
	return s.tripRepo.GetActiveTripByDriverID(ctx, driverID)
}

func (s *tripService) GetDriverTrips(ctx context.Context, driverID uuid.UUID, limit, offset int) ([]*models.Trip, int64, error) {
	return s.tripRepo.GetByDriverID(ctx, driverID, limit, offset)
}

func (s *tripService) GetCompletedTrips(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]*models.Trip, int64, error) {
	return s.tripRepo.GetCompletedTrips(ctx, startDate, endDate, limit, offset)
}

func (s *tripService) isValidStatusTransition(currentStatus, newStatus models.TripStatus) bool {
	validTransitions := map[models.TripStatus][]models.TripStatus{
		models.TripStatusCreated: {
			models.TripStatusDriverAssigned,
			models.TripStatusCancelled,
		},
		models.TripStatusDriverAssigned: {
			models.TripStatusDriverEnRoute,
			models.TripStatusCancelled,
		},
		models.TripStatusDriverEnRoute: {
			models.TripStatusInProgress,
			models.TripStatusCancelled,
		},
		models.TripStatusInProgress: {
			models.TripStatusCompleted,
			models.TripStatusCancelled,
		},
		models.TripStatusCompleted: {},
		models.TripStatusCancelled: {},
	}

	allowedStatuses, exists := validTransitions[currentStatus]
	if !exists {
		return false
	}

	for _, status := range allowedStatuses {
		if status == newStatus {
			return true
		}
	}

	return false
}
