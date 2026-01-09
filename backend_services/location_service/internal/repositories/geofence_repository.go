package repositories

import (
	"context"
	"errors"

	"github.com/djamfikr7/tripo04os/location-service/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GeofenceRepository interface {
	Create(ctx context.Context, geofence *models.Geofence) error
	Update(ctx context.Context, geofence *models.Geofence) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Geofence, error)
	List(ctx context.Context, limit, offset int) ([]*models.Geofence, int64, error)
	ListActive(ctx context.Context, limit, offset int) ([]*models.Geofence, int64, error)
	Delete(ctx context.Context, id uuid.UUID) error
	GetActiveSurgeZones(ctx context.Context) ([]*models.Geofence, error)
	CheckPointInGeofence(ctx context.Context, lat, lng float64) ([]*models.Geofence, error)
}

type geofenceRepository struct {
	db *gorm.DB
}

func NewGeofenceRepository(db *gorm.DB) GeofenceRepository {
	return &geofenceRepository{db: db}
}

func (r *geofenceRepository) Create(ctx context.Context, geofence *models.Geofence) error {
	return r.db.WithContext(ctx).Create(geofence).Error
}

func (r *geofenceRepository) Update(ctx context.Context, geofence *models.Geofence) error {
	return r.db.WithContext(ctx).Save(geofence).Error
}

func (r *geofenceRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Geofence, error) {
	var geofence models.Geofence
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&geofence).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGeofenceNotFound
		}
		return nil, err
	}
	return &geofence, nil
}

func (r *geofenceRepository) List(ctx context.Context, limit, offset int) ([]*models.Geofence, int64, error) {
	var geofences []*models.Geofence
	var total int64

	if err := r.db.WithContext(ctx).Model(&models.Geofence{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Limit(limit).
		Offset(offset).
		Order("priority DESC, created_at DESC").
		Find(&geofences).Error

	return geofences, total, err
}

func (r *geofenceRepository) ListActive(ctx context.Context, limit, offset int) ([]*models.Geofence, int64, error) {
	var geofences []*models.Geofence
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Geofence{}).Where("is_active = ?", true)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Limit(limit).
		Offset(offset).
		Order("priority DESC, created_at DESC").
		Find(&geofences).Error

	return geofences, total, err
}

func (r *geofenceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Geofence{}, id).Error
}

func (r *geofenceRepository) GetActiveSurgeZones(ctx context.Context) ([]*models.Geofence, error) {
	var geofences []*models.Geofence
	err := r.db.WithContext(ctx).
		Where("type = ? AND is_active = ?", models.GeofenceTypeSurge, true).
		Find(&geofences).Error
	return geofences, err
}

func (r *geofenceRepository) CheckPointInGeofence(ctx context.Context, lat, lng float64) ([]*models.Geofence, error) {
	var geofences []*models.Geofence
	
	point := fmt.Sprintf("POINT(%f %f)", lng, lat)
	
	query := `
		SELECT id, name, type, area, center_point, radius_meters, surge_multiplier, 
			   is_active, priority, description, created_at, updated_at
		FROM geofences
		WHERE is_active = true
			AND ST_Contains(area, ST_GeomFromText(?, 4326))
		ORDER BY priority DESC
	`
	
	err := r.db.WithContext(ctx).Raw(query, point).Find(&geofences).Error
	return geofences, err
}
