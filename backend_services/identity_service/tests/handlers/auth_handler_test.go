package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/djamfikr7/tripo04os/identity-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

// Mock implementations for testing
type MockAuthService struct {
	mock.Mock
}

type MockUserService struct {
	mock.Mock
}

func (m *MockAuthService) Register(email, password, firstName, lastName string) (*models.User, error) {
	args := m.Called(email, password, firstName, lastName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockAuthService) Login(email, password string) (*services.AuthResponse, error) {
	args := m.Called(email, password)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*services.AuthResponse), args.Error(1)
}

func (m *MockAuthService) RefreshToken(refreshToken string) (*services.AuthResponse, error) {
	args := m.Called(refreshToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*services.AuthResponse), args.Error(1)
}

func TestAuthHandler_Register(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuthService := new(MockAuthService)
	mockUserService := new(MockUserService)
	logger, _ := zap.NewDevelopment()

	handler := NewAuthHandler(mockAuthService, mockUserService, logger)

	// Test successful registration
	mockAuthService.On("Register", "test@example.com", "password123", "Test", "User").
		Return(&models.User{ID: "123", Email: "test@example.com"}, nil)

	router := gin.Default()
	router.POST("/api/v1/auth/register", handler.Register)

	req, _ := http.NewRequest("POST", "/api/v1/auth/register", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockAuthService.AssertExpectations(t)
}

func TestHealthHandler_Check(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewHealthHandler(nil, nil)

	router := gin.Default()
	router.GET("/health", handler.Check)

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "ok", response["status"])
}

func TestHealthHandler_Ready(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewHealthHandler(nil, nil)

	router := gin.Default()
	router.GET("/ready", handler.Ready)

	req, _ := http.NewRequest("GET", "/ready", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "ready", response["status"])
}
