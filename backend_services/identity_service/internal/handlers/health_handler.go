package handlers

import (
	"net/http"

	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewHealthHandler(db *gorm.DB, redis *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redis,
	}
}

func (h *HealthHandler) Check(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "identity-service",
		"version": "1.0.0",
	})
}

func (h *HealthHandler) Ready(c *gin.Context) {
	dbStatus := "ready"
	redisStatus := "ready"

	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		dbStatus = "not ready"
	}

	if err := h.redis.Ping(c.Request.Context()).Err(); err != nil {
		redisStatus = "not ready"
	}

	status := "ready"
	if dbStatus != "ready" || redisStatus != "ready" {
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
			"redis":    redisStatus,
		},
	})
}
