package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/djamfikr7/tripo04os/location-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/location-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type GeofenceHandler struct {
	service services.GeofenceService
	logger  *zap.Logger
}

func NewGeofenceHandler(service services.GeofenceService, logger *zap.Logger) *GeofenceHandler {
	return &GeofenceHandler{
		service: service,
		logger:  logger,
	}
}

type CreateGeofenceRequest struct {
	Name            string                  `json:"name" binding:"required"`
	Type            models.GeofenceType     `json:"type" binding:"required"`
	Area            []models.LocationPoint   `json:"area" binding:"required,min=3"`
	CenterPoint     models.LocationPoint      `json:"center_point"`
	RadiusMeters   int                     `json:"radius_meters"`
	SurgeMultiplier float64                 `json:"surge_multiplier"`
	IsActive       bool                    `json:"is_active"`
	Priority       int                     `json:"priority"`
	Description     string                  `json:"description"`
}

func (h *GeofenceHandler) CreateGeofence(c *gin.Context) {
	var req CreateGeofenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	polygon := "POLYGON(("
	for i, point := range req.Area {
		if i > 0 {
			polygon += ", "
		}
		polygon += fmt.Sprintf("%f %f", point.Longitude, point.Latitude)
	}
	polygon += "))"
	
	centerPoint := fmt.Sprintf("POINT(%f %f)", req.CenterPoint.Longitude, req.CenterPoint.Latitude)

	geofence := &models.Geofence{
		Name:            req.Name,
		Type:            req.Type,
		Area:            polygon,
		CenterPoint:     centerPoint,
		RadiusMeters:   req.RadiusMeters,
		SurgeMultiplier: req.SurgeMultiplier,
		IsActive:       req.IsActive,
		Priority:       req.Priority,
		Description:     req.Description,
	}

	createdGeofence, err := h.service.CreateGeofence(c.Request.Context(), geofence)
	if err != nil {
		h.logger.Error("failed to create geofence", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create geofence"})
		return
	}

	c.JSON(http.StatusCreated, createdGeofence)
}

func (h *GeofenceHandler) ListGeofences(c *gin.Context) {
	limit := 100
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

	geofences, total, err := h.service.ListGeofences(c.Request.Context(), limit, offset)
	if err != nil {
		h.logger.Error("failed to list geofences", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list geofences"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"geofences": geofences,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}

func (h *GeofenceHandler) GetGeofence(c *gin.Context) {
	id := c.Param("id")
	geofenceID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid geofence ID"})
		return
	}

	geofence, err := h.service.GetGeofence(c.Request.Context(), geofenceID)
	if err != nil {
		if errors.Is(err, repositories.ErrGeofenceNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "geofence not found"})
			return
		}
		h.logger.Error("failed to get geofence", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get geofence"})
		return
	}

	c.JSON(http.StatusOK, geofence)
}

func (h *GeofenceHandler) UpdateGeofence(c *gin.Context) {
	id := c.Param("id")
	geofenceID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid geofence ID"})
		return
	}

	var updates map[string]any
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	geofence, err := h.service.UpdateGeofence(c.Request.Context(), geofenceID, updates)
	if err != nil {
		h.logger.Error("failed to update geofence", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update geofence"})
		return
	}

	c.JSON(http.StatusOK, geofence)
}

func (h *GeofenceHandler) DeleteGeofence(c *gin.Context) {
	id := c.Param("id")
	geofenceID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid geofence ID"})
		return
	}

	if err := h.service.DeleteGeofence(c.Request.Context(), geofenceID); err != nil {
		h.logger.Error("failed to delete geofence", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete geofence"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "geofence deleted successfully"})
}

func (h *GeofenceHandler) CheckGeofence(c *gin.Context) {
	var req struct {
		Latitude  float64 `json:"latitude" binding:"required,min:-90,max:90"`
		Longitude float64 `json:"longitude" binding:"required,min:-180,max:180"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	geofences, err := h.service.CheckGeofence(c.Request.Context(), req.Latitude, req.Longitude)
	if err != nil {
		h.logger.Error("failed to check geofence", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check geofence"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"geofences": geofences,
		"count":      len(geofences),
	})
}
