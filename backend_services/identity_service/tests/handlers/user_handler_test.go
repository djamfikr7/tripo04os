package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

// MockUserService for testing
type MockUserServiceForTest struct {
	getUserFunc    func(userID string) (*models.User, error)
	updateUserFunc func(userID string, user *models.User) error
}

func (m *MockUserServiceForTest) GetUserByID(userID string) (*models.User, error) {
	if m.getUserFunc != nil {
		return m.getUserFunc(userID)
	}
	return &models.User{ID: userID}, nil
}

func (m *MockUserServiceForTest) UpdateUser(userID string, user *models.User) error {
	if m.updateUserFunc != nil {
		return m.updateUserFunc(userID, user)
	}
	return nil
}

func TestUserHandler_GetCurrentUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserServiceForTest{
		getUserFunc: func(userID string) (*models.User, error) {
			return &models.User{
				ID:        userID,
				Email:     "test@example.com",
				FirstName: "Test",
				LastName:  "User",
			}, nil
		},
	}

	logger, _ := zap.NewDevelopment()
	handler := NewUserHandler(mockUserService, logger)

	router := gin.Default()
	router.GET("/api/v1/users/me", func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	}, handler.GetCurrentUser)

	req, _ := http.NewRequest("GET", "/api/v1/users/me", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "user-123", response["id"])
	assert.Equal(t, "test@example.com", response["email"])
}

func TestUserHandler_UpdateCurrentUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserServiceForTest{
		updateUserFunc: func(userID string, user *models.User) error {
			return nil
		},
	}

	logger, _ := zap.NewDevelopment()
	handler := NewUserHandler(mockUserService, logger)

	router := gin.Default()
	router.PUT("/api/v1/users/me", func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	}, handler.UpdateCurrentUser)

	updateData := map[string]string{
		"first_name": "Updated",
		"last_name":  "Name",
	}
	jsonData, _ := json.Marshal(updateData)

	req, _ := http.NewRequest("PUT", "/api/v1/users/me", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestUserHandler_ChangePassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserServiceForTest{}
	logger, _ := zap.NewDevelopment()
	handler := NewUserHandler(mockUserService, logger)

	router := gin.Default()
	router.PUT("/api/v1/users/me/password", func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	}, handler.ChangePassword)

	passwordData := map[string]string{
		"current_password": "oldpassword",
		"new_password":     "newpassword123",
	}
	jsonData, _ := json.Marshal(passwordData)

	req, _ := http.NewRequest("PUT", "/api/v1/users/me/password", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
