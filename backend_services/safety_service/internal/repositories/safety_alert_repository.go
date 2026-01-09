package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/djamfikr7/tripo04os/safety-service/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SafetyAlertRepository struct {
	db *pgxpool.Pool
}

func NewSafetyAlertRepository(db *pgxpool.Pool) *SafetyAlertRepository {
	return &SafetyAlertRepository{db: db}
}

func (r *SafetyAlertRepository) Create(ctx context.Context, alert *models.SafetyAlert) error {
	query := `
		INSERT INTO safety_alerts (id, report_id, type, severity, status, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := r.db.Exec(ctx, query,
		alert.ID,
		alert.ReportID,
		alert.Type,
		alert.Severity,
		alert.Status,
		alert.ExpiresAt,
		alert.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create safety alert: %w", err)
	}

	return nil
}

func (r *SafetyAlertRepository) GetByID(ctx context.Context, id string) (*models.SafetyAlert, error) {
	query := `
		SELECT id, report_id, type, severity, status, expires_at, created_at, resolved_at
		FROM safety_alerts
		WHERE id = $1
	`

	alert := &models.SafetyAlert{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&alert.ID,
		&alert.ReportID,
		&alert.Type,
		&alert.Severity,
		&alert.Status,
		&alert.ExpiresAt,
		&alert.CreatedAt,
		&alert.ResolvedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get safety alert: %w", err)
	}

	return alert, nil
}

func (r *SafetyAlertRepository) GetActive(ctx context.Context) ([]*models.SafetyAlert, error) {
	query := `
		SELECT id, report_id, type, severity, status, expires_at, created_at, resolved_at
		FROM safety_alerts
		WHERE status = 'ACTIVE' AND expires_at > $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, time.Now().UTC())
	if err != nil {
		return nil, fmt.Errorf("failed to get active alerts: %w", err)
	}
	defer rows.Close()

	var alerts []*models.SafetyAlert
	for rows.Next() {
		alert := &models.SafetyAlert{}
		if err := rows.Scan(
			&alert.ID,
			&alert.ReportID,
			&alert.Type,
			&alert.Severity,
			&alert.Status,
			&alert.ExpiresAt,
			&alert.CreatedAt,
			&alert.ResolvedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan safety alert row: %w", err)
		}
		alerts = append(alerts, alert)
	}

	return alerts, nil
}

func (r *SafetyAlertRepository) UpdateStatus(ctx context.Context, id, status string) error {
	query := `
		UPDATE safety_alerts
		SET status = $1, resolved_at = $2
		WHERE id = $3
	`

	_, err := r.db.Exec(ctx, query, status, time.Now().UTC(), id)
	if err != nil {
		return fmt.Errorf("failed to update safety alert status: %w", err)
	}

	return nil
}

func NewAlertID() string {
	return uuid.New().String()
}
