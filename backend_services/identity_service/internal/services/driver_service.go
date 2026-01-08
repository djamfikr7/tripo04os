package services

import (
	"context"
	"fmt"
	"time"

	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/djamfikr7/tripo04os/identity-service/internal/repositories"
	"github.com/google/uuid"
)

type DriverService interface {
	GetCurrentDriver(ctx context.Context, userID uuid.UUID) (*models.Driver, error)
	UpdateDriver(ctx context.Context, userID uuid.UUID, updates map[string]any) (*models.Driver, error)
	UpdateAvailability(ctx context.Context, userID uuid.UUID, isOnline, isAvailable bool) error
	UpdateLocation(ctx context.Context, userID uuid.UUID, latitude, longitude float64) error
	GetEarnings(ctx context.Context, userID uuid.UUID) (float64, error)
	ListDrivers(ctx context.Context, limit, offset int) ([]*models.Driver, int64, error)
	GetDriver(ctx context.Context, userID uuid.UUID) (*models.Driver, error)
	UpdateDriverStatus(ctx context.Context, userID uuid.UUID, status string) error
}

type driverService struct {
	driverRepo repositories.DriverRepository
}

func NewDriverService(driverRepo repositories.DriverRepository) DriverService {
	return &driverService{driverRepo: driverRepo}
}

func (s *driverService) GetCurrentDriver(ctx context.Context, userID uuid.UUID) (*models.Driver, error) {
	return s.driverRepo.GetByUserID(ctx, userID)
}

func (s *driverService) UpdateDriver(ctx context.Context, userID uuid.UUID, updates map[string]any) (*models.Driver, error) {
	driver, err := s.driverRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	for key, value := range updates {
		switch key {
		case "driver_license":
			driver.DriverLicense = value.(string)
		case "license_expiry":
			driver.LicenseExpiry = value.(time.Time)
		case "certification_status":
			driver.CertificationStatus = models.CertificationStatus(value.(string))
		}
	}

	if err := s.driverRepo.Update(ctx, driver); err != nil {
		return nil, err
	}

	return driver, nil
}

func (s *driverService) UpdateAvailability(ctx context.Context, userID uuid.UUID, isOnline, isAvailable bool) error {
	return s.driverRepo.UpdateAvailability(ctx, userID, isOnline, isAvailable)
}

func (s *driverService) UpdateLocation(ctx context.Context, userID uuid.UUID, latitude, longitude float64) error {
	location := fmt.Sprintf("POINT(%f %f)", longitude, latitude)
	return s.driverRepo.UpdateLocation(ctx, userID, location)
}

func (s *driverService) GetEarnings(ctx context.Context, userID uuid.UUID) (float64, error) {
	driver, err := s.driverRepo.GetByUserID(ctx, userID)
	if err != nil {
		return 0, err
	}
	return driver.TotalEarnings, nil
}

func (s *driverService) ListDrivers(ctx context.Context, limit, offset int) ([]*models.Driver, int64, error) {
	return s.driverRepo.List(ctx, limit, offset)
}

func (s *driverService) GetDriver(ctx context.Context, userID uuid.UUID) (*models.Driver, error) {
	return s.driverRepo.GetByUserID(ctx, userID)
}

func (s *driverService) UpdateDriverStatus(ctx context.Context, userID uuid.UUID, status string) error {
	return nil
}
