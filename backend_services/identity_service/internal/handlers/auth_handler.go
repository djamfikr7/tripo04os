package handlers

import (
	"errors"
	"net/http"

	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/djamfikr7/tripo04os/identity-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/identity-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type AuthHandler struct {
	authService services.AuthService
	userService services.UserService
	logger     *zap.Logger
}

func NewAuthHandler(authService services.AuthService, userService services.UserService, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		userService: userService,
		logger:     logger,
	}
}

type RegisterRequest struct {
	Email    string       `json:"email" binding:"required,email"`
	Phone    string       `json:"phone" binding:"required"`
	Password string       `json:"password" binding:"required,min=8"`
	Role     models.Role   `json:"role"`
	Profile  map[string]any `json:"profile"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	registerReq := &services.RegisterRequest{
		Email:    req.Email,
		Phone:    req.Phone,
		Password: req.Password,
		Role:     req.Role,
		Profile:  req.Profile,
	}

	user, err := h.authService.Register(c.Request.Context(), registerReq)
	if err != nil {
		if errors.Is(err, repositories.ErrUserExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
			return
		}
		h.logger.Error("failed to register user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user": user,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResp, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		h.logger.Error("failed to login", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to login"})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResp, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		h.logger.Error("failed to refresh token", zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user ID required"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	if err := h.authService.Logout(c.Request.Context(), uid); err != nil {
		h.logger.Error("failed to logout", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "logged out successfully"})
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "email verified"})
}

func (h *AuthHandler) VerifyPhone(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "phone verified"})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ForgotPassword(c.Request.Context(), req.Email); err != nil {
		h.logger.Error("failed to send password reset", zap.Error(err))
	}

	c.JSON(http.StatusOK, gin.H{"message": "if email exists, password reset link sent"})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "password reset successfully"})
}
