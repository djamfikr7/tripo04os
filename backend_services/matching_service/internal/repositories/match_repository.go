package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/djamfikr7/tripo04os/matching-service/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DriverMatchRepository struct {
	db *pgxpool.Pool
}

func NewDriverMatchRepository(db *pgxpool.Pool) *DriverMatchRepository {
	return &DriverMatchRepository{db: db}
}

func (r *DriverMatchRepository) CreateMatch(ctx context.Context, match *models.DriverMatch) error {
	query := `
		INSERT INTO driver_matches (id, driver_id, order_id, status, match_score, eta_minutes, distance_km, response_time, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := r.db.Exec(ctx, query,
		match.ID,
		match.DriverID,
		match.OrderID,
		match.Status,
		match.MatchScore,
		match.ETAMinutes,
		match.DistanceKM,
		match.ResponseTime,
		match.CreatedAt,
		match.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create driver match: %w", err)
	}

	return nil
}

func (r *DriverMatchRepository) GetMatchByID(ctx context.Context, matchID string) (*models.DriverMatch, error) {
	query := `
		SELECT id, driver_id, order_id, status, match_score, eta_minutes, distance_km, response_time, created_at, updated_at
		FROM driver_matches
		WHERE id = $1
	`

	match := &models.DriverMatch{}
	err := r.db.QueryRow(ctx, query, matchID).Scan(
		&match.ID,
		&match.DriverID,
		&match.OrderID,
		&match.Status,
		&match.MatchScore,
		&match.ETAMinutes,
		&match.DistanceKM,
		&match.ResponseTime,
		&match.CreatedAt,
		&match.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get driver match: %w", err)
	}

	return match, nil
}

func (r *DriverMatchRepository) UpdateMatchStatus(ctx context.Context, matchID, status string) error {
	query := `
		UPDATE driver_matches
		SET status = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := r.db.Exec(ctx, query, status, time.Now().UTC(), matchID)
	if err != nil {
		return fmt.Errorf("failed to update match status: %w", err)
	}

	return nil
}

func (r *DriverMatchRepository) GetActiveMatchForDriver(ctx context.Context, driverID string) (*models.DriverMatch, error) {
	query := `
		SELECT id, driver_id, order_id, status, match_score, eta_minutes, distance_km, response_time, created_at, updated_at
		FROM driver_matches
		WHERE driver_id = $1 AND status IN ('PENDING', 'ACCEPTED')
		ORDER BY created_at DESC
		LIMIT 1
	`

	match := &models.DriverMatch{}
	err := r.db.QueryRow(ctx, query, driverID).Scan(
		&match.ID,
		&match.DriverID,
		&match.OrderID,
		&match.Status,
		&match.MatchScore,
		&match.ETAMinutes,
		&match.DistanceKM,
		&match.ResponseTime,
		&match.CreatedAt,
		&match.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get active match: %w", err)
	}

	return match, nil
}

func NewMatchID() string {
	return uuid.New().String()
}
