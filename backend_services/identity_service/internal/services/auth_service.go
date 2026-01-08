package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/djamfikr7/tripo04os/identity-service/internal/config"
	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/djamfikr7/tripo04os/identity-service/internal/repositories"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrTokenInvalid      = errors.New("invalid token")
	ErrTokenExpired     = errors.New("token expired")
)

type AuthService interface {
	Register(ctx context.Context, req *RegisterRequest) (*models.User, error)
	Login(ctx context.Context, email, password string) (*AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error)
	Logout(ctx context.Context, userID uuid.UUID) error
	VerifyEmail(ctx context.Context, token string) error
	VerifyPhone(ctx context.Context, phone, code string) error
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, token, newPassword string) error
	GenerateTokens(ctx context.Context, userID uuid.UUID) (*AuthResponse, error)
	ValidateToken(token string) (*jwt.MapClaims, error)
}

type authService struct {
	userRepo repositories.UserRepository
	redis    *redis.Client
	jwtConfig config.JWTConfig
}

func NewAuthService(jwtConfig config.JWTConfig, userRepo repositories.UserRepository, redis *redis.Client) AuthService {
	return &authService{
		userRepo: userRepo,
		redis:    redis,
		jwtConfig: jwtConfig,
	}
}

type RegisterRequest struct {
	Email    string       `json:"email" binding:"required,email"`
	Phone    string       `json:"phone" binding:"required"`
	Password string       `json:"password" binding:"required,min=8"`
	Role     models.Role   `json:"role"`
	Profile  map[string]any `json:"profile"`
}

type AuthResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	User         *models.User `json:"user"`
}

func (s *authService) Register(ctx context.Context, req *RegisterRequest) (*models.User, error) {
	emailExists, err := s.userRepo.EmailExists(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if emailExists {
		return nil, repositories.ErrUserExists
	}

	phoneExists, err := s.userRepo.PhoneExists(ctx, req.Phone)
	if err != nil {
		return nil, err
	}
	if phoneExists {
		return nil, repositories.ErrUserExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	if req.Role == "" {
		req.Role = models.RoleRider
	}

	user := &models.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Phone:        req.Phone,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
		Profile:      req.Profile,
		IsActive:     true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (*AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.GenerateTokens(ctx, user.ID)
}

func (s *authService) GenerateTokens(ctx context.Context, userID uuid.UUID) (*AuthResponse, error) {
	now := time.Now()

	accessClaims := jwt.MapClaims{
		"user_id": userID,
		"exp":     now.Add(s.jwtConfig.AccessExpireTime).Unix(),
		"iat":     now.Unix(),
		"type":    "access",
	}

	refreshClaims := jwt.MapClaims{
		"user_id": userID,
		"exp":     now.Add(s.jwtConfig.RefreshExpireTime).Unix(),
		"iat":     now.Unix(),
		"type":    "refresh",
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(s.jwtConfig.Secret))
	if err != nil {
		return nil, err
	}

	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString([]byte(s.jwtConfig.Secret))
	if err != nil {
		return nil, err
	}

	if err := s.redis.Set(ctx, "refresh_token:"+userID.String(), refreshToken, s.jwtConfig.RefreshExpireTime).Err(); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    now.Add(s.jwtConfig.AccessExpireTime),
		User:         user,
	}, nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error) {
	claims, err := s.ValidateToken(refreshToken)
	if err != nil {
		return nil, ErrTokenInvalid
	}

	if (*claims)["type"] != "refresh" {
		return nil, ErrTokenInvalid
	}

	userIDStr, ok := (*claims)["user_id"].(string)
	if !ok {
		return nil, ErrTokenInvalid
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, ErrTokenInvalid
	}

	storedToken, err := s.redis.Get(ctx, "refresh_token:"+userID.String()).Result()
	if err != nil || storedToken != refreshToken {
		return nil, ErrTokenInvalid
	}

	return s.GenerateTokens(ctx, userID)
}

func (s *authService) Logout(ctx context.Context, userID uuid.UUID) error {
	return s.redis.Del(ctx, "refresh_token:"+userID.String()).Err()
}

func (s *authService) ValidateToken(token string) (*jwt.MapClaims, error) {
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.jwtConfig.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := parsedToken.Claims.(jwt.MapClaims); ok && parsedToken.Valid {
		return &claims, nil
	}

	return nil, ErrTokenInvalid
}

func (s *authService) VerifyEmail(ctx context.Context, token string) error {
	return nil
}

func (s *authService) VerifyPhone(ctx context.Context, phone, code string) error {
	return nil
}

func (s *authService) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			return nil
		}
		return err
	}

	token := generateSecureToken(32)
	resetKey := "password_reset:" + user.ID.String()
	
	if err := s.redis.Set(ctx, resetKey, token, 15*time.Minute).Err(); err != nil {
		return err
	}

	return nil
}

func (s *authService) ResetPassword(ctx context.Context, token, newPassword string) error {
	return nil
}

func generateSecureToken(length int) string {
	b := make([]byte, length)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
