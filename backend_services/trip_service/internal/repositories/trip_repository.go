package repositories

import (
	"context"
	"errors"

	"github.com/djamfikr7/tripo04os/trip-service/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrTripNotFound       = errors.New("trip not found")
	ErrTripRouteNotFound = errors.New("trip route not found")
)

type TripRepository interface {
	Create(ctx context.Context, trip *models.Trip) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Trip, error)
	Update(ctx context.Context, trip *models.Trip) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status models.TripStatus) (*models.Trip, error)
	GetByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Trip, error)
	GetByDriverID(ctx context.Context, driverID uuid.UUID, limit, offset int) ([]*models.Trip, int64, error)
	GetActiveTrips(ctx context.Context, limit int) ([]*models.Trip, error)
	GetActiveTripByDriverID(ctx context.Context, driverID uuid.UUID) (*models.Trip, error)
	GetCompletedTrips(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]*models.Trip, int64, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type tripRepository struct {
	db *gorm.DB
}

func NewTripRepository(db *gorm.DB) TripRepository {
	return &tripRepository{db: db}
}

func (r *tripRepository) Create(ctx context.Context, trip *models.Trip) error {
	return r.db.WithContext(ctx).Create(trip).Error
}

func (r *tripRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Trip, error) {
	var trip models.Trip
	err := r.db.WithContext(ctx).Preload("Route").Where("id = ?", id).First(&trip).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTripNotFound
		}
		return nil, err
	}
	return &trip, nil
}

func (r *tripRepository) Update(ctx context.Context, trip *models.Trip) error {
	return r.db.WithContext(ctx).Save(trip).Error
}

func (r *tripRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.TripStatus) (*models.Trip, error) {
	err := r.db.WithContext(ctx).Model(&models.Trip{}).Where("id = ?", id).Update("status", status).Error
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *tripRepository) GetByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Trip, error) {
	var trip models.Trip
	err := r.db.WithContext(ctx).Preload("Route").Where("order_id = ?", orderID).First(&trip).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTripNotFound
		}
		return nil, err
	}
	return &trip, nil
}

func (r *tripRepository) GetByDriverID(ctx context.Context, driverID uuid.UUID, limit, offset int) ([]*models.Trip, int64, error) {
	var trips []*models.Trip
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Trip{}).Where("driver_id = ?", driverID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err = query.
		Preload("Route").
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&trips).Error

	return trips, total, err
}

func (r *tripRepository) GetActiveTrips(ctx context.Context, limit int) ([]*models.Trip, error) {
	var trips []*models.Trip
	err := r.db.WithContext(ctx).
		Where("status IN ?", []models.TripStatus{
			models.TripStatusDriverAssigned,
			models.TripStatusDriverEnRoute,
			models.TripStatusArrived,
			models.TripStatusInProgress,
		}).
		Preload("Route").
		Limit(limit).
		Order("created_at ASC").
		Find(&trips).Error
	return trips, err
}

func (r *tripRepository) GetActiveTripByDriverID(ctx context.Context, driverID uuid.UUID) (*models.Trip, error) {
	var trip models.Trip
	err := r.db.WithContext(ctx).
		Preload("Route").
		Where("driver_id = ? AND status IN ?", driverID, []models.TripStatus{
			models.TripStatusDriverAssigned,
			models.TripStatusDriverEnRoute,
			models.TripStatusArrived,
			models.TripStatusInProgress,
		}).
		Order("created_at DESC").
		First(&trip).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTripNotFound
		}
		return nil, err
	}
	return &trip, nil
}

func (r *tripRepository) GetCompletedTrips(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]*models.Trip, int64, error) {
	var trips []*models.Trip
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Trip{}).
		Where("status = ? AND end_time >= ? AND end_time <= ?", 
			models.TripStatusCompleted, startDate, endDate)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err = query.
		Preload("Route").
		Limit(limit).
		Offset(offset).
		Order("end_time DESC").
		Find(&trips).Error

	return trips, total, err
}

func (r *tripRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Trip{}, id).Error
}
