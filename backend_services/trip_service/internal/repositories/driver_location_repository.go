package repositories

import (
	"context"
	"time"

	"github.com/djamfikr7/tripo04os/trip-service/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DriverLocationRepository interface {
	Create(ctx context.Context, location *models.TripLocation) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.TripLocation, error)
	GetLatestByTripID(ctx context.Context, tripID uuid.UUID, limit int) ([]*models.TripLocation, error)
	GetByTripID(ctx context.Context, tripID uuid.UUID, limit, offset int) ([]*models.TripLocation, int64, error)
	GetByDriverID(ctx context.Context, driverID uuid.UUID, limit int) ([]*models.TripLocation, error)
}

type driverLocationRepository struct {
	db *gorm.DB
}

func NewDriverLocationRepository(db *gorm.DB) DriverLocationRepository {
	return &driverLocationRepository{db: db}
}

func (r *driverLocationRepository) Create(ctx context.Context, location *models.TripLocation) error {
	return r.db.WithContext(ctx).Create(location).Error
}

func (r *driverLocationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TripLocation, error) {
	var location models.TripLocation
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

func (r *driverLocationRepository) GetLatestByTripID(ctx context.Context, tripID uuid.UUID, limit int) ([]*models.TripLocation, error) {
	var locations []*models.TripLocation
	err := r.db.WithContext(ctx).
		Where("trip_id = ?", tripID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&locations).Error
	return locations, err
}

func (r *driverLocationRepository) GetByTripID(ctx context.Context, tripID uuid.UUID, limit, offset int) ([]*models.TripLocation, int64, error) {
	var locations []*models.TripLocation
	var total int64

	query := r.db.WithContext(ctx).Model(&models.TripLocation{}).Where("trip_id = ?", tripID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err = query.
		Limit(limit).
		Offset(offset).
		Order("timestamp DESC").
		Find(&locations).Error

	return locations, total, err
}

func (r *driverLocationRepository) GetByDriverID(ctx context.Context, driverID uuid.UUID, limit int) ([]*models.TripLocation, error) {
	var locations []*models.TripLocation
	err := r.db.WithContext(ctx).
		Where("driver_id = ?", driverID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&locations).Error
	return locations, err
}
