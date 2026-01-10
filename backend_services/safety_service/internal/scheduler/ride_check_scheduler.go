package scheduler

import (
	"context"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type RideCheckScheduler struct {
	db       *gorm.DB
	logger   *zap.Logger
	interval time.Duration
	stopCh   chan struct{}
}

func NewRideCheckScheduler(db *gorm.DB, logger *zap.Logger, interval time.Duration) *RideCheckScheduler {
	return &RideCheckScheduler{
		db:       db,
		logger:   logger,
		interval: interval,
		stopCh:   make(chan struct{}),
	}
}

func (s *RideCheckScheduler) Start(ctx context.Context) {
	s.logger.Info("Starting ride check scheduler", zap.Duration("interval", s.interval))

	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("Ride check scheduler stopping via context")
			return
		case <-s.stopCh:
			s.logger.Info("Ride check scheduler stopping via stop signal")
			return
		case <-ticker.C:
			s.runRideCheckCycle(ctx)
		}
	}
}

func (s *RideCheckScheduler) Stop() {
	close(s.stopCh)
	s.logger.Info("Ride check scheduler stopped")
}

func (s *RideCheckScheduler) runRideCheckCycle(ctx context.Context) {
	s.logger.Debug("Running ride check cycle")

	pendingChecks, err := s.getPendingChecks(ctx)
	if err != nil {
		s.logger.Error("Failed to get pending ride checks", zap.Error(err))
		return
	}

	s.logger.Debug("Found pending ride checks", zap.Int("count", len(pendingChecks)))

	for _, check := range pendingChecks {
		if err := s.processRideCheck(ctx, check); err != nil {
			s.logger.Error("Failed to process ride check",
				zap.String("check_id", check.ID.String()),
				zap.Error(err),
			)
		}
	}
}

func (s *RideCheckScheduler) getPendingChecks(ctx context.Context) ([]RideCheck, error) {
	var checks []RideCheck

	query := `
		SELECT id, trip_id, rider_id, driver_id, check_type, status, scheduled_for
		FROM ride_checks
		WHERE status = 'SCHEDULED'
		  AND scheduled_for <= NOW()
		ORDER BY scheduled_for ASC
		LIMIT 100
	`

	if err := s.db.WithContext(ctx).Raw(query).Scan(&checks).Error; err != nil {
		return nil, err
	}

	return checks, nil
}

func (s *RideCheckScheduler) processRideCheck(ctx context.Context, check RideCheck) error {
	s.logger.Info("Processing ride check",
		zap.String("check_id", check.ID.String()),
		zap.String("trip_id", check.TripID.String()),
	)

	now := time.Now()

	// Mark as IN_PROGRESS
	if err := s.markInProgress(ctx, check.ID, now); err != nil {
		return err
	}

	// In production, this would:
	// 1. Send push notification to rider app
	// 2. Send push notification to driver app
	// 3. Wait for response from apps
	// 4. Execute the ride check with response

	// For now, we'll simulate sending notifications
	s.sendCheckNotifications(ctx, check)

	// Note: The actual response will come via API endpoint
	// This scheduler just triggers the check and marks it IN_PROGRESS
	// The apps will respond via the ExecuteRideCheck endpoint

	return nil
}

func (s *RideCheckScheduler) markInProgress(ctx context.Context, checkID uuid.UUID, checkTime time.Time) error {
	result := s.db.WithContext(ctx).Exec(`
		UPDATE ride_checks
		SET status = 'IN_PROGRESS',
		    check_time = ?
		WHERE id = ? AND status = 'SCHEDULED'
	`, checkTime, checkID)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		s.logger.Warn("No ride check updated to IN_PROGRESS", zap.String("check_id", checkID.String()))
	}

	return nil
}

func (s *RideCheckScheduler) sendCheckNotifications(ctx context.Context, check RideCheck) {
	// TODO: Integrate with Notification Service
	// Send push notification to rider
	s.logger.Info("Would send rider notification",
		zap.String("rider_id", check.RiderID.String()),
		zap.String("check_type", string(check.CheckType)),
	)

	// Send push notification to driver
	s.logger.Info("Would send driver notification",
		zap.String("driver_id", check.DriverID.String()),
		zap.String("check_type", string(check.CheckType)),
	)
}

type RideCheck struct {
	ID               uuid.UUID     `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TripID           uuid.UUID     `gorm:"type:uuid;not null;index:idx_trip_id"`
	RiderID          uuid.UUID     `gorm:"type:uuid;not null"`
	DriverID         uuid.UUID     `gorm:"type:uuid;not null"`
	CheckType        CheckType     `gorm:"type:varchar(20);not null"`
	Status           CheckStatus   `gorm:"type:varchar(20);not null;default:'SCHEDULED'"`
	ScheduledFor     *time.Time    `gorm:"not null"`
	CheckTime        *time.Time    `gorm:"index"`
	ResponseType     *ResponseType `gorm:"type:varchar(20)"`
	DriverLat        *float64      `gorm:"column:driver_location_lat"`
	DriverLng        *float64      `gorm:"column:driver_location_lng"`
	RiderLat         *float64      `gorm:"column:rider_location_lat"`
	RiderLng         *float64      `gorm:"column:rider_location_lng"`
	Notes            *string
	FollowUpRequired bool      `gorm:"default:false"`
	CreatedAt        time.Time `gorm:"default:now()"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime"`
}

type CheckType string

const (
	CheckTypeScheduled CheckType = "SCHEDULED"
	CheckTypeManual    CheckType = "MANUAL"
	CheckTypeEmergency CheckType = "EMERGENCY"
)

type CheckStatus string

const (
	CheckStatusScheduled  CheckStatus = "SCHEDULED"
	CheckStatusInProgress CheckStatus = "IN_PROGRESS"
	CheckStatusCompleted  CheckStatus = "COMPLETED"
	CheckStatusFailed     CheckStatus = "FAILED"
	CheckStatusSkipped    CheckStatus = "SKIPPED"
)

type ResponseType string

const (
	ResponseTypeOK       ResponseType = "OK"
	ResponseTypeConcern  ResponseType = "CONCERN"
	ResponseTypeDistress ResponseType = "DISTRESS"
)
