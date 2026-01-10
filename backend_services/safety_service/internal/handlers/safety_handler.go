package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/djamfikr7/tripo04os/safety-service/internal/models"
	"github.com/djamfikr7/tripo04os/safety-service/internal/services"
)

type SafetyHandler struct {
	safetySvc *services.SafetyService
	logger    *zap.Logger
}

func NewSafetyHandler(safetySvc *services.SafetyService, logger *zap.Logger) *SafetyHandler {
	return &SafetyHandler{
		safetySvc: safetySvc,
		logger:    logger,
	}
}

func (h *SafetyHandler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1/safety")
	{
		api.POST("/sos-alerts", h.CreateSOSAlert)
		api.GET("/sos-alerts", h.GetSOSAlerts)
		api.GET("/sos-alerts/:id", h.GetSOSAlert)
		api.PUT("/sos-alerts/:id/acknowledge", h.AcknowledgeSOSAlert)
		api.PUT("/sos-alerts/:id/resolve", h.ResolveSOSAlert)
		api.GET("/sos-alerts/active", h.GetActiveSOSAlerts)

		api.POST("/ride-checks", h.ScheduleRideCheck)
		api.GET("/ride-checks/:id", h.GetRideCheck)
		api.PUT("/ride-checks/:id/execute", h.ExecuteRideCheck)
		api.GET("/ride-checks/pending", h.GetPendingRideChecks)
		api.GET("/ride-checks/trip/:tripId", h.GetRideChecksByTrip)
		api.GET("/ride-checks/followup", h.GetFollowUpRequiredChecks)

		api.POST("/trip-recordings", h.CreateTripRecording)
		api.GET("/trip-recordings/:id", h.GetTripRecording)
		api.PUT("/trip-recordings/:id/upload", h.UploadTripRecording)
		api.GET("/trip-recordings/trip/:tripId", h.GetTripRecordingsByTrip)

		api.POST("/safety-events", h.CreateSafetyEvent)
		api.GET("/safety-events/:id", h.GetSafetyEvent)
		api.GET("/safety-events/driver/:driverId", h.GetSafetyEventsByDriver)
		api.GET("/safety-events/high-severity", h.GetHighSeverityEvents)
		api.PUT("/safety-events/:id/review", h.ReviewSafetyEvent)
		api.GET("/safety-events/review-pending", h.GetEventsNeedingReview)

		api.GET("/drivers/:driverId/stats", h.GetSafetyStats)
		api.GET("/drivers/:driverId/performance-score", h.GetDriverPerformanceScore)

		api.POST("/cleanup", h.Cleanup)
	}
}

func (h *SafetyHandler) CreateSOSAlert(c *gin.Context) {
	var req struct {
		TripID         uuid.UUID  `form:"trip_id" binding:"required"`
		OrderID        uuid.UUID  `form:"order_id" binding:"required"`
		RiderID        uuid.UUID  `form:"rider_id" binding:"required"`
		DriverID       *uuid.UUID `form:"driver_id"`
		AlertType      string     `form:"alert_type" binding:"required,oneof=EMERGENCY MEDICAL ACCIDENT HARASSMENT OTHER"`
		Severity       string     `form:"severity" binding:"required,oneof=LOW MEDIUM HIGH CRITICAL"`
		Description    *string    `form:"description"`
		LocationLat    *float64   `form:"location_lat"`
		LocationLng    *float64   `form:"location_lng"`
		Address        *string    `form:"address"`
		ContactNumber  *string    `form:"contact_number"`
		AdditionalInfo string     `form:"additional_info"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	alert := &models.SOSAlert{
		ID:             uuid.New(),
		TripID:         req.TripID,
		OrderID:        req.OrderID,
		RiderID:        req.RiderID,
		DriverID:       req.DriverID,
		AlertType:      models.AlertType(req.AlertType),
		Severity:       models.AlertSeverity(req.Severity),
		Status:         models.AlertStatusPending,
		Description:    req.Description,
		LocationLat:    req.LocationLat,
		LocationLng:    req.LocationLng,
		Address:        req.Address,
		ContactNumber:  req.ContactNumber,
		AdditionalInfo: string(req.AdditionalInfo),
		TriggeredAt:    time.Now(),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	createdAlert, err := h.safetySvc.CreateSOSAlert(c.Request.Context(), alert)
	if err != nil {
		h.logger.Error("Failed to create SOS alert", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create SOS alert"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": createdAlert})
}

func (h *SafetyHandler) GetSOSAlerts(c *gin.Context) {
	status := c.Query("status")
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	if status == "" {
		status = string(models.AlertStatusPending)
	}

	alerts, err := h.safetySvc.GetSOSAlertsByStatus(c.Request.Context(), models.AlertStatus(status), limit)
	if err != nil {
		h.logger.Error("Failed to get SOS alerts", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get SOS alerts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": alerts})
}

func (h *SafetyHandler) GetSOSAlert(c *gin.Context) {
	id := c.Param("id")
	alertID := uuid.MustParse(id)

	alert, err := h.safetySvc.GetSOSAlert(c.Request.Context(), alertID)
	if err != nil {
		h.logger.Error("Failed to get SOS alert", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "SOS alert not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": alert})
}

func (h *SafetyHandler) AcknowledgeSOSAlert(c *gin.Context) {
	id := c.Param("id")
	alertID := uuid.MustParse(id)

	if err := h.safetySvc.MarkSOSAlertAcknowledged(c.Request.Context(), alertID); err != nil {
		h.logger.Error("Failed to acknowledge SOS alert", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acknowledge alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Alert acknowledged"})
}

func (h *SafetyHandler) ResolveSOSAlert(c *gin.Context) {
	id := c.Param("id")
	alertID := uuid.MustParse(id)

	var req struct {
		Status     string     `form:"status" binding:"required,oneof=PENDING IN_PROGRESS RESOLVED FALSE_ALARM"`
		ResolvedBy *uuid.UUID `form:"resolved_by"`
		Notes      *string    `form:"resolution_notes"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.safetySvc.UpdateSOSAlertStatus(c.Request.Context(), alertID, models.AlertStatus(req.Status), *req.ResolvedBy, *req.Notes); err != nil {
		h.logger.Error("Failed to resolve SOS alert", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Alert resolved"})
}

func (h *SafetyHandler) GetActiveSOSAlerts(c *gin.Context) {
	alerts, err := h.safetySvc.GetActiveSOSAlerts(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get active SOS alerts", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get active alerts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": alerts})
}

func (h *SafetyHandler) ScheduleRideCheck(c *gin.Context) {
	var req struct {
		TripID       uuid.UUID `form:"trip_id" binding:"required"`
		OrderID      uuid.UUID `form:"order_id" binding:"required"`
		RiderID      uuid.UUID `form:"rider_id" binding:"required"`
		DriverID     uuid.UUID `form:"driver_id" binding:"required"`
		CheckType    string    `form:"check_type" binding:"required,oneof=SCHEDULED MANUAL AUTOMATED"`
		ScheduledFor string    `form:"scheduled_for" binding:"required"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	scheduledFor, err := time.Parse(time.RFC3339, req.ScheduledFor)
	if err != nil {
		h.logger.Error("Failed to parse scheduled_for time", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scheduled_for format"})
		return
	}

	check := &models.RideCheck{
		ID:           uuid.New(),
		TripID:       req.TripID,
		OrderID:      req.OrderID,
		RiderID:      req.RiderID,
		DriverID:     req.DriverID,
		CheckType:    models.CheckType(req.CheckType),
		ScheduledFor: &scheduledFor,
		Status:       models.CheckStatusScheduled,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	createdCheck, err := h.safetySvc.ScheduleRideCheck(c.Request.Context(), check)
	if err != nil {
		h.logger.Error("Failed to schedule ride check", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to schedule ride check"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": createdCheck})
}

func (h *SafetyHandler) GetRideCheck(c *gin.Context) {
	id := c.Param("id")
	checkID := uuid.MustParse(id)

	check, err := h.safetySvc.GetRideCheck(c.Request.Context(), checkID)
	if err != nil {
		h.logger.Error("Failed to get ride check", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride check not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": check})
}

func (h *SafetyHandler) ExecuteRideCheck(c *gin.Context) {
	id := c.Param("id")
	checkID := uuid.MustParse(id)

	var req struct {
		ResponseType string   `form:"response_type" binding:"required,oneof=OK CONCERN DISTRESS NO_RESPONSE SYSTEM_ERROR"`
		Notes        *string  `form:"notes"`
		DriverLat    *float64 `form:"driver_location_lat"`
		DriverLng    *float64 `form:"driver_location_lng"`
		RiderLat     *float64 `form:"rider_location_lat"`
		RiderLng     *float64 `form:"rider_location_lng"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.safetySvc.ExecuteRideCheck(c.Request.Context(), checkID, models.ResponseType(req.ResponseType), *req.Notes, req.DriverLat, req.DriverLng, req.RiderLat, req.RiderLng); err != nil {
		h.logger.Error("Failed to execute ride check", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to execute ride check"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Ride check executed"})
}

func (h *SafetyHandler) GetPendingRideChecks(c *gin.Context) {
	checks, err := h.safetySvc.GetPendingRideChecks(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get pending ride checks", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending checks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": checks})
}

func (h *SafetyHandler) GetRideChecksByTrip(c *gin.Context) {
	tripID := c.Param("tripId")
	tripUUID := uuid.MustParse(tripID)

	checks, err := h.safetySvc.GetRideChecksByTrip(c.Request.Context(), tripUUID)
	if err != nil {
		h.logger.Error("Failed to get ride checks by trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get ride checks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": checks})
}

func (h *SafetyHandler) GetFollowUpRequiredChecks(c *gin.Context) {
	checks, err := h.safetySvc.GetFollowUpRequiredChecks(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get follow-up required checks", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get follow-up checks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": checks})
}

func (h *SafetyHandler) CreateTripRecording(c *gin.Context) {
	var req struct {
		TripID        uuid.UUID `form:"trip_id" binding:"required"`
		OrderID       uuid.UUID `form:"order_id" binding:"required"`
		DriverID      uuid.UUID `form:"driver_id" binding:"required"`
		RiderID       uuid.UUID `form:"rider_id" binding:"required"`
		RecordingType string    `form:"recording_type" binding:"required,oneof=VIDEO AUDIO LOCATION_LOG SENSOR_DATA"`
		FileFormat    *string   `form:"file_format"`
		DurationSec   *int      `form:"duration_seconds"`
		Metadata      string    `form:"metadata"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	recording := &models.TripRecording{
		ID:              uuid.New(),
		TripID:          req.TripID,
		OrderID:         req.OrderID,
		DriverID:        req.DriverID,
		RiderID:         req.RiderID,
		RecordingType:   models.RecordingType(req.RecordingType),
		FileFormat:      req.FileFormat,
		DurationSeconds: req.DurationSec,
		Metadata:        string(req.Metadata),
		IsEncrypted:     true,
		Status:          models.RecordingStatusUploading,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	createdRecording, err := h.safetySvc.CreateTripRecording(c.Request.Context(), recording)
	if err != nil {
		h.logger.Error("Failed to create trip recording", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create trip recording"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": createdRecording})
}

func (h *SafetyHandler) GetTripRecording(c *gin.Context) {
	id := c.Param("id")
	recordingID := uuid.MustParse(id)

	recording, err := h.safetySvc.GetTripRecording(c.Request.Context(), recordingID)
	if err != nil {
		h.logger.Error("Failed to get trip recording", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Trip recording not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": recording})
}

func (h *SafetyHandler) UploadTripRecording(c *gin.Context) {
	id := c.Param("id")
	recordingID := uuid.MustParse(id)

	var req struct {
		StorageURL string `form:"storage_url" binding:"required"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.safetySvc.UploadTripRecording(c.Request.Context(), recordingID, req.StorageURL); err != nil {
		h.logger.Error("Failed to upload trip recording", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload recording"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Recording uploaded"})
}

func (h *SafetyHandler) GetTripRecordingsByTrip(c *gin.Context) {
	tripID := c.Param("tripId")
	tripUUID := uuid.MustParse(tripID)

	recordings, err := h.safetySvc.GetTripRecordingsByTrip(c.Request.Context(), tripUUID)
	if err != nil {
		h.logger.Error("Failed to get trip recordings by trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get trip recordings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": recordings})
}

func (h *SafetyHandler) CreateSafetyEvent(c *gin.Context) {
	var req struct {
		TripID       uuid.UUID `form:"trip_id" binding:"required"`
		OrderID      uuid.UUID `form:"order_id" binding:"required"`
		DriverID     uuid.UUID `form:"driver_id" binding:"required"`
		EventType    string    `form:"event_type" binding:"required,oneof=SPEEDING HARD_BRAKING HARD_ACCELERATION SHARP_TURN OFF_ROUTE LONG_STOP DEVICE_TAMPER SUSPICIOUS_BEHAVIOR ROUTE_VIOLATION OTHER"`
		Severity     string    `form:"severity" binding:"required,oneof=LOW MEDIUM HIGH CRITICAL"`
		LocationLat  *float64  `form:"location_lat"`
		LocationLng  *float64  `form:"location_lng"`
		Address      *string   `form:"address"`
		SpeedKmh     *float64  `form:"speed_kmh"`
		ThresholdVal *float64  `form:"threshold_value"`
		ActualVal    *float64  `form:"actual_value"`
		DeviceInfo   string    `form:"device_info"`
		Context      string    `form:"context"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	event := &models.SafetyEvent{
		ID:             uuid.New(),
		TripID:         &req.TripID,
		OrderID:        req.OrderID,
		DriverID:       req.DriverID,
		EventType:      models.EventType(req.EventType),
		Severity:       models.EventSeverity(req.Severity),
		Status:         models.EventStatusDetected,
		LocationLat:    req.LocationLat,
		LocationLng:    req.LocationLng,
		Address:        req.Address,
		SpeedKmh:       req.SpeedKmh,
		ThresholdValue: req.ThresholdVal,
		ActualValue:    req.ActualVal,
		DeviceInfo:     string(req.DeviceInfo),
		Context:        string(req.Context),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	createdEvent, err := h.safetySvc.CreateSafetyEvent(c.Request.Context(), event)
	if err != nil {
		h.logger.Error("Failed to create safety event", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create safety event"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": createdEvent})
}

func (h *SafetyHandler) GetSafetyEvent(c *gin.Context) {
	id := c.Param("id")
	eventID := uuid.MustParse(id)

	event, err := h.safetySvc.GetSafetyEvent(c.Request.Context(), eventID)
	if err != nil {
		h.logger.Error("Failed to get safety event", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Safety event not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": event})
}

func (h *SafetyHandler) GetSafetyEventsByDriver(c *gin.Context) {
	driverID := c.Param("driverId")
	driverUUID := uuid.MustParse(driverID)
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	events, err := h.safetySvc.GetSafetyEventsByDriver(c.Request.Context(), driverUUID, limit)
	if err != nil {
		h.logger.Error("Failed to get safety events by driver", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get safety events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": events})
}

func (h *SafetyHandler) GetHighSeverityEvents(c *gin.Context) {
	events, err := h.safetySvc.GetHighSeverityEvents(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get high severity events", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get high severity events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": events})
}

func (h *SafetyHandler) ReviewSafetyEvent(c *gin.Context) {
	id := c.Param("id")
	eventID := uuid.MustParse(id)

	var req struct {
		ReviewedBy  *uuid.UUID `form:"reviewed_by" binding:"required"`
		Status      string     `form:"status" binding:"required,oneof=DETECTED REVIEWING CONFIRMED DISMISSED"`
		Notes       *string    `form:"review_notes"`
		ActionTaken string     `form:"action_taken" binding:"required,oneof=NONE WARNING_SENT DRIVER_SUSPENDED ACCOUNT_FLAGGED INVESTIGATION_INITIATED"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	notes := ""
	if req.Notes != nil {
		notes = *req.Notes
	}
	if err := h.safetySvc.ReviewSafetyEvent(c.Request.Context(), eventID, *req.ReviewedBy, models.EventStatus(req.Status), notes, models.ActionTaken(req.ActionTaken)); err != nil {
		h.logger.Error("Failed to review safety event", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to review safety event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Event reviewed"})
}

func (h *SafetyHandler) GetEventsNeedingReview(c *gin.Context) {
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	events, err := h.safetySvc.GetEventsNeedingReview(c.Request.Context(), limit)
	if err != nil {
		h.logger.Error("Failed to get events needing review", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get events needing review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": events})
}

func (h *SafetyHandler) GetSafetyStats(c *gin.Context) {
	driverID := c.Param("driverId")
	driverUUID := uuid.MustParse(driverID)

	stats, err := h.safetySvc.GetSafetyStats(c.Request.Context(), driverUUID)
	if err != nil {
		h.logger.Error("Failed to get safety stats", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get safety stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}

func (h *SafetyHandler) GetDriverPerformanceScore(c *gin.Context) {
	driverID := c.Param("driverId")
	driverUUID := uuid.MustParse(driverID)

	score, err := h.safetySvc.GetDriverPerformanceScore(c.Request.Context(), driverUUID)
	if err != nil {
		h.logger.Error("Failed to get driver performance score", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get driver performance score"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"score": score}})
}

func (h *SafetyHandler) Cleanup(c *gin.Context) {
	if err := h.safetySvc.CleanupOldData(c.Request.Context()); err != nil {
		h.logger.Error("Failed to cleanup old data", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cleanup"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Cleanup completed"})
}
