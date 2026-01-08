package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/djamfikr7/tripo04os/location-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/location-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type DriverLocationHandler struct {
	service services.DriverLocationService
	logger  *zap.Logger
}

func NewDriverLocationHandler(service services.DriverLocationService, logger *zap.Logger) *DriverLocationHandler {
	return &DriverLocationHandler{
		service: service,
		logger:  logger,
	}
}

type UpdateLocationRequest struct {
	Latitude  float64 `json:"latitude" binding:"required,min:-90,max:90"`
	Longitude float64 `json:"longitude" binding:"required,min:-180,max:180"`
	Accuracy  float64 `json:"accuracy"`
	Heading   float64 `json:"heading"`
	Speed     float64 `json:"speed"`
}

func (h *DriverLocationHandler) UpdateLocation(c *gin.Context) {
	var req UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	driverIDStr := c.GetHeader("X-Driver-ID")
	driverID, err := uuid.Parse(driverIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver ID"})
		return
	}

	location, err := h.service.UpdateLocation(
		c.Request.Context(),
		driverID,
		req.Latitude,
		req.Longitude,
		req.Accuracy,
		req.Heading,
		req.Speed,
	)
	if err != nil {
		h.logger.Error("failed to update location", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update location"})
		return
	}

	c.JSON(http.StatusOK, location)
}

func (h *DriverLocationHandler) GetDriverLocation(c *gin.Context) {
	driverIDStr := c.Param("driver_id")
	driverID, err := uuid.Parse(driverIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver ID"})
		return
	}

	location, err := h.service.GetDriverLocation(c.Request.Context(), driverID)
	if err != nil {
		if errors.Is(err, repositories.ErrDriverLocationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "driver location not found"})
			return
		}
		h.logger.Error("failed to get driver location", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get driver location"})
		return
	}

	c.JSON(http.StatusOK, location)
}

func (h *DriverLocationHandler) GetNearbyDrivers(c *gin.Context) {
	latStr := c.Query("latitude")
	lngStr := c.Query("longitude")
	radiusStr := c.Query("radius_meters")

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid latitude"})
		return
	}

	lng, err = strconv.ParseFloat(lngStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid longitude"})
		return
	}

	radiusMeters := 5000
	if radiusStr != "" {
		radiusMeters, err = strconv.Atoi(radiusStr)
		if err != nil || radiusMeters < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid radius"})
			return
		}
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	drivers, err := h.service.GetNearbyDrivers(c.Request.Context(), lat, lng, radiusMeters, limit)
	if err != nil {
		h.logger.Error("failed to get nearby drivers", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get nearby drivers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"drivers": drivers,
		"count":   len(drivers),
	})
}

func (h *DriverLocationHandler) GetDriversInArea(c *gin.Context) {
	var polygon []models.LocationPoint
	if err := c.ShouldBindJSON(&polygon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(polygon) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "polygon must have at least 3 points"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	drivers, err := h.service.GetDriversInArea(c.Request.Context(), polygon, limit)
	if err != nil {
		h.logger.Error("failed to get drivers in area", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get drivers in area"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"drivers": drivers,
		"count":   len(drivers),
	})
}
