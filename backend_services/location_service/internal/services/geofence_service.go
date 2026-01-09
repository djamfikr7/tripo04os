package services

import (
	"context"

	"github.com/djamfikr7/tripo04os/location-service/internal/models"
	"github.com/djamfikr7/tripo04os/location-service/internal/repositories"
	"github.com/google/uuid"
)

type GeofenceService interface {
	CreateGeofence(ctx context.Context, geofence *models.Geofence) (*models.Geofence, error)
	UpdateGeofence(ctx context.Context, id uuid.UUID, updates map[string]any) (*models.Geofence, error)
	GetGeofence(ctx context.Context, id uuid.UUID) (*models.Geofence, error)
	ListGeofences(ctx context.Context, limit, offset int) ([]*models.Geofence, int64, error)
	DeleteGeofence(ctx context.Context, id uuid.UUID) error
	CheckGeofence(ctx context.Context, lat, lng float64) ([]*models.Geofence, error)
	GetActiveSurgeZones(ctx context.Context) ([]*models.Geofence, error)
}

type geofenceService struct {
	repo repositories.GeofenceRepository
}

func NewGeofenceService(repo repositories.GeofenceRepository) GeofenceService {
	return &geofenceService{repo: repo}
}

func (s *geofenceService) CreateGeofence(ctx context.Context, geofence *models.Geofence) (*models.Geofence, error) {
	if err := s.repo.Create(ctx, geofence); err != nil {
		return nil, err
	}
	return geofence, nil
}

func (s *geofenceService) UpdateGeofence(ctx context.Context, id uuid.UUID, updates map[string]any) (*models.Geofence, error) {
	geofence, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	for key, value := range updates {
		switch key {
		case "name":
			geofence.Name = value.(string)
		case "type":
			geofence.Type = value.(models.GeofenceType)
		case "area":
			geofence.Area = value.(string)
		case "center_point":
			geofence.CenterPoint = value.(string)
		case "radius_meters":
			geofence.RadiusMeters = value.(int)
		case "surge_multiplier":
			geofence.SurgeMultiplier = value.(float64)
		case "is_active":
			geofence.IsActive = value.(bool)
		case "priority":
			geofence.Priority = value.(int)
		case "description":
			geofence.Description = value.(string)
		}
	}

	if err := s.repo.Update(ctx, geofence); err != nil {
		return nil, err
	}

	return geofence, nil
}

func (s *geofenceService) GetGeofence(ctx context.Context, id uuid.UUID) (*models.Geofence, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *geofenceService) ListGeofences(ctx context.Context, limit, offset int) ([]*models.Geofence, int64, error) {
	return s.repo.List(ctx, limit, offset)
}

func (s *geofenceService) DeleteGeofence(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *geofenceService) CheckGeofence(ctx context.Context, lat, lng float64) ([]*models.Geofence, error) {
	return s.repo.CheckPointInGeofence(ctx, lat, lng)
}

func (s *geofenceService) GetActiveSurgeZones(ctx context.Context) ([]*models.Geofence, error) {
	return s.repo.GetActiveSurgeZones(ctx)
}
