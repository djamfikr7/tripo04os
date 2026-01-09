package services

import (
	"context"

	"github.com/djamfikr7/tripo04os/identity-service/internal/models"
	"github.com/djamfikr7/tripo04os/identity-service/internal/repositories"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	GetCurrentUser(ctx context.Context, userID uuid.UUID) (*models.User, error)
	UpdateCurrentUser(ctx context.Context, userID uuid.UUID, updates map[string]any) (*models.User, error)
	ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error
	DeleteCurrentUser(ctx context.Context, userID uuid.UUID) error
	ListUsers(ctx context.Context, limit, offset int) ([]*models.User, int64, error)
	GetUser(ctx context.Context, userID uuid.UUID) (*models.User, error)
	UpdateUser(ctx context.Context, userID uuid.UUID, updates map[string]any) (*models.User, error)
	DeleteUser(ctx context.Context, userID uuid.UUID) error
}

type userService struct {
	userRepo repositories.UserRepository
}

func NewUserService(userRepo repositories.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetCurrentUser(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	return s.userRepo.GetByID(ctx, userID)
}

func (s *userService) UpdateCurrentUser(ctx context.Context, userID uuid.UUID, updates map[string]any) (*models.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	for key, value := range updates {
		switch key {
		case "email":
			user.Email = value.(string)
		case "phone":
			user.Phone = value.(string)
		case "profile":
			user.Profile = value.(map[string]any)
		}
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return repositories.ErrInvalidPassword
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	return s.userRepo.Update(ctx, user)
}

func (s *userService) DeleteCurrentUser(ctx context.Context, userID uuid.UUID) error {
	return s.userRepo.Delete(ctx, userID)
}

func (s *userService) ListUsers(ctx context.Context, limit, offset int) ([]*models.User, int64, error) {
	return s.userRepo.List(ctx, limit, offset)
}

func (s *userService) GetUser(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	return s.userRepo.GetByID(ctx, userID)
}

func (s *userService) UpdateUser(ctx context.Context, userID uuid.UUID, updates map[string]any) (*models.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	for key, value := range updates {
		switch key {
		case "email":
			user.Email = value.(string)
		case "phone":
			user.Phone = value.(string)
		case "role":
			user.Role = value.(models.Role)
		case "profile":
			user.Profile = value.(map[string]any)
		case "is_active":
			user.IsActive = value.(bool)
		}
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) DeleteUser(ctx context.Context, userID uuid.UUID) error {
	return s.userRepo.Delete(ctx, userID)
}
