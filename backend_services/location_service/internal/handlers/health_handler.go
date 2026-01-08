package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db *gorm.DB
}

func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{
		db: db,
	}
}

func (h *HealthHandler) Check(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "location-service",
		"version": "1.0.0",
	})
}

func (h *HealthHandler) Ready(c *gin.Context) {
	dbStatus := "ready"

	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		dbStatus = "not ready"
	}

	status := "ready"
	if dbStatus != "ready" {
		status = "not ready"
	}

	httpStatus := http.StatusOK
	if status != "ready" {
		httpStatus = http.StatusServiceUnavailable
	}

	c.JSON(httpStatus, gin.H{
		"status": status,
		"checks": gin.H{
			"database": dbStatus,
		},
	})
}
