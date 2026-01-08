package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/djamfikr7/tripo04os/matching-service/internal/models"
	"github.com/djamfikr7/tripo04os/matching-service/internal/repositories"
	"go.uber.org/zap"
)

const (
	WeightETA          = 0.35
	WeightRating       = 0.25
	WeightReliability  = 0.15
	WeightFairness     = 0.15
	WeightVehicleMatch = 0.10

	MaxSearchRadiusKm   = 5.0
	DefaultSpeedKmPerH  = 30.0
	TimeoutSeconds      = 30
)

type MatchingService struct {
	driverRepo        *repositories.DriverRepository
	driverMatchRepo   *repositories.DriverMatchRepository
	driverLocationRepo *repositories.DriverLocationRepository
	logger            *zap.Logger
}

func NewMatchingService(
	driverRepo *repositories.DriverRepository,
	driverMatchRepo *repositories.DriverMatchRepository,
	driverLocationRepo *repositories.DriverLocationRepository,
	logger *zap.Logger,
) *MatchingService {
	return &MatchingService{
		driverRepo:        driverRepo,
		driverMatchRepo:   driverMatchRepo,
		driverLocationRepo: driverLocationRepo,
		logger:            logger,
	}
}

func (s *MatchingService) FindBestMatch(ctx context.Context, req *models.MatchRequest) (*models.MatchResponse, error) {
	drivers, err := s.driverRepo.GetAvailableDrivers(
		ctx,
		req.Vertical,
		req.PickupLat,
		req.PickupLng,
		MaxSearchRadiusKm,
	)

	if err != nil {
		s.logger.Error("Failed to get available drivers",
			zap.String("order_id", req.OrderID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to find available drivers: %w", err)
	}

	if len(drivers) == 0 {
		s.logger.Warn("No available drivers found",
			zap.String("order_id", req.OrderID),
			zap.String("vertical", req.Vertical),
		)
		return nil, fmt.Errorf("no available drivers in area")
	}

	bestDriver, bestScore := s.calculateBestDriver(drivers, req)

	matchID := repositories.NewMatchID()
	match := &models.DriverMatch{
		ID:         matchID,
		DriverID:   bestDriver.DriverID,
		OrderID:    req.OrderID,
		Status:     "PENDING",
		MatchScore: bestScore,
		ETAMinutes: bestDriver.ETAMinutes,
		DistanceKM: bestDriver.DistanceKM,
		CreatedAt:  time.Now().UTC(),
		UpdatedAt:  time.Now().UTC(),
	}

	if err := s.driverMatchRepo.CreateMatch(ctx, match); err != nil {
		s.logger.Error("Failed to create match",
			zap.String("match_id", matchID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to create match: %w", err)
	}

	s.logger.Info("Driver matched successfully",
		zap.String("match_id", matchID),
		zap.String("order_id", req.OrderID),
		zap.String("driver_id", bestDriver.DriverID),
		zap.Float64("score", bestScore),
	)

	return &models.MatchResponse{
		MatchID:    matchID,
		DriverID:   bestDriver.DriverID,
		OrderID:    req.OrderID,
		Status:     match.Status,
		ETAMinutes: match.ETAMinutes,
		Score:      bestScore,
	}, nil
}

func (s *MatchingService) calculateBestDriver(drivers []*models.AvailableDriversResponse, req *models.MatchRequest) (*models.AvailableDriversResponse, float64) {
	var bestDriver *models.AvailableDriversResponse
	var bestScore float64

	for _, driver := range drivers {
		score := s.calculateMatchScore(driver, req)
		if bestDriver == nil || score > bestScore {
			bestDriver = driver
			bestScore = score
		}
	}

	return bestDriver, bestScore
}

func (s *MatchingService) calculateMatchScore(driver *models.AvailableDriversResponse, req *models.MatchRequest) float64 {
	etaScore := s.calculateETAScore(driver.ETAMinutes)
	ratingScore := s.calculateRatingScore(driver.Rating)
	reliabilityScore := 1.0
	fairnessScore := s.calculateFairnessScore(driver.DriverID)
	vehicleMatchScore := s.calculateVehicleMatchScore(driver.Vertical, req.Vertical)

	score :=
		WeightETA*etaScore +
			WeightRating*ratingScore +
			WeightReliability*reliabilityScore +
			WeightFairness*fairnessScore +
			WeightVehicleMatch*vehicleMatchScore

	return math.Round(score*100) / 100
}

func (s *MatchingService) calculateETAScore(etaMinutes int) float64 {
	if etaMinutes <= 2 {
		return 1.0
	}
	if etaMinutes <= 5 {
		return 0.9
	}
	if etaMinutes <= 10 {
		return 0.7
	}
	if etaMinutes <= 15 {
		return 0.5
	}
	return 0.3
}

func (s *MatchingService) calculateRatingScore(rating float64) float64 {
	if rating >= 4.8 {
		return 1.0
	}
	if rating >= 4.5 {
		return 0.9
	}
	if rating >= 4.0 {
		return 0.7
	}
	if rating >= 3.5 {
		return 0.5
	}
	return 0.3
}

func (s *MatchingService) calculateFairnessScore(driverID string) float64 {
	return 0.5
}

func (s *MatchingService) calculateVehicleMatchScore(driverVertical, requestVertical string) float64 {
	if driverVertical == requestVertical {
		return 1.0
	}
	return 0.5
}
