package services

import (
	"context"
	"fmt"
	"time"

	"github.com/djamfikr7/tripo04os/safety-service/internal/models"
	"github.com/djamfikr7/tripo04os/safety-service/internal/repositories"
	"go.uber.org/zap"
)

type SafetyService struct {
	reportRepo    *repositories.SafetyReportRepository
	alertRepo     *repositories.SafetyAlertRepository
	logger        *zap.Logger
}

func NewSafetyService(
	reportRepo *repositories.SafetyReportRepository,
	alertRepo *repositories.SafetyAlertRepository,
	logger *zap.Logger,
) *SafetyService {
	return &SafetyService{
		reportRepo: reportRepo,
		alertRepo:  alertRepo,
		logger:     logger,
	}
}

func (s *SafetyService) CreateSafetyReport(ctx context.Context, report *models.SafetyReport) (*models.SafetyReport, error) {
	report.ID = repositories.NewReportID()
	report.Status = "PENDING"
	report.CreatedAt = time.Now().UTC()
	report.UpdatedAt = time.Now().UTC()

	if err := s.reportRepo.Create(ctx, report); err != nil {
		s.logger.Error("Failed to create safety report",
			zap.String("report_id", report.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to create safety report: %w", err)
	}

	s.logger.Info("Safety report created",
		zap.String("report_id", report.ID),
		zap.String("reporter_id", report.ReporterID),
		zap.String("incident_type", report.IncidentType),
	)

	alert := s.createAlertFromReport(report)
	if err := s.alertRepo.Create(ctx, alert); err != nil {
		s.logger.Warn("Failed to create safety alert",
			zap.String("report_id", report.ID),
			zap.Error(err),
		)
	}

	return report, nil
}

func (s *SafetyService) GetSafetyReport(ctx context.Context, id string) (*models.SafetyReport, error) {
	report, err := s.reportRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get safety report: %w", err)
	}

	return report, nil
}

func (s *SafetyService) GetUserSafetyReports(ctx context.Context, userID string) ([]*models.SafetyReport, error) {
	reports, err := s.reportRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user safety reports: %w", err)
	}

	return reports, nil
}

func (s *SafetyService) CreateSafetyAlert(ctx context.Context, reportID string, severity string) (*models.SafetyAlert, error) {
	alert := &models.SafetyAlert{
		ID:        repositories.NewAlertID(),
		ReportID:  reportID,
		Type:       "INCIDENT",
		Severity:   severity,
		Status:     "ACTIVE",
		ExpiresAt:  time.Now().UTC().Add(24 * time.Hour),
		CreatedAt:  time.Now().UTC(),
	}

	if err := s.alertRepo.Create(ctx, alert); err != nil {
		s.logger.Error("Failed to create safety alert",
			zap.String("alert_id", alert.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to create safety alert: %w", err)
	}

	s.logger.Info("Safety alert created",
		zap.String("alert_id", alert.ID),
		zap.String("report_id", reportID),
		zap.String("severity", severity),
	)

	return alert, nil
}

func (s *SafetyService) GetActiveAlerts(ctx context.Context) ([]*models.SafetyAlert, error) {
	alerts, err := s.alertRepo.GetActive(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get active alerts: %w", err)
	}

	return alerts, nil
}

func (s *SafetyService) ReportEmergency(ctx context.Context, emergency *models.EmergencyReport) (*models.EmergencyReport, error) {
	emergency.ID = repositories.NewReportID()
	emergency.Status = "ACTIVE"
	emergency.CreatedAt = time.Now().UTC()

	s.logger.Warn("Emergency reported",
		zap.String("emergency_id", emergency.ID),
		zap.String("user_id", emergency.UserID),
		zap.String("trip_id", emergency.TripID),
		zap.String("type", emergency.Type),
		zap.Float64("latitude", emergency.Location.Latitude),
		zap.Float64("longitude", emergency.Location.Longitude),
	)

	return emergency, nil
}

func (s *SafetyService) createAlertFromReport(report *models.SafetyReport) *models.SafetyAlert {
	alertType := "INCIDENT"
	if report.Severity == "HIGH" || report.Severity == "CRITICAL" {
		alertType = "EMERGENCY"
	}

	return &models.SafetyAlert{
		ID:        repositories.NewAlertID(),
		ReportID:  report.ID,
		Type:       alertType,
		Severity:   report.Severity,
		Status:     "ACTIVE",
		ExpiresAt:  time.Now().UTC().Add(24 * time.Hour),
		CreatedAt:  time.Now().UTC(),
	}
}
