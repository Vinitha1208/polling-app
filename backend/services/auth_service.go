package services

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/live-polling/backend/config"
	"github.com/live-polling/backend/models"
	"github.com/live-polling/backend/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailExists      = errors.New("email is already registered")
	ErrInvalidCreds     = errors.New("invalid email or password")
	ErrUserNotFound     = errors.New("user not found")
	ErrInvalidToken     = errors.New("invalid or expired authentication token")
)

type AuthService struct {
	userRepo *repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *AuthService) Register(ctx context.Context, input models.SignupInput) (*models.AuthResponse, error) {
	// Check if user already exists
	existing, err := s.userRepo.FindByEmail(ctx, input.Email)
	if err == nil && existing != nil {
		return nil, ErrEmailExists
	}
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// Generate JWT
	token, err := s.generateToken(user.ID.Hex())
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, input models.LoginInput) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, input.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrInvalidCreds
		}
		return nil, err
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, ErrInvalidCreds
	}

	token, err := s.generateToken(user.ID.Hex())
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) GetUserByID(ctx context.Context, idStr string) (*models.User, error) {
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return nil, ErrUserNotFound
	}
	user, err := s.userRepo.FindByID(ctx, objID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func (s *AuthService) ValidateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return "", ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", ErrInvalidToken
	}

	sub, ok := claims["sub"].(string)
	if !ok {
		return "", ErrInvalidToken
	}

	return sub, nil
}

func (s *AuthService) generateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(), // 7 days validity
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}
