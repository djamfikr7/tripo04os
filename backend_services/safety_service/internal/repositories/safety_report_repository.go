package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/djamfikr7/tripo04os/safety-service/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SafetyReportRepository struct {
	db *pgxpool.Pool
}

func NewSafetyReportRepository(db *pgxpool.Pool) *SafetyReportRepository {
	return &SafetyReportRepository{db: db}
}

func (r *SafetyReportRepository) Create(ctx context.Context, report *models.SafetyReport) error {
	query := `
		INSERT INTO safety_reports (id, reporter_id, reported_id, trip_id, incident_type, severity, description, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := r.db.Exec(ctx, query,
		report.ID,
		report.ReporterID,
		report.ReportedID,
		report.TripID,
		report.IncidentType,
		report.Severity,
		report.Description,
		report.Status,
		report.CreatedAt,
		report.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create safety report: %w", err)
	}

	return nil
}

func (r *SafetyReportRepository) GetByID(ctx context.Context, id string) (*models.SafetyReport, error) {
	query := `
		SELECT id, reporter_id, reported_id, trip_id, incident_type, severity, description, status, created_at, updated_at, resolved_at
		FROM safety_reports
		WHERE id = $1
	`

	report := &models.SafetyReport{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&report.ID,
		&report.ReporterID,
		&report.ReportedID,
		&report.TripID,
		&report.IncidentType,
		&report.Severity,
		&report.Description,
		&report.Status,
		&report.CreatedAt,
		&report.UpdatedAt,
		&report.ResolvedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get safety report: %w", err)
	}

	return report, nil
}

func (r *SafetyReportRepository) GetByUserID(ctx context.Context, userID string) ([]*models.SafetyReport, error) {
	query := `
		SELECT id, reporter_id, reported_id, trip_id, incident_type, severity, description, status, created_at, updated_at, resolved_at
		FROM safety_reports
		WHERE reporter_id = $1 OR reported_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user safety reports: %w", err)
	}
	defer rows.Close()

	var reports []*models.SafetyReport
	for rows.Next() {
		report := &models.SafetyReport{}
		if err := rows.Scan(
			&report.ID,
			&report.ReporterID,
			&report.ReportedID,
			&report.TripID,
			&report.IncidentType,
			&report.Severity,
			&report.Description,
			&report.Status,
			&report.CreatedAt,
			&report.UpdatedAt,
			&report.ResolvedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan safety report row: %w", err)
		}
		reports = append(reports, report)
	}

	return reports, nil
}

func (r *SafetyReportRepository) UpdateStatus(ctx context.Context, id, status string) error {
	query := `
		UPDATE safety_reports
		SET status = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := r.db.Exec(ctx, query, status, time.Now().UTC(), id)
	if err != nil {
		return fmt.Errorf("failed to update safety report status: %w", err)
	}

	return nil
}

func NewReportID() string {
	return uuid.New().String()
}
