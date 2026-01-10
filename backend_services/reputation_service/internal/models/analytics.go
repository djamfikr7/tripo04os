package models

import (
	"time"

	"github.com/google/uuid"
)

type MetricType string

const (
	MetricTypeCounter   MetricType = "COUNTER"
	MetricTypeGauge     MetricType = "GAUGE"
	MetricTypeHistogram MetricType = "HISTOGRAM"
)

type Metric struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Name       string     `gorm:"type:varchar(255);not null;index" json:"name"`
	Type       MetricType `gorm:"type:varchar(20);not null" json:"type"`
	Value      float64    `gorm:"type:double precision;not null;default:0" json:"value"`
	Dimensions string     `gorm:"type:jsonb;default:'{}'" json:"dimensions"`
	Timestamp  time.Time  `gorm:"type:timestamp with time zone;not null;index" json:"timestamp"`
	Source     string     `gorm:"type:varchar(100);not null" json:"source"`
	CreatedAt  time.Time  `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (Metric) TableName() string {
	return "metrics"
}

type Dashboard struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null;unique" json:"name"`
	Slug        string    `gorm:"type:varchar(255);not null;unique;index" json:"slug"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	Config      string    `gorm:"type:jsonb;not null;default:'{}'" json:"config"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (Dashboard) TableName() string {
	return "dashboards"
}

type Report struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	Type      string    `gorm:"type:varchar(50);not null" json:"type"`
	Config    string    `gorm:"type:jsonb;not null;default:'{}'" json:"config"`
	CreatedBy string    `gorm:"type:varchar(255);not null" json:"created_by"`
	CreatedAt time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (Report) TableName() string {
	return "reports"
}

type MetricAggregation struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	MetricName      string    `gorm:"type:varchar(255);not null" json:"metric_name"`
	AggregationType string    `gorm:"type:varchar(20);not null" json:"aggregation_type"`
	TimeWindow      string    `gorm:"type:varchar(50);not null" json:"time_window"`
	Value           float64   `gorm:"type:double precision;not null" json:"value"`
	Dimensions      string    `gorm:"type:jsonb;default:'{}'" json:"dimensions"`
	AggregatedAt    time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"aggregated_at"`
	CreatedAt       time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (MetricAggregation) TableName() string {
	return "metric_aggregations"
}
