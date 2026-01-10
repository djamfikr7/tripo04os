package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/djamfikr7/tripo04os/subscription-service/internal/models"
)

type SubscriptionService struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewSubscriptionService(db *gorm.DB, logger *zap.Logger) *SubscriptionService {
	return &SubscriptionService{
		db:     db,
		logger: logger,
	}
}

func (s *SubscriptionService) CreateSubscription(ctx context.Context, sub *models.Subscription) (*models.Subscription, error) {
	if err := s.db.WithContext(ctx).Create(sub).Error; err != nil {
		return nil, err
	}
	return sub, nil
}

func (s *SubscriptionService) GetSubscription(ctx context.Context, id uuid.UUID) (*models.Subscription, error) {
	var sub models.Subscription
	err := s.db.WithContext(ctx).Where("id = ?", id).First(&sub).Error
	return &sub, err
}

func (s *SubscriptionService) GetUserSubscription(ctx context.Context, userID uuid.UUID) (*models.Subscription, error) {
	var sub models.Subscription
	err := s.db.WithContext(ctx).Where("user_id = ? AND status = ?", userID, models.SubscriptionStatusActive).First(&sub).Error
	return &sub, err
}

func (s *SubscriptionService) UpdateSubscriptionStatus(ctx context.Context, id uuid.UUID, status models.SubscriptionStatus) error {
	return s.db.WithContext(ctx).Model(&models.Subscription{}).Where("id = ?", id).Update("status", status).Error
}

func (s *SubscriptionService) GetSubscriptionStats(ctx context.Context) (map[string]interface{}, error) {
	var stats struct {
		TotalSubscriptions int64
		ActiveSubscriptions int64
	}
	
	s.db.WithContext(ctx).Model(&models.Subscription{}).Count(&stats.TotalSubscriptions)
	s.db.WithContext(ctx).Model(&models.Subscription{}).Where("status = ?", models.SubscriptionStatusActive).Count(&stats.ActiveSubscriptions)
	
	return map[string]interface{}{
		"total_subscriptions": stats.TotalSubscriptions,
		"active_subscriptions": stats.ActiveSubscriptions,
	}, nil
}
