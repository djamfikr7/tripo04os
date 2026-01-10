package services

import (
	"context"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/djamfikr7/tripo04os/fraud-service/internal/models"
)

type FraudService struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewFraudService(db *gorm.DB, logger *zap.Logger) *FraudService {
	return &FraudService{
		db:     db,
		logger: logger,
	}
}

func (s *FraudService) CreateFraudReport(ctx context.Context, report *models.FraudReport) (*models.FraudReport, error) {
	if err := s.db.WithContext(ctx).Create(report).Error; err != nil {
		return nil, err
	}
	return report, nil
}

func (s *FraudService) GetFraudReport(ctx context.Context, id uuid.UUID) (*models.FraudReport, error) {
	var report models.FraudReport
	err := s.db.WithContext(ctx).Where("id = ?", id).First(&report).Error
	return &report, err
}

func (s *FraudService) GetFraudReportsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.FraudReport, error) {
	var reports []models.FraudReport
	query := s.db.WithContext(ctx).Where("user_id = ?", userID)
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Order("detected_at DESC").Find(&reports).Error
	return reports, err
}

func (s *FraudService) GetFraudStats(ctx context.Context) (map[string]interface{}, error) {
	var totalReports int64
	s.db.WithContext(ctx).Model(&models.FraudReport{}).Count(&totalReports)

	return map[string]interface{}{
		"total_reports": totalReports,
	}, nil
}

func (s *FraudService) GetActiveFraudRules(ctx context.Context) ([]models.FraudRule, error) {
	var rules []models.FraudRule
	err := s.db.WithContext(ctx).Where("is_active = ?", true).Find(&rules).Error
	return rules, err
}
