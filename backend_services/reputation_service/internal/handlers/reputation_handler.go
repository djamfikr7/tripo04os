package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/djamfikr7/tripo04os/reputation-service/internal/models"
	"github.com/djamfikr7/tripo04os/reputation-service/internal/services"
)

type ReputationHandler struct {
	reputationSvc *services.ReputationService
	logger        *zap.Logger
}

func NewReputationHandler(reputationSvc *services.ReputationService, logger *zap.Logger) *ReputationHandler {
	return &ReputationHandler{
		reputationSvc: reputationSvc,
		logger:        logger,
	}
}

func (h *ReputationHandler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1/reputation")
	{
		api.POST("/reviews", h.CreateReview)
		api.GET("/reviews/:id", h.GetReview)
		api.GET("/reviews/user/:userId", h.GetReviewsByUser)
		api.GET("/reviews/trip/:tripId", h.GetReviewsByTrip)
		api.PUT("/reviews/:id/status", h.UpdateReviewStatus)

		api.GET("/scores/:userId", h.GetReputationScore)
		api.GET("/scores/top", h.GetTopRatedUsers)

		api.GET("/history/:userId", h.GetReputationHistory)

		api.GET("/stats", h.GetReputationStats)
	}
}

func (h *ReputationHandler) CreateReview(c *gin.Context) {
	var req struct {
		TripID       uuid.UUID `form:"trip_id" binding:"required"`
		OrderID      uuid.UUID `form:"order_id" binding:"required"`
		ReviewerID   uuid.UUID `form:"reviewer_id" binding:"required"`
		ReviewerType string    `form:"reviewer_type" binding:"required,oneof=RIDER DRIVER"`
		RatedID      uuid.UUID `form:"rated_id" binding:"required"`
		RatedType    string    `form:"rated_type" binding:"required,oneof=RIDER DRIVER"`
		Rating       int       `form:"rating" binding:"required,min=1,max=5"`
		Comment      *string   `form:"comment"`
		Source       string    `form:"source" binding:"required,oneof=TRIP DISPUTE"`
		IsAnonymous  bool      `form:"is_anonymous"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	review := &models.Review{
		ID:           uuid.New(),
		TripID:       req.TripID,
		OrderID:      req.OrderID,
		ReviewerID:   req.ReviewerID,
		ReviewerType: models.ReviewType(req.ReviewerType),
		RatedID:      req.RatedID,
		RatedType:    models.ReviewType(req.RatedType),
		Rating:       req.Rating,
		Comment:      req.Comment,
		Source:       models.RatingSource(req.Source),
		Status:       models.RatingStatusActive,
		IsAnonymous:  req.IsAnonymous,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	createdReview, err := h.reputationSvc.CreateReview(c.Request.Context(), review)
	if err != nil {
		h.logger.Error("Failed to create review", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": createdReview})
}

func (h *ReputationHandler) GetReview(c *gin.Context) {
	id := c.Param("id")
	reviewID := uuid.MustParse(id)

	review, err := h.reputationSvc.GetReview(c.Request.Context(), reviewID)
	if err != nil {
		h.logger.Error("Failed to get review", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": review})
}

func (h *ReputationHandler) GetReviewsByUser(c *gin.Context) {
	userID := c.Param("userId")
	userUUID := uuid.MustParse(userID)

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	reviews, err := h.reputationSvc.GetReviewsByUser(c.Request.Context(), userUUID, limit)
	if err != nil {
		h.logger.Error("Failed to get reviews by user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": reviews})
}

func (h *ReputationHandler) GetReviewsByTrip(c *gin.Context) {
	tripID := c.Param("tripId")
	tripUUID := uuid.MustParse(tripID)

	reviews, err := h.reputationSvc.GetReviewsByTrip(c.Request.Context(), tripUUID)
	if err != nil {
		h.logger.Error("Failed to get reviews by trip", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": reviews})
}

func (h *ReputationHandler) UpdateReviewStatus(c *gin.Context) {
	id := c.Param("id")
	reviewID := uuid.MustParse(id)

	var req struct {
		Status string `form:"status" binding:"required,oneof=PENDING ACTIVE ARCHIVED"`
	}

	if err := c.ShouldBind(&req); err != nil {
		h.logger.Error("Failed to bind request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.reputationSvc.UpdateReviewStatus(c.Request.Context(), reviewID, models.RatingStatus(req.Status)); err != nil {
		h.logger.Error("Failed to update review status", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Review status updated"})
}

func (h *ReputationHandler) GetReputationScore(c *gin.Context) {
	userID := c.Param("userId")
	userUUID := uuid.MustParse(userID)

	userType := c.DefaultQuery("user_type", "RIDER")

	score, err := h.reputationSvc.GetReputationScore(c.Request.Context(), userUUID, userType)
	if err != nil {
		h.logger.Error("Failed to get reputation score", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reputation score"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": score})
}

func (h *ReputationHandler) GetTopRatedUsers(c *gin.Context) {
	userType := c.DefaultQuery("user_type", "DRIVER")
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	scores, err := h.reputationSvc.GetTopRatedUsers(c.Request.Context(), userType, limit)
	if err != nil {
		h.logger.Error("Failed to get top rated users", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get top rated users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": scores})
}

func (h *ReputationHandler) GetReputationHistory(c *gin.Context) {
	userID := c.Param("userId")
	userUUID := uuid.MustParse(userID)

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	history, err := h.reputationSvc.GetReputationHistory(c.Request.Context(), userUUID, limit)
	if err != nil {
		h.logger.Error("Failed to get reputation history", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reputation history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": history})
}

func (h *ReputationHandler) GetReputationStats(c *gin.Context) {
	stats, err := h.reputationSvc.GetReputationStats(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get reputation stats", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reputation stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}
