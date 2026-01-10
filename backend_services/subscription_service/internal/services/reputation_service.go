package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/djamfikr7/tripo04os/reputation-service/internal/models"
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

func (s *SubscriptionService) CreateReview(ctx context.Context, review *models.Review) (*models.Review, error) {
	s.logger.Info("Creating review",
		zap.String("reviewer_id", review.ReviewerID.String()),
		zap.String("rated_id", review.RatedID.String()),
		zap.Int("rating", review.Rating),
	)

	if err := s.db.WithContext(ctx).Create(review).Error; err != nil {
		s.logger.Error("Failed to create review", zap.Error(err))
		return nil, fmt.Errorf("failed to create review: %w", err)
	}

	if err := s.recalculateReputation(ctx, review.RatedID, string(review.RatedType)); err != nil {
		s.logger.Error("Failed to recalculate reputation", zap.Error(err))
	}

	return review, nil
}

func (s *SubscriptionService) GetReview(ctx context.Context, id uuid.UUID) (*models.Review, error) {
	var review models.Review
	err := s.db.WithContext(ctx).Where("id = ?", id).First(&review).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("review not found")
		}
		return nil, err
	}
	return &review, nil
}

func (s *SubscriptionService) GetReviewsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.Review, error) {
	var reviews []models.Review
	query := s.db.WithContext(ctx).Where("rated_id = ?", userID)

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}

func (s *SubscriptionService) GetReviewsByTrip(ctx context.Context, tripID uuid.UUID) ([]models.Review, error) {
	var reviews []models.Review
	err := s.db.WithContext(ctx).Where("trip_id = ?", tripID).Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}

func (s *SubscriptionService) GetReputationScore(ctx context.Context, userID uuid.UUID, userType string) (*models.ReputationScore, error) {
	var score models.ReputationScore
	err := s.db.WithContext(ctx).Where("user_id = ? AND user_type = ?", userID, userType).First(&score).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return s.createInitialReputation(ctx, userID, userType)
		}
		return nil, err
	}
	return &score, nil
}

func (s *SubscriptionService) UpdateReviewStatus(ctx context.Context, id uuid.UUID, status models.RatingStatus) error {
	result := s.db.WithContext(ctx).Model(&models.Review{}).Where("id = ?", id).Update("status", status)
	return result.Error
}

func (s *SubscriptionService) createInitialReputation(ctx context.Context, userID uuid.UUID, userType string) (*models.ReputationScore, error) {
	initialScore := &models.ReputationScore{
		ID:                 uuid.New(),
		UserID:             userID,
		UserType:           userType,
		OverallScore:       5.00,
		RatingCount:        0,
		AverageRating:      5.00,
		ReliabilityScore:   5.00,
		PunctualityScore:   5.00,
		CommunicationScore: 5.00,
		VehicleScore:       5.00,
		BehaviorScore:      5.00,
		TotalTrips:         0,
		CompletedTrips:     0,
		CancelledTrips:     0,
		PositiveReviews:    0,
		NegativeReviews:    0,
		TrustScore:         85.00,
		LastCalculatedAt:   time.Now(),
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.db.WithContext(ctx).Create(initialScore).Error; err != nil {
		return nil, fmt.Errorf("failed to create initial reputation: %w", err)
	}

	return initialScore, nil
}

func (s *SubscriptionService) recalculateReputation(ctx context.Context, userID uuid.UUID, userType string) error {
	reviews, err := s.getRecentReviews(ctx, userID, userType)
	if err != nil {
		return err
	}

	var existingScore models.ReputationScore
	err = s.db.WithContext(ctx).Where("user_id = ? AND user_type = ?", userID, userType).First(&existingScore).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			_, createErr := s.createInitialReputation(ctx, userID, userType)
			return createErr
		}
		return err
	}

	oldScore := existingScore.TrustScore

	s.calculateScores(&existingScore, reviews)

	existingScore.LastCalculatedAt = time.Now()
	existingScore.UpdatedAt = time.Now()

	if err := s.db.WithContext(ctx).Save(&existingScore).Error; err != nil {
		return err
	}

	s.recordHistory(ctx, userID, userType, oldScore, existingScore.TrustScore, "Review received", &existingScore.ID)

	return nil
}

func (s *SubscriptionService) getRecentReviews(ctx context.Context, userID uuid.UUID, userType string) ([]models.Review, error) {
	var reviews []models.Review
	sixMonthsAgo := time.Now().AddDate(0, -6, 0)

	err := s.db.WithContext(ctx).
		Where("rated_id = ? AND rated_type = ? AND status = ? AND created_at >= ?", userID, userType, models.RatingStatusActive, sixMonthsAgo).
		Order("created_at DESC").
		Find(&reviews).Error

	return reviews, err
}

func (s *SubscriptionService) calculateScores(score *models.ReputationScore, reviews []models.Review) {
	if len(reviews) == 0 {
		return
	}

	var totalRating, positiveCount, negativeCount int

	for _, review := range reviews {
		totalRating += review.Rating

		if review.Rating >= 4 {
			positiveCount++
		} else if review.Rating <= 2 {
			negativeCount++
		}

		s.updateComponentScores(score, review)
	}

	score.RatingCount = len(reviews)
	score.PositiveReviews = positiveCount
	score.NegativeReviews = negativeCount
	score.AverageRating = float64(totalRating) / float64(len(reviews))
	score.OverallScore = score.AverageRating

	score.TrustScore = s.calculateTrustScore(score)
}

func (s *SubscriptionService) updateComponentScores(score *models.ReputationScore, review models.Review) {
	const weight = 0.05
	const decay = 0.95

	if score.RatingCount > 0 {
		currentValue := score.ReliabilityScore
		newValue := currentValue*decay + float64(review.Rating)*weight
		score.ReliabilityScore = newValue

		currentValue = score.PunctualityScore
		newValue = currentValue*decay + float64(review.Rating)*weight
		score.PunctualityScore = newValue

		currentValue = score.CommunicationScore
		newValue = currentValue*decay + float64(review.Rating)*weight
		score.CommunicationScore = newValue

		if review.RatedType == models.ReviewTypeDriver {
			currentValue = score.VehicleScore
			newValue = currentValue*decay + float64(review.Rating)*weight
			score.VehicleScore = newValue

			currentValue = score.BehaviorScore
			newValue = currentValue*decay + float64(review.Rating)*weight
			score.BehaviorScore = newValue
		}
	}
}

func (s *SubscriptionService) calculateTrustScore(score *models.ReputationScore) float64 {
	weightReliability := 0.25
	weightPunctuality := 0.20
	weightCommunication := 0.20
	weightVehicle := 0.15
	weightBehavior := 0.10
	weightOverall := 0.10

	componentScore :=
		score.ReliabilityScore*weightReliability +
			score.PunctualityScore*weightPunctuality +
			score.CommunicationScore*weightCommunication +
			score.VehicleScore*weightVehicle +
			score.BehaviorScore*weightBehavior

	trustScore := componentScore*2.0 + score.OverallScore*weightOverall

	trustScore = math.Max(0, math.Min(5, trustScore))

	normalizedScore := trustScore / 5.0 * 100.0

	return normalizedScore
}

func (s *SubscriptionService) recordHistory(ctx context.Context, userID uuid.UUID, userType string, oldScore, newScore float64, reason string, relatedReviewID *uuid.UUID) error {
	history := &models.ReputationHistory{
		ID:              uuid.New(),
		UserID:          userID,
		UserType:        userType,
		OldScore:        oldScore,
		NewScore:        newScore,
		ScoreChange:     newScore - oldScore,
		Reason:          reason,
		RelatedReviewID: relatedReviewID,
		CreatedAt:       time.Now(),
	}

	return s.db.WithContext(ctx).Create(history).Error
}

func (s *SubscriptionService) GetReputationHistory(ctx context.Context, userID uuid.UUID, limit int) ([]models.ReputationHistory, error) {
	var history []models.ReputationHistory
	query := s.db.WithContext(ctx).Where("user_id = ?", userID)

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Order("created_at DESC").Find(&history).Error
	return history, err
}

func (s *SubscriptionService) UpdateTripStats(ctx context.Context, userID uuid.UUID, userType string, completed, cancelled bool) error {
	var score models.ReputationScore
	err := s.db.WithContext(ctx).Where("user_id = ? AND user_type = ?", userID, userType).First(&score).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil
		}
		return err
	}

	oldScore := score.TrustScore

	score.TotalTrips++

	if completed {
		score.CompletedTrips++
	} else if cancelled {
		score.CancelledTrips++
	}

	completionRate := 0.0
	if score.TotalTrips > 0 {
		completionRate = float64(score.CompletedTrips) / float64(score.TotalTrips)
	}

	score.ReliabilityScore = score.ReliabilityScore*0.95 + completionRate*5.0*0.05
	score.TrustScore = s.calculateTrustScore(&score)
	score.LastCalculatedAt = time.Now()
	score.UpdatedAt = time.Now()

	if err := s.db.WithContext(ctx).Save(&score).Error; err != nil {
		return err
	}

	reason := "Trip stats updated"
	if completed {
		reason = "Trip completed"
	} else if cancelled {
		reason = "Trip cancelled"
	}

	s.recordHistory(ctx, userID, userType, oldScore, score.TrustScore, reason, nil)

	return nil
}

func (s *SubscriptionService) GetTopRatedUsers(ctx context.Context, userType string, limit int) ([]models.ReputationScore, error) {
	var scores []models.ReputationScore
	query := s.db.WithContext(ctx).Where("user_type = ?", userType).Order("trust_score DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&scores).Error
	return scores, err
}

func (s *SubscriptionService) GetReputationStats(ctx context.Context) (map[string]interface{}, error) {
	var stats struct {
		TotalReviews    int64
		TotalUsers      int64
		TotalDrivers    int64
		AverageRating   float64
		PositiveReviews int64
		NegativeReviews int64
	}

	s.db.WithContext(ctx).Model(&models.Review{}).Count(&stats.TotalReviews)

	s.db.WithContext(ctx).Model(&models.ReputationScore{}).Count(&stats.TotalUsers)

	s.db.WithContext(ctx).Model(&models.ReputationScore{}).Where("user_type = ?", models.ReviewTypeDriver).Count(&stats.TotalDrivers)

	s.db.WithContext(ctx).Model(&models.Review{}).
		Select("AVG(rating)").
		Scan(&stats.AverageRating)

	s.db.WithContext(ctx).Model(&models.Review{}).Where("rating >= 4").Count(&stats.PositiveReviews)

	s.db.WithContext(ctx).Model(&models.Review{}).Where("rating <= 2").Count(&stats.NegativeReviews)

	return map[string]interface{}{
		"total_reviews":    stats.TotalReviews,
		"total_users":      stats.TotalUsers,
		"total_drivers":    stats.TotalDrivers,
		"average_rating":   stats.AverageRating,
		"positive_reviews": stats.PositiveReviews,
		"negative_reviews": stats.NegativeReviews,
	}, nil
}
