package tests

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/djamfikr7/tripo04os/safety-service/internal/models"
	"github.com/djamfikr7/tripo04os/safety-service/internal/services"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		SkipDefaultTransaction: true,
	})
	require.NoError(t, err)

	sqlDB, err := db.DB()
	require.NoError(t, err)

	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetMaxOpenConns(1)

	err = db.AutoMigrate(
		&models.SOSAlert{},
		&models.RideCheck{},
		&models.TripRecording{},
		&models.SafetyEvent{},
	)
	require.NoError(t, err)

	return db
}

func TestCreateSOSAlert(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()

	tripID := uuid.New()
	riderID := uuid.New()
	now := time.Now()

	alert := &models.SOSAlert{
		ID:          uuid.New(),
		TripID:      tripID,
		OrderID:     uuid.New(),
		RiderID:     riderID,
		AlertType:   models.AlertTypeEmergency,
		Severity:    models.SeverityHigh,
		Status:      models.AlertStatusPending,
		LocationLat: pointerTo(37.7749),
		LocationLng: pointerTo(-122.4194),
		TriggeredAt: now,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	result := db.Create(alert)
	require.NoError(t, result.Error)

	createdAlert, err := service.CreateSOSAlert(ctx, alert)
	require.NoError(t, err)
	assert.NotNil(t, createdAlert)

	var retrievedAlert models.SOSAlert
	db.First(&retrievedAlert, alert.ID)
	assert.Equal(t, models.AlertTypeEmergency, retrievedAlert.AlertType)
	assert.Equal(t, models.AlertStatusPending, retrievedAlert.Status)
}

func TestScheduleRideCheck(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()

	scheduledFor := time.Now().Add(1 * time.Hour)
	now := time.Now()

	check := &models.RideCheck{
		ID:           uuid.New(),
		TripID:       uuid.New(),
		OrderID:      uuid.New(),
		RiderID:      uuid.New(),
		DriverID:     uuid.New(),
		CheckType:    models.CheckTypeScheduled,
		Status:       models.CheckStatusScheduled,
		ScheduledFor: &scheduledFor,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	result := db.Create(check)
	require.NoError(t, result.Error)

	createdCheck, err := service.ScheduleRideCheck(ctx, check)
	require.NoError(t, err)
	assert.NotNil(t, createdCheck)
	assert.Equal(t, models.CheckStatusScheduled, createdCheck.Status)
}

func TestGetPendingRideChecks(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()

	scheduledTime := time.Now().Add(-5 * time.Minute)
	now := time.Now()

	check1 := &models.RideCheck{
		ID:           uuid.New(),
		TripID:       uuid.New(),
		OrderID:      uuid.New(),
		RiderID:      uuid.New(),
		DriverID:     uuid.New(),
		CheckType:    models.CheckTypeScheduled,
		Status:       models.CheckStatusScheduled,
		ScheduledFor: &scheduledTime,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	scheduledTime2 := time.Now().Add(1 * time.Hour)

	check2 := &models.RideCheck{
		ID:           uuid.New(),
		TripID:       uuid.New(),
		OrderID:      uuid.New(),
		RiderID:      uuid.New(),
		DriverID:     uuid.New(),
		CheckType:    models.CheckTypeScheduled,
		Status:       models.CheckStatusScheduled,
		ScheduledFor: &scheduledTime2,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	db.Create(check1)
	db.Create(check2)

	pendingChecks, err := service.GetPendingRideChecks(ctx)
	require.NoError(t, err)
	assert.Len(t, pendingChecks, 1)
}

func TestCreateTripRecording(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()
	now := time.Now()

	recording := &models.TripRecording{
		ID:            uuid.New(),
		TripID:        uuid.New(),
		OrderID:       uuid.New(),
		DriverID:      uuid.New(),
		RiderID:       uuid.New(),
		RecordingType: models.RecordingTypeVideo,
		Status:        models.RecordingStatusUploading,
		IsEncrypted:   true,
		Metadata:      "{}",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	result := db.Create(recording)
	require.NoError(t, result.Error)

	createdRecording, err := service.CreateTripRecording(ctx, recording)
	require.NoError(t, err)
	assert.NotNil(t, createdRecording)
	assert.Equal(t, models.RecordingStatusUploading, createdRecording.Status)
	assert.True(t, createdRecording.IsEncrypted)
}

func TestUploadTripRecording(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()
	now := time.Now()

	recording := &models.TripRecording{
		ID:            uuid.New(),
		TripID:        uuid.New(),
		OrderID:       uuid.New(),
		DriverID:      uuid.New(),
		RiderID:       uuid.New(),
		RecordingType: models.RecordingTypeVideo,
		Status:        models.RecordingStatusUploading,
		IsEncrypted:   true,
		Metadata:      "{}",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	result := db.Create(recording)
	require.NoError(t, result.Error)

	storageURL := "s3://tripo04os/recordings/test.mp4"
	err := service.UploadTripRecording(ctx, recording.ID, storageURL)
	require.NoError(t, err)

	var updatedRecording models.TripRecording
	db.First(&updatedRecording, recording.ID)
	assert.Equal(t, storageURL, updatedRecording.StorageURL)
	assert.Equal(t, models.RecordingStatusProcessing, updatedRecording.Status)
}

func TestCreateSafetyEvent(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()
	now := time.Now()

	speedKmh := 120.0
	threshold := 100.0
	tripID := uuid.New()

	event := &models.SafetyEvent{
		ID:             uuid.New(),
		TripID:         &tripID,
		OrderID:        uuid.New(),
		DriverID:       uuid.New(),
		EventType:      models.EventTypeSpeeding,
		Severity:       models.EventSeverityHigh,
		Status:         models.EventStatusDetected,
		SpeedKmh:       &speedKmh,
		ThresholdValue: &threshold,
		ActualValue:    &speedKmh,
		DeviceInfo:     "{}",
		Context:        "{}",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	result := db.Create(event)
	require.NoError(t, result.Error)

	createdEvent, err := service.CreateSafetyEvent(ctx, event)
	require.NoError(t, err)
	assert.NotNil(t, createdEvent)
	assert.Equal(t, models.EventTypeSpeeding, createdEvent.EventType)
	assert.Equal(t, models.EventSeverityHigh, createdEvent.Severity)
	assert.Equal(t, models.EventStatusDetected, createdEvent.Status)
}

func TestGetSafetyEventsByDriver(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()
	driverID := uuid.New()
	now := time.Now()

	event1 := &models.SafetyEvent{
		ID:         uuid.New(),
		OrderID:    uuid.New(),
		DriverID:   driverID,
		EventType:  models.EventTypeSpeeding,
		Severity:   models.EventSeverityHigh,
		Status:     models.EventStatusDetected,
		DeviceInfo: "{}",
		Context:    "{}",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	event2 := &models.SafetyEvent{
		ID:         uuid.New(),
		OrderID:    uuid.New(),
		DriverID:   driverID,
		EventType:  models.EventTypeHardBraking,
		Severity:   models.EventSeverityMedium,
		Status:     models.EventStatusDetected,
		DeviceInfo: "{}",
		Context:    "{}",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	db.Create(event1)
	db.Create(event2)

	events, err := service.GetSafetyEventsByDriver(ctx, driverID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 2)
}

func TestReviewSafetyEvent(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()
	reviewedBy := uuid.New()
	notes := "Confirmed speeding violation"
	now := time.Now()

	event := &models.SafetyEvent{
		ID:         uuid.New(),
		OrderID:    uuid.New(),
		DriverID:   uuid.New(),
		EventType:  models.EventTypeSpeeding,
		Severity:   models.EventSeverityHigh,
		Status:     models.EventStatusDetected,
		DeviceInfo: "{}",
		Context:    "{}",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	result := db.Create(event)
	require.NoError(t, result.Error)

	err := service.ReviewSafetyEvent(ctx, event.ID, reviewedBy, models.EventStatusConfirmed, notes, models.ActionTakenWarningSent)
	require.NoError(t, err)

	var updatedEvent models.SafetyEvent
	db.First(&updatedEvent, event.ID)
	assert.Equal(t, models.EventStatusConfirmed, updatedEvent.Status)
	assert.Equal(t, reviewedBy, *updatedEvent.ReviewedBy)
	assert.NotNil(t, updatedEvent.ReviewedAt)
	assert.Equal(t, notes, *updatedEvent.ReviewNotes)
	assert.Equal(t, models.ActionTakenWarningSent, updatedEvent.ActionTaken)
}

func TestGetSafetyStats(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()
	driverID := uuid.New()
	now := time.Now()

	speedKmh := 120.0

	event1 := &models.SafetyEvent{
		ID:         uuid.New(),
		OrderID:    uuid.New(),
		DriverID:   driverID,
		EventType:  models.EventTypeSpeeding,
		Severity:   models.EventSeverityHigh,
		Status:     models.EventStatusDetected,
		SpeedKmh:   &speedKmh,
		DeviceInfo: "{}",
		Context:    "{}",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	event2 := &models.SafetyEvent{
		ID:         uuid.New(),
		OrderID:    uuid.New(),
		DriverID:   driverID,
		EventType:  models.EventTypeHardBraking,
		Severity:   models.EventSeverityMedium,
		Status:     models.EventStatusDetected,
		DeviceInfo: "{}",
		Context:    "{}",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	db.Create(event1)
	db.Create(event2)

	stats, err := service.GetSafetyStats(ctx, driverID)
	require.NoError(t, err)
	assert.Equal(t, int64(2), stats["total_events"])
	assert.Equal(t, int64(1), stats["high_severity_count"])
	assert.Equal(t, int64(1), stats["speeding_count"])
	assert.Equal(t, int64(1), stats["hard_braking_count"])
}

func TestGetDriverPerformanceScore(t *testing.T) {
	db := setupTestDB(t)
	logger := zap.NewNop()
	service := services.NewSafetyService(db, logger)

	ctx := context.Background()
	driverID := uuid.New()

	score, err := service.GetDriverPerformanceScore(ctx, driverID)
	require.NoError(t, err)
	assert.Equal(t, 100.0, score)

	now := time.Now()
	speedKmh := 120.0

	event1 := &models.SafetyEvent{
		ID:         uuid.New(),
		OrderID:    uuid.New(),
		DriverID:   driverID,
		EventType:  models.EventTypeSpeeding,
		Severity:   models.EventSeverityHigh,
		Status:     models.EventStatusDetected,
		SpeedKmh:   &speedKmh,
		DeviceInfo: "{}",
		Context:    "{}",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	event2 := &models.SafetyEvent{
		ID:         uuid.New(),
		OrderID:    uuid.New(),
		DriverID:   driverID,
		EventType:  models.EventTypeHardBraking,
		Severity:   models.EventSeverityMedium,
		Status:     models.EventStatusDetected,
		DeviceInfo: "{}",
		Context:    "{}",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	db.Create(event1)
	db.Create(event2)

	score, err = service.GetDriverPerformanceScore(ctx, driverID)
	require.NoError(t, err)
	assert.Less(t, score, 100.0)
	assert.GreaterOrEqual(t, score, 0.0)
}

func pointerTo[T any](v T) *T {
	return &v
}
