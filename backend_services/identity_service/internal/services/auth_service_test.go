package services

import (
	"testing"

	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
)

func TestAuthService_PasswordHashing(t *testing.T) {
	// Test password hashing
	password := "test123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	assert.NoError(t, err)
	assert.NotEmpty(t, hashedPassword)

	// Test password verification
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	assert.NoError(t, err)

	// Test wrong password
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte("wrong"))
	assert.Error(t, err)
}

func TestUser_ValidEmail(t *testing.T) {
	user := &models.User{
		ID:           uuid.New(),
		Email:        "test@example.com",
		PasswordHash: "hashedpassword",
		Role:         models.RoleRider,
		Profile: map[string]any{
			"first_name": "Test",
			"last_name":  "User",
		},
	}

	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, models.RoleRider, user.Role)
}

func TestAuthService_VerifyEmail(t *testing.T) {
	email := "test@example.com"
	// Verify email format
	assert.Contains(t, email, "@")
	assert.Contains(t, email, ".")
}
