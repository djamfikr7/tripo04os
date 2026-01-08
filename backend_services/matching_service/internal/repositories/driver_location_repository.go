package repositories

import (
	"context"
	"fmt"

	"github.com/djamfikr7/tripo04os/matching-service/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DriverLocationRepository struct {
	db *pgxpool.Pool
}

func NewDriverLocationRepository(db *pgxpool.Pool) *DriverLocationRepository {
	return &DriverLocationRepository{db: db}
}

func (r *DriverLocationRepository) SaveDriverLocation(ctx context.Context, location *models.DriverLocation) error {
	query := `
		INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, speed, heading, location_at, received_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (driver_id, location_at) DO UPDATE SET
			latitude = EXCLUDED.latitude,
			longitude = EXCLUDED.longitude,
			accuracy = EXCLUDED.accuracy,
			speed = EXCLUDED.speed,
			heading = EXCLUDED.heading,
			received_at = EXCLUDED.received_at
	`

	_, err := r.db.Exec(ctx, query,
		location.DriverID,
		location.Latitude,
		location.Longitude,
		location.Accuracy,
		location.Speed,
		location.Heading,
		location.LocationAt,
		location.ReceivedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to save driver location: %w", err)
	}

	return nil
}

func (r *DriverLocationRepository) GetDriverLastLocation(ctx context.Context, driverID string) (*models.DriverLocation, error) {
	query := `
		SELECT driver_id, latitude, longitude, accuracy, speed, heading, location_at, received_at
		FROM driver_locations
		WHERE driver_id = $1
		ORDER BY location_at DESC
		LIMIT 1
	`

	location := &models.DriverLocation{}
	err := r.db.QueryRow(ctx, query, driverID).Scan(
		&location.DriverID,
		&location.Latitude,
		&location.Longitude,
		&location.Accuracy,
		&location.Speed,
		&location.Heading,
		&location.LocationAt,
		&location.ReceivedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get driver location: %w", err)
	}

	return location, nil
}
