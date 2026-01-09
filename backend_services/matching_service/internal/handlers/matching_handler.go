package handlers

import (
	"net/http"

	"github.com/djamfikr7/tripo04os/matching-service/internal/models"
	"github.com/djamfikr7/tripo04os/matching-service/internal/services"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type MatchingHandler struct {
	matchingService *services.MatchingService
	logger          *zap.Logger
}

func NewMatchingHandler(matchingService *services.MatchingService, logger *zap.Logger) *MatchingHandler {
	return &MatchingHandler{
		matchingService: matchingService,
		logger:          logger,
	}
}

func (h *MatchingHandler) RequestMatch(c *gin.Context) {
	var req models.MatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	match, err := h.matchingService.FindBestMatch(c.Request.Context(), &req)
	if err != nil {
		h.logger.Error("Failed to find match",
			zap.String("order_id", req.OrderID),
			zap.Error(err),
		)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, match)
}

func (h *MatchingHandler) GetMatchStatus(c *gin.Context) {
	matchID := c.Param("match_id")

	c.JSON(http.StatusOK, gin.H{
		"match_id": matchID,
		"status":   "PENDING",
	})
}

func (h *MatchingHandler) AcceptMatch(c *gin.Context) {
	var req struct {
		MatchID string `json:"match_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"match_id": req.MatchID,
		"status":   "ACCEPTED",
	})
}

func (h *MatchingHandler) RejectMatch(c *gin.Context) {
	var req struct {
		MatchID string `json:"match_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"match_id": req.MatchID,
		"status":   "REJECTED",
	})
}

func (h *MatchingHandler) GetAvailableDrivers(c *gin.Context) {
	vertical := c.Query("vertical")
	lat := c.Query("lat")
	lng := c.Query("lng")

	if vertical == "" || lat == "" || lng == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"drivers": []models.AvailableDriversResponse{},
	})
}
