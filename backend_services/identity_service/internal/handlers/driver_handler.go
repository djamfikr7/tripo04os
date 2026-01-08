package handlers

import (
	"errors"
	"net/http"

	"github.com/djamfikr7/tripo04os/identity-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/identity-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type DriverHandler struct {
	driverService services.DriverService
	logger       *zap.Logger
}

func NewDriverHandler(driverService services.DriverService, logger *zap.Logger) *DriverHandler {
	return &DriverHandler{
		driverService: driverService,
		logger:       logger,
	}
}

func (h *DriverHandler) RegisterDriver(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "driver registered"})
}

func (h *DriverHandler) GetCurrentDriver(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	driver, err := h.driverService.GetCurrentDriver(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, repositories.ErrDriverNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
			return
		}
		h.logger.Error("failed to get current driver", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get driver"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"driver": driver})
}

func (h *DriverHandler) UpdateDriver(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var updates map[string]any
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	driver, err := h.driverService.UpdateDriver(c.Request.Context(), userID, updates)
	if err != nil {
		h.logger.Error("failed to update driver", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update driver"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"driver": driver})
}

func (h *DriverHandler) UpdateAvailability(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var req struct {
		IsOnline    bool `json:"is_online"`
		IsAvailable bool `json:"is_available"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.driverService.UpdateAvailability(c.Request.Context(), userID, req.IsOnline, req.IsAvailable); err != nil {
		h.logger.Error("failed to update availability", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update availability"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "availability updated"})
}

func (h *DriverHandler) UpdateLocation(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var req struct {
		Latitude  float64 `json:"latitude" binding:"required"`
		Longitude float64 `json:"longitude" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	location := fmt.Sprintf("POINT(%f %f)", req.Longitude, req.Latitude)
	if err := h.driverService.UpdateLocation(c.Request.Context(), userID, location); err != nil {
		h.logger.Error("failed to update location", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update location"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "location updated"})
}

func (h *DriverHandler) GetEarnings(c *gin.Context) {
	userIDStr := c.GetHeader("X-User-ID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	earnings, err := h.driverService.GetEarnings(c.Request.Context(), userID)
	if err != nil {
		h.logger.Error("failed to get earnings", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get earnings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"earnings": earnings})
}

func (h *DriverHandler) ListDrivers(c *gin.Context) {
	limit := 100
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := parseInt(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := parseInt(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	drivers, total, err := h.driverService.ListDrivers(c.Request.Context(), limit, offset)
	if err != nil {
		h.logger.Error("failed to list drivers", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list drivers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"drivers": drivers,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

func (h *DriverHandler) GetDriver(c *gin.Context) {
	id := c.Param("id")
	userID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver ID"})
		return
	}

	driver, err := h.driverService.GetDriver(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, repositories.ErrDriverNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
			return
		}
		h.logger.Error("failed to get driver", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get driver"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"driver": driver})
}

func (h *DriverHandler) UpdateDriverStatus(c *gin.Context) {
	id := c.Param("id")
	userID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.driverService.UpdateDriverStatus(c.Request.Context(), userID, req.Status); err != nil {
		h.logger.Error("failed to update driver status", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update driver status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "driver status updated"})
}

func parseInt(s string) (int, error) {
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	return i, err
}
