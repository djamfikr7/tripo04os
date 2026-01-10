package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/djamfikr7/tripo04os/safety-service/internal/models"
)

type SafetyService struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewSafetyService(db *gorm.DB, logger *zap.Logger) *SafetyService {
	return &SafetyService{
		db:     db,
		logger: logger,
	}
}

func (s *SafetyService) CreateSOSAlert(ctx context.Context, alert *models.SOSAlert) (*models.SOSAlert, error) {
	s.logger.Info("Creating SOS alert",
		zap.String("alert_type", string(alert.AlertType)),
		zap.String("trip_id", alert.TripID.String()),
		zap.String("rider_id", alert.RiderID.String()),
	)

	result := s.db.WithContext(ctx).Exec(`
		INSERT INTO sos_alerts (id, trip_id, order_id, rider_id, driver_id, alert_type, severity, status, description, location_lat, location_lng, address, contact_number, additional_info, triggered_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, alert.ID, alert.TripID, alert.OrderID, alert.RiderID, alert.DriverID, alert.AlertType, alert.Severity, alert.Status, alert.Description, alert.LocationLat, alert.LocationLng, alert.Address, alert.ContactNumber, alert.AdditionalInfo, alert.TriggeredAt)

	if result.Error != nil {
		s.logger.Error("Failed to create SOS alert", zap.Error(result.Error))
		return nil, fmt.Errorf("failed to create SOS alert: %w", result.Error)
	}

	var retrieved models.SOSAlert
	if err := s.db.WithContext(ctx).Where("id = ?", alert.ID).First(&retrieved).Error; err != nil {
		return nil, err
	}

	return &retrieved, nil
}

func (s *SafetyService) GetSOSAlert(ctx context.Context, id uuid.UUID) (*models.SOSAlert, error) {
	var alert models.SOSAlert
	err := s.db.WithContext(ctx).Where("id = ?", id).First(&alert).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("SOS alert not found")
		}
		return nil, err
	}
	return &alert, nil
}

func (s *SafetyService) GetSOSAlertsByTrip(ctx context.Context, tripID uuid.UUID) ([]models.SOSAlert, error) {
	var alerts []models.SOSAlert
	err := s.db.WithContext(ctx).Where("trip_id = ?", tripID).Order("triggered_at DESC").Find(&alerts).Error
	return alerts, err
}

func (s *SafetyService) GetActiveSOSAlerts(ctx context.Context) ([]models.SOSAlert, error) {
	var alerts []models.SOSAlert
	err := s.db.WithContext(ctx).
		Where("status IN ?", []string{string(models.AlertStatusPending), string(models.AlertStatusInProgress)}).
		Order("triggered_at DESC").
		Find(&alerts).Error
	return alerts, err
}

func (s *SafetyService) UpdateSOSAlertStatus(ctx context.Context, id uuid.UUID, status models.AlertStatus, resolvedBy uuid.UUID, notes string) error {
	s.logger.Info("Updating SOS alert status",
		zap.String("id", id.String()),
		zap.String("status", string(status)),
	)

	updates := map[string]interface{}{
		"status":           status,
		"resolved_by":      resolvedBy,
		"resolution_notes": notes,
	}

	if status == models.AlertStatusResolved {
		now := time.Now()
		updates["resolved_at"] = now
	}

	result := s.db.WithContext(ctx).Model(&models.SOSAlert{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return fmt.Errorf("failed to update SOS alert: %w", result.Error)
	}

	return nil
}

func (s *SafetyService) MarkSOSAlertAcknowledged(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	result := s.db.WithContext(ctx).Model(&models.SOSAlert{}).Where("id = ?", id).Update("acknowledged_at", now)
	return result.Error
}

func (s *SafetyService) ScheduleRideCheck(ctx context.Context, check *models.RideCheck) (*models.RideCheck, error) {
	s.logger.Info("Scheduling ride check",
		zap.String("trip_id", check.TripID.String()),
		zap.Time("scheduled_for", *check.ScheduledFor),
	)

	if err := s.db.WithContext(ctx).Create(check).Error; err != nil {
		return nil, fmt.Errorf("failed to schedule ride check: %w", err)
	}

	return check, nil
}

func (s *SafetyService) GetRideCheck(ctx context.Context, id uuid.UUID) (*models.RideCheck, error) {
	var check models.RideCheck
	err := s.db.WithContext(ctx).Where("id = ?", id).First(&check).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("ride check not found")
		}
		return nil, err
	}
	return &check, nil
}

func (s *SafetyService) GetPendingRideChecks(ctx context.Context) ([]models.RideCheck, error) {
	var checks []models.RideCheck
	err := s.db.WithContext(ctx).
		Where("status = ? AND scheduled_for <= ?", string(models.CheckStatusScheduled), time.Now()).
		Order("scheduled_for ASC").
		Find(&checks).Error
	return checks, err
}

func (s *SafetyService) GetRideChecksByTrip(ctx context.Context, tripID uuid.UUID) ([]models.RideCheck, error) {
	var checks []models.RideCheck
	err := s.db.WithContext(ctx).Where("trip_id = ?", tripID).Order("check_time DESC").Find(&checks).Error
	return checks, err
}

func (s *SafetyService) ExecuteRideCheck(ctx context.Context, id uuid.UUID, response models.ResponseType, notes string, driverLat, driverLng, riderLat, riderLng *float64) error {
	now := time.Now()

	updates := map[string]interface{}{
		"status":              string(models.CheckStatusCompleted),
		"check_time":          now,
		"response_type":       response,
		"notes":               notes,
		"driver_location_lat": driverLat,
		"driver_location_lng": driverLng,
		"rider_location_lat":  riderLat,
		"rider_location_lng":  riderLng,
	}

	if response == models.ResponseTypeConcern || response == models.ResponseTypeDistress {
		updates["follow_up_required"] = true
	}

	result := s.db.WithContext(ctx).Model(&models.RideCheck{}).Where("id = ?", id).Updates(updates)
	return result.Error
}

func (s *SafetyService) MarkRideCheckInProgress(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	result := s.db.WithContext(ctx).Model(&models.RideCheck{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     string(models.CheckStatusInProgress),
		"check_time": now,
	})
	return result.Error
}

func (s *SafetyService) MarkRideCheckFailed(ctx context.Context, id uuid.UUID, reason string) error {
	s.logger.Warn("Marking ride check as failed",
		zap.String("id", id.String()),
		zap.String("reason", reason),
	)

	now := time.Now()
	result := s.db.WithContext(ctx).Model(&models.RideCheck{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     string(models.CheckStatusFailed),
		"check_time": now,
		"notes":      reason,
	})

	return result.Error
}

func (s *SafetyService) SkipRideCheck(ctx context.Context, id uuid.UUID) error {
	result := s.db.WithContext(ctx).Model(&models.RideCheck{}).Where("id = ?", id).Update("status", string(models.CheckStatusSkipped))
	return result.Error
}

func (s *SafetyService) CreateTripRecording(ctx context.Context, recording *models.TripRecording) (*models.TripRecording, error) {
	s.logger.Info("Creating trip recording",
		zap.String("trip_id", recording.TripID.String()),
		zap.String("type", string(recording.RecordingType)),
	)

	if err := s.db.WithContext(ctx).Create(recording).Error; err != nil {
		return nil, fmt.Errorf("failed to create trip recording: %w", err)
	}

	now := time.Now()
	recording.UploadStartedAt = &now
	s.db.WithContext(ctx).Save(recording)

	return recording, nil
}

func (s *SafetyService) UploadTripRecording(ctx context.Context, id uuid.UUID, storageURL string) error {
	now := time.Now()

	result := s.db.WithContext(ctx).Model(&models.TripRecording{}).Where("id = ?", id).Updates(map[string]interface{}{
		"storage_url":         storageURL,
		"status":              string(models.RecordingStatusProcessing),
		"upload_completed_at": now,
	})

	return result.Error
}

func (s *SafetyService) MarkRecordingReady(ctx context.Context, id uuid.UUID) error {
	result := s.db.WithContext(ctx).Model(&models.TripRecording{}).Where("id = ?", id).Update("status", string(models.RecordingStatusReady))
	return result.Error
}

func (s *SafetyService) GetTripRecording(ctx context.Context, id uuid.UUID) (*models.TripRecording, error) {
	var recording models.TripRecording
	err := s.db.WithContext(ctx).Where("id = ?", id).First(&recording).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("recording not found")
		}
		return nil, err
	}
	return &recording, nil
}

func (s *SafetyService) GetTripRecordingsByTrip(ctx context.Context, tripID uuid.UUID) ([]models.TripRecording, error) {
	var recordings []models.TripRecording
	err := s.db.WithContext(ctx).Where("trip_id = ?", tripID).Order("created_at DESC").Find(&recordings).Error
	return recordings, err
}

func (s *SafetyService) DeleteExpiredRecordings(ctx context.Context) (int64, error) {
	result := s.db.WithContext(ctx).
		Where("retention_until < ?", time.Now()).
		Delete(&models.TripRecording{})

	if result.Error != nil {
		return 0, result.Error
	}

	s.logger.Info("Deleted expired recordings", zap.Int64("count", result.RowsAffected))
	return result.RowsAffected, nil
}

func (s *SafetyService) CreateSafetyEvent(ctx context.Context, event *models.SafetyEvent) (*models.SafetyEvent, error) {
	s.logger.Info("Creating safety event",
		zap.String("event_type", string(event.EventType)),
		zap.String("trip_id", event.TripID.String()),
		zap.String("driver_id", event.DriverID.String()),
	)

	if err := s.db.WithContext(ctx).Create(event).Error; err != nil {
		return nil, fmt.Errorf("failed to create safety event: %w", err)
	}

	return event, nil
}

func (s *SafetyService) GetSafetyEvent(ctx context.Context, id uuid.UUID) (*models.SafetyEvent, error) {
	var event models.SafetyEvent
	err := s.db.WithContext(ctx).Where("id = ?", id).First(&event).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("safety event not found")
		}
		return nil, err
	}
	return &event, nil
}

func (s *SafetyService) GetSafetyEventsByDriver(ctx context.Context, driverID uuid.UUID, limit int) ([]models.SafetyEvent, error) {
	var events []models.SafetyEvent
	query := s.db.WithContext(ctx).Where("driver_id = ?", driverID)

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Order("created_at DESC").Find(&events).Error
	return events, err
}

func (s *SafetyService) GetHighSeverityEvents(ctx context.Context) ([]models.SafetyEvent, error) {
	var events []models.SafetyEvent
	err := s.db.WithContext(ctx).
		Where("severity IN ?", []string{string(models.EventSeverityHigh), string(models.EventSeverityCritical)}).
		Where("status IN ?", []string{string(models.EventStatusDetected), string(models.EventStatusReviewing)}).
		Order("created_at DESC").
		Find(&events).Error
	return events, err
}

func (s *SafetyService) ReviewSafetyEvent(ctx context.Context, id uuid.UUID, reviewedBy uuid.UUID, status models.EventStatus, notes string, action models.ActionTaken) error {
	s.logger.Info("Reviewing safety event",
		zap.String("id", id.String()),
		zap.String("status", string(status)),
		zap.String("action", string(action)),
	)

	now := time.Now()
	updates := map[string]interface{}{
		"status":       status,
		"reviewed_by":  reviewedBy,
		"reviewed_at":  now,
		"review_notes": notes,
		"action_taken": action,
	}

	result := s.db.WithContext(ctx).Model(&models.SafetyEvent{}).Where("id = ?", id).Updates(updates)
	return result.Error
}

func (s *SafetyService) GetEventsNeedingReview(ctx context.Context, limit int) ([]models.SafetyEvent, error) {
	var events []models.SafetyEvent
	query := s.db.WithContext(ctx).
		Where("status IN ?", []string{string(models.EventStatusDetected), string(models.EventStatusReviewing)}).
		Order("severity DESC, created_at ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&events).Error
	return events, err
}

func (s *SafetyService) GetSafetyStats(ctx context.Context, driverID uuid.UUID) (map[string]interface{}, error) {
	var stats struct {
		TotalEvents       int64
		HighSeverityCount int64
		SpeedingCount     int64
		HardBrakingCount  int64
		OffRouteCount     int64
	}

	s.db.WithContext(ctx).Model(&models.SafetyEvent{}).
		Where("driver_id = ?", driverID).
		Select("COUNT(*) as total_events").
		Scan(&stats.TotalEvents)

	s.db.WithContext(ctx).Model(&models.SafetyEvent{}).
		Where("driver_id = ? AND severity IN ('HIGH','CRITICAL')", driverID).
		Count(&stats.HighSeverityCount)

	s.db.WithContext(ctx).Model(&models.SafetyEvent{}).
		Where("driver_id = ? AND event_type = 'SPEEDING'", driverID).
		Count(&stats.SpeedingCount)

	s.db.WithContext(ctx).Model(&models.SafetyEvent{}).
		Where("driver_id = ? AND event_type = 'HARD_BRAKING'", driverID).
		Count(&stats.HardBrakingCount)

	s.db.WithContext(ctx).Model(&models.SafetyEvent{}).
		Where("driver_id = ? AND event_type = 'OFF_ROUTE'", driverID).
		Count(&stats.OffRouteCount)

	return map[string]interface{}{
		"total_events":        stats.TotalEvents,
		"high_severity_count": stats.HighSeverityCount,
		"speeding_count":      stats.SpeedingCount,
		"hard_braking_count":  stats.HardBrakingCount,
		"off_route_count":     stats.OffRouteCount,
	}, nil
}

func (s *SafetyService) GetDriverPerformanceScore(ctx context.Context, driverID uuid.UUID) (float64, error) {
	var stats struct {
		TotalEvents       int64
		HighSeverityCount int64
	}

	s.db.WithContext(ctx).Model(&models.SafetyEvent{}).
		Where("driver_id = ? AND created_at >= ?", driverID, time.Now().AddDate(0, -30, 0)).
		Select("COUNT(*) as total_events").
		Scan(&stats.TotalEvents)

	s.db.WithContext(ctx).Model(&models.SafetyEvent{}).
		Where("driver_id = ? AND severity IN ('HIGH','CRITICAL') AND created_at >= ?", driverID, time.Now().AddDate(0, -30, 0)).
		Count(&stats.HighSeverityCount)

	if stats.TotalEvents == 0 {
		return 100.0, nil
	}

	riskScore := 0.0
	if stats.HighSeverityCount > 0 {
		riskScore = (float64(stats.HighSeverityCount) / float64(stats.TotalEvents)) * 50
	}

	performanceScore := 100.0 - riskScore
	if performanceScore < 0 {
		performanceScore = 0
	}

	return performanceScore, nil
}

func (s *SafetyService) CleanupOldData(ctx context.Context) error {
	deletedCount, err := s.DeleteExpiredRecordings(ctx)
	if err != nil {
		return err
	}

	s.logger.Info("Cleanup completed", zap.Int64("deleted_recordings", deletedCount))
	return nil
}

func (s *SafetyService) GetSOSAlertsByStatus(ctx context.Context, status models.AlertStatus, limit int) ([]models.SOSAlert, error) {
	var alerts []models.SOSAlert
	query := s.db.WithContext(ctx).Where("status = ?", status).Order("triggered_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&alerts).Error
	return alerts, err
}

func (s *SafetyService) GetFollowUpRequiredChecks(ctx context.Context) ([]models.RideCheck, error) {
	var checks []models.RideCheck
	err := s.db.WithContext(ctx).
		Where("follow_up_required = ? AND status = ?", true, string(models.CheckStatusCompleted)).
		Order("check_time DESC").
		Find(&checks).Error
	return checks, err
}
