package repositories

import (
	"context"
	"fmt"

	"github.com/djamfikr7/tripo04os/matching-service/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DriverRepository struct {
	db *pgxpool.Pool
}

func NewDriverRepository(db *pgxpool.Pool) *DriverRepository {
	return &DriverRepository{db: db}
}

func (r *DriverRepository) GetAvailableDrivers(ctx context.Context, vertical string, pickupLat, pickupLng float64, radiusKm float64) ([]*models.AvailableDriversResponse, error) {
	query := `
		SELECT
			d.id,
			d.vertical,
			d.vehicle_type,
			d.rating,
			ST_Distance(
				ST_MakePoint(d.current_lng, d.current_lat)::geography,
				ST_MakePoint($1, $2)::geography
			) / 1000 as distance_km,
			ROUND(
				ST_Distance(
					ST_MakePoint(d.current_lng, d.current_lat)::geography,
					ST_MakePoint($1, $2)::geography
				) / 1000 / 30.0 * 60
			) as eta_minutes
		FROM drivers d
		WHERE d.vertical = $3
			AND d.is_available = true
			AND d.current_lat IS NOT NULL
			AND d.current_lng IS NOT NULL
			AND ST_DWithin(
				ST_MakePoint(d.current_lng, d.current_lat)::geography,
				ST_MakePoint($1, $2)::geography,
				$4 * 1000
			)
		ORDER BY distance_km ASC
		LIMIT 20
	`

	rows, err := r.db.Query(ctx, query, pickupLng, pickupLat, vertical, radiusKm)
	if err != nil {
		return nil, fmt.Errorf("failed to query available drivers: %w", err)
	}
	defer rows.Close()

	var drivers []*models.AvailableDriversResponse
	for rows.Next() {
		driver := &models.AvailableDriversResponse{}
		if err := rows.Scan(
			&driver.DriverID,
			&driver.Vertical,
			&driver.VehicleType,
			&driver.Rating,
			&driver.DistanceKM,
			&driver.ETAMinutes,
		); err != nil {
			return nil, fmt.Errorf("failed to scan driver row: %w", err)
		}
		drivers = append(drivers, driver)
	}

	return drivers, nil
}

func (r *DriverRepository) GetDriverByID(ctx context.Context, driverID string) (*models.Driver, error) {
	query := `
		SELECT id, user_id, vertical, vehicle_type, vehicle_plate, rating, total_trips,
			is_available, current_lat, current_lng, last_location_at, created_at, updated_at
		FROM drivers
		WHERE id = $1
	`

	driver := &models.Driver{}
	err := r.db.QueryRow(ctx, query, driverID).Scan(
		&driver.ID,
		&driver.UserID,
		&driver.Vertical,
		&driver.VehicleType,
		&driver.VehiclePlate,
		&driver.Rating,
		&driver.TotalTrips,
		&driver.IsAvailable,
		&driver.CurrentLat,
		&driver.CurrentLng,
		&driver.LastLocationAt,
		&driver.CreatedAt,
		&driver.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get driver: %w", err)
	}

	return driver, nil
}
