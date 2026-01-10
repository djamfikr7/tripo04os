package models

import (
	"time"

	"github.com/google/uuid"
	
)

type RecordingType string

const (
	RecordingTypeVideo       RecordingType = "VIDEO"
	RecordingTypeAudio       RecordingType = "AUDIO"
	RecordingTypeLocationLog RecordingType = "LOCATION_LOG"
	RecordingTypeSensorData  RecordingType = "SENSOR_DATA"
)

type RecordingStatus string

const (
	RecordingStatusUploading  RecordingStatus = "UPLOADING"
	RecordingStatusProcessing RecordingStatus = "PROCESSING"
	RecordingStatusReady      RecordingStatus = "READY"
	RecordingStatusFailed     RecordingStatus = "FAILED"
	RecordingStatusDeleted    RecordingStatus = "DELETED"
	RecordingStatusExpired    RecordingStatus = "EXPIRED"
)

type TripRecording struct {
	ID                uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	TripID            uuid.UUID       `gorm:"type:uuid;not null;index" json:"trip_id"`
	OrderID           uuid.UUID       `gorm:"type:uuid;not null;index" json:"order_id"`
	DriverID          uuid.UUID       `gorm:"type:uuid;not null;index" json:"driver_id"`
	RiderID           uuid.UUID       `gorm:"type:uuid;not null;index" json:"rider_id"`
	RecordingType     RecordingType   `gorm:"type:varchar(50);not null;index" json:"recording_type"`
	StorageURL        *string         `gorm:"type:text" json:"storage_url,omitempty"`
	StorageProvider   string          `gorm:"type:varchar(50);default:S3" json:"storage_provider"`
	FileSize          *int64          `gorm:"type:bigint" json:"file_size,omitempty"`
	FileFormat        *string         `gorm:"type:varchar(20)" json:"file_format,omitempty"`
	DurationSeconds   *int            `gorm:"type:integer" json:"duration_seconds,omitempty"`
	StartTime         *time.Time      `gorm:"type:timestamp with time zone" json:"start_time,omitempty"`
	EndTime           *time.Time      `gorm:"type:timestamp with time zone" json:"end_time,omitempty"`
	Metadata          string          `gorm:"type:jsonb;default:'{}'" json:"metadata,omitempty"`
	IsEncrypted       bool            `gorm:"not null;default:true" json:"is_encrypted"`
	EncryptionKeyID   *string         `gorm:"type:varchar(255)" json:"encryption_key_id,omitempty"`
	RetentionUntil    *time.Time      `gorm:"type:timestamp with time zone;index" json:"retention_until,omitempty"`
	Status            RecordingStatus `gorm:"type:varchar(50);not null;default:UPLOADING;index" json:"status"`
	UploadStartedAt   *time.Time      `gorm:"type:timestamp with time zone" json:"upload_started_at,omitempty"`
	UploadCompletedAt *time.Time      `gorm:"type:timestamp with time zone" json:"upload_completed_at,omitempty"`
	CreatedAt         time.Time       `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP;index" json:"created_at"`
	UpdatedAt         time.Time       `gorm:"type:timestamp with time zone;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (TripRecording) TableName() string {
	return "trip_recordings"
}
