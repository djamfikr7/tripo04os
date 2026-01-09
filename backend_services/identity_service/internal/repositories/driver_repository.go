package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrDriverNotFound      = errors.New("driver not found")
	ErrDriverExists       = errors.New("driver already exists")
	ErrVehicleNotFound     = errors.New("vehicle not found")
)

type DriverRepository interface {
	Create(ctx context.Context, driver *models.Driver) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Driver, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Driver, error)
	Update(ctx context.Context, driver *models.Driver) error
	UpdateAvailability(ctx context.Context, userID uuid.UUID, isOnline, isAvailable bool) error
	UpdateLocation(ctx context.Context, userID uuid.UUID, location string) error
	UpdateEarnings(ctx context.Context, userID uuid.UUID, earnings float64) error
	List(ctx context.Context, limit, offset int) ([]*models.Driver, int64, error)
	ListAvailable(ctx context.Context, limit, offset int) ([]*models.Driver, int64, error)
	GetByVehicleID(ctx context.Context, vehicleID uuid.UUID) (*models.Driver, error)
}

type driverRepository struct {
	db *gorm.DB
}

func NewDriverRepository(db *gorm.DB) DriverRepository {
	return &driverRepository{db: db}
}

func (r *driverRepository) Create(ctx context.Context, driver *models.Driver) error {
	return r.db.WithContext(ctx).Create(driver).Error
}

func (r *driverRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Driver, error) {
	var driver models.Driver
	err := r.db.WithContext(ctx).Preload("User").Preload("Vehicle").Where("user_id = ?", id).First(&driver).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDriverNotFound
		}
		return nil, err
	}
	return &driver, nil
}

func (r *driverRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.Driver, error) {
	var driver models.Driver
	err := r.db.WithContext(ctx).Preload("User").Preload("Vehicle").Where("user_id = ?", userID).First(&driver).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDriverNotFound
		}
		return nil, err
	}
	return &driver, nil
}

func (r *driverRepository) Update(ctx context.Context, driver *models.Driver) error {
	return r.db.WithContext(ctx).Save(driver).Error
}

func (r *driverRepository) UpdateAvailability(ctx context.Context, userID uuid.UUID, isOnline, isAvailable bool) error {
	return r.db.WithContext(ctx).
		Model(&models.Driver{}).
		Where("user_id = ?", userID).
		Updates(map[string]any{
			"is_online":    isOnline,
			"is_available": isAvailable,
			"on_duty_since": func() *time.Time {
				if isOnline {
					now := time.Now()
					return &now
				}
				return nil
			}(),
		}).Error
}

func (r *driverRepository) UpdateLocation(ctx context.Context, userID uuid.UUID, location string) error {
	return r.db.WithContext(ctx).
		Model(&models.Driver{}).
		Where("user_id = ?", userID).
		Update("current_location", location).Error
}

func (r *driverRepository) UpdateEarnings(ctx context.Context, userID uuid.UUID, earnings float64) error {
	return r.db.WithContext(ctx).
		Model(&models.Driver{}).
		Where("user_id = ?", userID).
		Update("total_earnings", gorm.Expr("total_earnings + ?", earnings)).Error
}

func (r *driverRepository) List(ctx context.Context, limit, offset int) ([]*models.Driver, int64, error) {
	var drivers []*models.Driver
	var total int64

	if err := r.db.WithContext(ctx).Model(&models.Driver{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Vehicle").
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&drivers).Error

	return drivers, total, err
}

func (r *driverRepository) ListAvailable(ctx context.Context, limit, offset int) ([]*models.Driver, int64, error) {
	var drivers []*models.Driver
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Driver{}).Where("is_online = ? AND is_available = ?", true, true)
	
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("User").
		Preload("Vehicle").
		Limit(limit).
		Offset(offset).
		Order("quality_profile_id DESC").
		Find(&drivers).Error

	return drivers, total, err
}

func (r *driverRepository) GetByVehicleID(ctx context.Context, vehicleID uuid.UUID) (*models.Driver, error) {
	var driver models.Driver
	err := r.db.WithContext(ctx).Preload("User").Preload("Vehicle").Where("vehicle_id = ?", vehicleID).First(&driver).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDriverNotFound
		}
		return nil, err
	}
	return &driver, nil
}
