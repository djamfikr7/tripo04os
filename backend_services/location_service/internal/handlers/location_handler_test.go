package handlers

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func TestLocationHandler_HealthCheck(t *testing.T) {
	handler := NewHealthHandler(nil)

	// Test that handler is created
	assert.NotNil(t, handler)
}

func TestHealthHandler_Check(t *testing.T) {
	handler := NewHealthHandler(&gorm.DB{})

	// Test handler is created
	assert.NotNil(t, handler)
}
