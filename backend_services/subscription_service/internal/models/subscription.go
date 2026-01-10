package models

import (
	"time"

	"github.com/google/uuid"
)

type SubscriptionType string

const (
	SubscriptionTypeIndividual SubscriptionType = "INDIVIDUAL"
	SubscriptionTypeCorporate  SubscriptionType = "CORPORATE"
)

type SubscriptionPlan string

const (
	PlanBasic      SubscriptionPlan = "BASIC"
	PlanStandard   SubscriptionPlan = "STANDARD"
	PlanPremium    SubscriptionPlan = "PREMIUM"
	PlanEnterprise SubscriptionPlan = "ENTERPRISE"
)

type SubscriptionStatus string

const (
	SubscriptionStatusActive    SubscriptionStatus = "ACTIVE"
	SubscriptionStatusInactive  SubscriptionStatus = "INACTIVE"
	SubscriptionStatusSuspended SubscriptionStatus = "SUSPENDED"
	SubscriptionStatusCancelled SubscriptionStatus = "CANCELLED"
	SubscriptionStatusExpired   SubscriptionStatus = "EXPIRED"
)

type Subscription struct {
	ID                 uuid.UUID          `gorm:"type:uuid;primaryKey" json:"id"`
	UserID             uuid.UUID          `gorm:"type:uuid;not null;index" json:"user_id"`
	UserType           string             `gorm:"type:varchar(20);not null" json:"user_type"`
	SubscriptionType   SubscriptionType   `gorm:"type:varchar(20);not null;index" json:"subscription_type"`
	Plan               SubscriptionPlan   `gorm:"type:varchar(20);not null" json:"plan"`
	Status             SubscriptionStatus `gorm:"type:varchar(20);not null;default:ACTIVE;index" json:"status"`
	StartDate          time.Time          `gorm:"type:timestamp with time zone;not null" json:"start_date"`
	EndDate            *time.Time         `gorm:"type:timestamp with time zone" json:"end_date,omitempty"`
	AutoRenew          bool               `gorm:"default:true" json:"auto_renew"`
	PaymentMethod      string             `gorm:"type:varchar(50);not null" json:"payment_method"`
	DiscountPercentage *float64           `gorm:"type:double precision" json:"discount_percentage,omitempty"`
	CustomFeatures     string             `gorm:"type:jsonb;default:'{}'" json:"custom_features,omitempty"`
	CreatedAt          time.Time          `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt          time.Time          `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (Subscription) TableName() string {
	return "subscriptions"
}

type SubscriptionPayment struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SubscriptionID uuid.UUID `gorm:"type:uuid;not null;index" json:"subscription_id"`
	Amount         float64   `gorm:"type:double precision;not null" json:"amount"`
	Currency       string    `gorm:"type:varchar(10);not null;default:USD" json:"currency"`
	PaymentMethod  string    `gorm:"type:varchar(50);not null" json:"payment_method"`
	PaymentStatus  string    `gorm:"type:varchar(20);not null" json:"payment_status"`
	PaymentDate    time.Time `gorm:"type:timestamp with time zone;not null" json:"payment_date"`
	CreatedAt      time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (SubscriptionPayment) TableName() string {
	return "subscription_payments"
}

type SubscriptionFeature struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Plan        string    `gorm:"type:varchar(20);not null" json:"plan"`
	FeatureName string    `gorm:"type:varchar(100);not null" json:"feature_name"`
	Description string    `gorm:"type:text" json:"description"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (SubscriptionFeature) TableName() string {
	return "subscription_features"
}

type CorporateSubscription struct {
	ID                uuid.UUID        `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID         uuid.UUID        `gorm:"type:uuid;not null;uniqueIndex" json:"company_id"`
	SubscriptionPlan  SubscriptionPlan `gorm:"type:varchar(20);not null" json:"subscription_plan"`
	MaxUsers          int              `gorm:"type:integer;not null" json:"max_users"`
	CurrentUsers      int              `gorm:"type:integer;not null;default:0" json:"current_users"`
	BillingCycle      string           `gorm:"type:varchar(20);not null;default:MONTHLY" json:"billing_cycle"`
	BillingDay        int              `gorm:"type:integer;not null;default:1" json:"billing_day"`
	ContractStartDate time.Time        `gorm:"type:timestamp with time zone;not null" json:"contract_start_date"`
	ContractEndDate   *time.Time       `gorm:"type:timestamp with time zone" json:"contract_end_date,omitempty"`
	Status            string           `gorm:"type:varchar(20);not null;default:ACTIVE" json:"status"`
	BillingContact    string           `gorm:"type:varchar(255)" json:"billing_contact"`
	BillingEmail      string           `gorm:"type:varchar(255)" json:"billing_email"`
	CreatedAt         time.Time        `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt         time.Time        `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (CorporateSubscription) TableName() string {
	return "corporate_subscriptions"
}
