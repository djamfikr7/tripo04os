package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/djamfikr7/tripo04os/subscription-service/internal/models"
	"github.com/djamfikr7/tripo04os/subscription-service/internal/services"
)

type SubscriptionHandler struct {
	subscriptionSvc *services.SubscriptionService
	logger         *zap.Logger
}

func NewSubscriptionHandler(subscriptionSvc *services.SubscriptionService, logger *zap.Logger) *SubscriptionHandler {
	return &SubscriptionHandler{
		subscriptionSvc: subscriptionSvc,
		logger:         logger,
	}
}

func (h *SubscriptionHandler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1/subscriptions")
	{
		api.POST("/", h.CreateSubscription)
		api.GET("/:id", h.GetSubscription)
		api.GET("/stats", h.GetSubscriptionStats)
	}
}

func (h *SubscriptionHandler) CreateSubscription(c *gin.Context) {
	sub := &models.Subscription{
		ID:             uuid.New(),
		UserID:         uuid.New(),
		UserType:       models.SubscriptionTypeIndividual,
		SubscriptionType: models.SubscriptionTypeIndividual,
		Plan:            models.PlanStandard,
		Status:          models.SubscriptionStatusActive,
		StartDate:       time.Now(),
		AutoRenew:       true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	createdSub, err := h.subscriptionSvc.CreateSubscription(c.Request.Context(), sub)
	if err != nil {
		h.logger.Error("Failed to create subscription", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": createdSub})
}

func (h *SubscriptionHandler) GetSubscription(c *gin.Context) {
	id := c.Param("id")
	subID := uuid.MustParse(id)

	sub, err := h.subscriptionSvc.GetSubscription(c.Request.Context(), subID)
	if err != nil {
		h.logger.Error("Failed to get subscription", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": sub})
}

func (h *SubscriptionHandler) GetSubscriptionStats(c *gin.Context) {
	stats, err := h.subscriptionSvc.GetSubscriptionStats(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get subscription stats", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get subscription stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}
