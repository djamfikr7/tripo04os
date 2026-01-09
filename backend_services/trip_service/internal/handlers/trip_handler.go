package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/djamfikr7/tripo04os/trip-service/internal/models"
	"github.com/djamfikr7/tripo04os/trip-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/trip-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type TripHandler struct {
	tripService services.TripService
	logger     *zap.Logger
}

func NewTripHandler(tripService services.TripService, logger *zap.Logger) *TripHandler {
	return &TripHandler{
		tripService: tripService,
		logger:     logger,
	}
}

type CreateTripRequest struct {
	OrderID         uuid.UUID  `json:"order_id" binding:"required"`
	DriverID        uuid.UUID  `json:"driver_id" binding:"required"`
	BaseFare         float64   `json:"base_fare" binding:"required"`
	SurgeMultiplier float64   `json:"surge_multiplier" binding:"required"`
}

type UpdateTripRequest struct {
	BaseFare         *float64 `json:"base_fare"`
	SurgeMultiplier  *float64 `json:"surge_multiplier"`
	Route            *string  `json:"route"`
	Metadata         map[string]any `json:"metadata"`
}

type UpdateTripStatusRequest struct {
	Status models.TripStatus `json:"status" binding:"required"`
}

type CancelTripRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type UpdateLocationRequest struct {
	Latitude  float64 `json:"latitude" binding:"required,min:-90,max:90"`
	Longitude float64 `json:"longitude" binding:"required,min:-180,max:180"`
	Accuracy  float64 `json:"accuracy"`
	Heading   float64 `json:"heading"`
	Speed     float64 `json:"speed"`
}

type CompleteTripRequest struct {
	FinalFare        float64 `json:"final_fare" binding:"required,min:0"`
	DriverCommission  float64 `json:"driver_commission" binding:"required,min:0"`
	PlatformFee       float64 `json:"platform_fee" binding:"required,min:0"`
}

func (h *TripHandler) CreateTrip(c *gin.Context) {
	var req CreateTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	trip, err := h.tripService.CreateTrip(c.Request.Context(), req.OrderID, req.DriverID, req.BaseFare, req.SurgeMultiplier)
	if err != nil {
		h.logger.Error("failed to create trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create trip"})
		return
	}

	c.JSON(http.StatusCreated, trip)
}

func (h *TripHandler) GetTrip(c *gin.Context) {
	id := c.Param("id")
	tripID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip ID"})
		return
	}

	trip, err := h.tripService.GetTrip(c.Request.Context(), tripID)
	if err != nil {
		if err == repositories.ErrTripNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "trip not found"})
			return
		}
		h.logger.Error("failed to get trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get trip"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *TripHandler) UpdateTrip(c *gin.Context) {
	id := c.Param("id")
	tripID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip ID"})
		return
	}

	var req UpdateTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	trip, err := h.tripService.UpdateTrip(c.Request.Context(), tripID, req.BaseFare, req.SurgeMultiplier)
	if err != nil {
		h.logger.Error("failed to update trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update trip"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *TripHandler) UpdateTripStatus(c *gin.Context) {
	id := c.Param("id")
	tripID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip ID"})
		return
	}

	var req UpdateTripStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	trip, err := h.tripService.UpdateTripStatus(c.Request.Context(), tripID, req.Status)
	if err != nil {
		if err == services.ErrInvalidTripStatus {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip status transition"})
			return
		}
		h.logger.Error("failed to update trip status", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update trip status"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *TripHandler) StartTrip(c *gin.Context) {
	id := c.Param("id")
	tripID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip ID"})
		return
	}

	trip, err := h.tripService.StartTrip(c.Request.Context(), tripID)
	if err != nil {
		if err == services.ErrInvalidTripStatus {
			c.JSON(http.StatusBadRequest, gin.H{"error": "trip must be in DRIVER_EN_ROUTE status"})
			return
		}
		h.logger.Error("failed to start trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start trip"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *TripHandler) UpdateTripLocation(c *gin.Context) {
	id := c.Param("id")
	tripID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip ID"})
		return
	}

	var req UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.tripService.UpdateTripLocation(c.Request.Context(), tripID, req.Latitude, req.Longitude, req.Accuracy, req.Heading, req.Speed)
	if err != nil {
		h.logger.Error("failed to update trip location", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update trip location"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "location updated"})
}

func (h *TripHandler) CompleteTrip(c *gin.Context) {
	id := c.Param("id")
	tripID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip ID"})
		return
	}

	var req CompleteTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	trip, err := h.tripService.CompleteTrip(c.Request.Context(), tripID, req.FinalFare, req.DriverCommission, req.PlatformFee)
	if err != nil {
		if err == services.ErrInvalidTripStatus {
			c.JSON(http.StatusBadRequest, gin.H{"error": "trip must be in IN_PROGRESS status"})
			return
		}
		h.logger.Error("failed to complete trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to complete trip"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *TripHandler) CancelTrip(c *gin.Context) {
	id := c.Param("id")
	tripID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip ID"})
		return
	}

	var req CancelTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	trip, err := h.tripService.CancelTrip(c.Request.Context(), tripID, req.Reason)
	if err != nil {
		if err == services.ErrTripAlreadyCompleted {
			c.JSON(http.StatusBadRequest, gin.H{"error": "trip already completed"})
			return
		}
		h.logger.Error("failed to cancel trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel trip"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *TripHandler) GetActiveTrips(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	trips, err := h.tripService.GetActiveTrips(c.Request.Context(), limit)
	if err != nil {
		h.logger.Error("failed to get active trips", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get active trips"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"trips": trips,
		"count":  len(trips),
	})
}

func (h *TripHandler) GetTripByOrderID(c *gin.Context) {
	orderID := c.Param("order_id")
	orderUUID, err := uuid.Parse(orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order ID"})
		return
	}

	trip, err := h.tripService.GetTripByOrderID(c.Request.Context(), orderUUID)
	if err != nil {
		h.logger.Error("failed to get trip by order ID", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get trip"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *TripHandler) GetDriverActiveTrip(c *gin.Context) {
	driverID := c.Param("driver_id")
	driverUUID, err := uuid.Parse(driverID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver ID"})
		return
	}

	trip, err := h.tripService.GetDriverActiveTrip(c.Request.Context(), driverUUID)
	if err != nil {
		if err == repositories.ErrTripNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "active trip not found"})
			return
		}
		h.logger.Error("failed to get driver active trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get active trip"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *TripHandler) GetDriverTrips(c *gin.Context) {
	driverID := c.Param("driver_id")
	driverUUID, err := uuid.Parse(driverID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver ID"})
		return
	}

	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	trips, total, err := h.tripService.GetDriverTrips(c.Request.Context(), driverUUID, limit, offset)
	if err != nil {
		h.logger.Error("failed to get driver trips", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get driver trips"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"trips": trips,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

func (h *TripHandler) GetCompletedTrips(c *gin.Context) {
	limit := 50
	offset := 0
	var startDate, endDate time.Time

	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	if sd := c.Query("start_date"); sd != "" {
		if parsedDate, err := time.Parse(time.RFC3339, sd); err == nil {
			startDate = parsedDate
		}
	}

	if ed := c.Query("end_date"); ed != "" {
		if parsedDate, err := time.Parse(time.RFC3339, ed); err == nil {
			endDate = parsedDate
		}
	}

	trips, total, err := h.tripService.GetCompletedTrips(c.Request.Context(), startDate, endDate, limit, offset)
	if err != nil {
		h.logger.Error("failed to get completed trips", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get completed trips"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"trips": trips,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}
