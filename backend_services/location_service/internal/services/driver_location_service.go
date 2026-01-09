package services

import (
	"context"
	"fmt"
	"time"

	"github.com/djamfikr7/tripo04os/location-service/internal/models"
	"github.com/djamfikr7/tripo04os/location-service/internal/repositories"
	"github.com/google/uuid"
)

type DriverLocationService interface {
	UpdateLocation(ctx context.Context, driverID uuid.UUID, lat, lng float64, accuracy, heading, speed float64) (*models.DriverLocation, error)
	GetDriverLocation(ctx context.Context, driverID uuid.UUID) (*models.DriverLocation, error)
	GetNearbyDrivers(ctx context.Context, lat, lng float64, radiusMeters int, limit int) ([]*models.DriverLocation, error)
	GetDriversInArea(ctx context.Context, polygon []models.LocationPoint, limit int) ([]*models.DriverLocation, error)
	GetOnlineDrivers(ctx context.Context, limit int) ([]*models.DriverLocation, error)
}

type driverLocationService struct {
	repo repositories.DriverLocationRepository
}

func NewDriverLocationService(repo repositories.DriverLocationRepository) DriverLocationService {
	return &driverLocationService{repo: repo}
}

func (s *driverLocationService) UpdateLocation(ctx context.Context, driverID uuid.UUID, lat, lng float64, accuracy, heading, speed float64) (*models.DriverLocation, error) {
	location := fmt.Sprintf("POINT(%f %f)", lng, lat)

	driverLocation := &models.DriverLocation{
		DriverID:    driverID,
		Location:    location,
		Accuracy:    accuracy,
		Heading:     heading,
		Speed:       speed,
		IsOnline:    true,
		IsAvailable: true,
		LastSeen:    time.Now(),
	}

	existingLocation, err := s.repo.GetByDriverID(ctx, driverID)
	if err != nil {
		if err != repositories.ErrDriverLocationNotFound {
			return nil, err
		}
		return nil, s.repo.Create(ctx, driverLocation)
	}

	driverLocation.ID = existingLocation.ID
	driverLocation.CreatedAt = existingLocation.CreatedAt

	if err := s.repo.Update(ctx, driverLocation); err != nil {
		return nil, err
	}

	return driverLocation, nil
}

func (s *driverLocationService) GetDriverLocation(ctx context.Context, driverID uuid.UUID) (*models.DriverLocation, error) {
	return s.repo.GetByDriverID(ctx, driverID)
}

func (s *driverLocationService) GetNearbyDrivers(ctx context.Context, lat, lng float64, radiusMeters int, limit int) ([]*models.DriverLocation, error) {
	return s.repo.GetNearbyDrivers(ctx, lat, lng, radiusMeters, limit)
}

func (s *driverLocationService) GetDriversInArea(ctx context.Context, polygon []models.LocationPoint, limit int) ([]*models.DriverLocation, error) {
	return s.repo.GetDriversInArea(ctx, polygon, limit)
}

func (s *driverLocationService) GetOnlineDrivers(ctx context.Context, limit int) ([]*models.DriverLocation, error) {
	return s.repo.GetOnlineDrivers(ctx, limit)
}
