package handlers

import (
	"net/http"

	"github.com/djamfikr7/tripo04os/safety-service/internal/models"
	"github.com/djamfikr7/tripo04os/safety-service/internal/services"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type SafetyHandler struct {
	safetyService *services.SafetyService
	logger        *zap.Logger
}

func NewSafetyHandler(safetyService *services.SafetyService, logger *zap.Logger) *SafetyHandler {
	return &SafetyHandler{
		safetyService: safetyService,
		logger:        logger,
	}
}

func (h *SafetyHandler) CreateSafetyReport(c *gin.Context) {
	var report models.SafetyReport
	if err := c.ShouldBindJSON(&report); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdReport, err := h.safetyService.CreateSafetyReport(c.Request.Context(), &report)
	if err != nil {
		h.logger.Error("Failed to create safety report",
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdReport)
}

func (h *SafetyHandler) GetSafetyReport(c *gin.Context) {
	id := c.Param("id")

	report, err := h.safetyService.GetSafetyReport(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

func (h *SafetyHandler) GetUserSafetyReports(c *gin.Context) {
	userID := c.Param("user_id")

	reports, err := h.safetyService.GetUserSafetyReports(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reports": reports,
		"count":    len(reports),
	})
}

func (h *SafetyHandler) CreateSafetyAlert(c *gin.Context) {
	var req struct {
		ReportID string `json:"report_id" binding:"required"`
		Severity string `json:"severity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	alert, err := h.safetyService.CreateSafetyAlert(c.Request.Context(), req.ReportID, req.Severity)
	if err != nil {
		h.logger.Error("Failed to create safety alert",
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, alert)
}

func (h *SafetyHandler) GetSafetyAlert(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "alert details"})
}

func (h *SafetyHandler) GetActiveAlerts(c *gin.Context) {
	alerts, err := h.safetyService.GetActiveAlerts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"count":   len(alerts),
	})
}

func (h *SafetyHandler) ReportEmergency(c *gin.Context) {
	var emergency models.EmergencyReport
	if err := c.ShouldBindJSON(&emergency); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reportedEmergency, err := h.safetyService.ReportEmergency(c.Request.Context(), &emergency)
	if err != nil {
		h.logger.Error("Failed to report emergency",
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, reportedEmergency)
}
