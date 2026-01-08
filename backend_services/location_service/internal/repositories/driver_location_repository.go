package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/djamfikr7/tripo04os/location-service/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrDriverLocationNotFound = errors.New("driver location not found")
	ErrGeofenceNotFound     = errors.New("geofence not found")
)

type DriverLocationRepository interface {
	Create(ctx context.Context, location *models.DriverLocation) error
	Update(ctx context.Context, location *models.DriverLocation) error
	GetByDriverID(ctx context.Context, driverID uuid.UUID) (*models.DriverLocation, error)
	GetNearbyDrivers(ctx context.Context, lat, lng float64, radiusMeters int, limit int) ([]*models.DriverLocation, error)
	GetDriversInArea(ctx context.Context, polygon []models.LocationPoint, limit int) ([]*models.DriverLocation, error)
	GetOnlineDrivers(ctx context.Context, limit int) ([]*models.DriverLocation, error)
}

type driverLocationRepository struct {
	db *gorm.DB
}

func NewDriverLocationRepository(db *gorm.DB) DriverLocationRepository {
	return &driverLocationRepository{db: db}
}

func (r *driverLocationRepository) Create(ctx context.Context, location *models.DriverLocation) error {
	return r.db.WithContext(ctx).Create(location).Error
}

func (r *driverLocationRepository) Update(ctx context.Context, location *models.DriverLocation) error {
	return r.db.WithContext(ctx).Save(location).Error
}

func (r *driverLocationRepository) GetByDriverID(ctx context.Context, driverID uuid.UUID) (*models.DriverLocation, error) {
	var location models.DriverLocation
	err := r.db.WithContext(ctx).Where("driver_id = ?", driverID).First(&location).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDriverLocationNotFound
		}
		return nil, err
	}
	return &location, nil
}

func (r *driverLocationRepository) GetNearbyDrivers(ctx context.Context, lat, lng float64, radiusMeters int, limit int) ([]*models.DriverLocation, error) {
	var locations []*models.DriverLocation
	
	query := `
		SELECT id, driver_id, location, accuracy, heading, speed, is_online, is_available, last_seen, created_at, updated_at
		FROM driver_locations
		WHERE is_online = true 
			AND is_available = true
			AND ST_DWithin(location, ST_MakePoint(?, ?, 4326), ?)
		ORDER BY last_seen DESC
		LIMIT ?
	`
	
	err := r.db.WithContext(ctx).Raw(query, lng, lat, radiusMeters, limit).Find(&locations).Error
	return locations, err
}

func (r *driverLocationRepository) GetDriversInArea(ctx context.Context, points []models.LocationPoint, limit int) ([]*models.DriverLocation, error) {
	var locations []*models.DriverLocation
	
	polygon := "POLYGON(("
	for i, point := range points {
		if i > 0 {
			polygon += ", "
		}
		polygon += fmt.Sprintf("%f %f", point.Longitude, point.Latitude)
	}
	polygon += "))"
	
	query := `
		SELECT id, driver_id, location, accuracy, heading, speed, is_online, is_available, last_seen, created_at, updated_at
		FROM driver_locations
		WHERE is_online = true 
			AND is_available = true
			AND ST_Within(location, ST_GeomFromText(?, 4326))
		ORDER BY last_seen DESC
		LIMIT ?
	`
	
	err := r.db.WithContext(ctx).Raw(query, polygon, limit).Find(&locations).Error
	return locations, err
}

func (r *driverLocationRepository) GetOnlineDrivers(ctx context.Context, limit int) ([]*models.DriverLocation, error) {
	var locations []*models.DriverLocation
	err := r.db.WithContext(ctx).
		Where("is_online = ?", true).
		Order("last_seen DESC").
		Limit(limit).
		Find(&locations).Error
	return locations, err
}
