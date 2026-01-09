package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/djamfikr7/tripo04os/identity-service/internal/config"
	"github.com/djamfikr7/tripo04os/identity-service/internal/database"
	"github.com/djamfikr7/tripo04os/identity-service/internal/handlers"
	"github.com/djamfikr7/tripo04os/identity-service/internal/middleware"
	"github.com/djamfikr7/tripo04os/identity-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/identity-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

var (
	buildVersion = "1.0.0"
	buildDate    = "2026-01-08"
	instanceID   = uuid.New().String()
)

func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	zap.ReplaceGlobals(logger)

	zap.L().Info("Starting Tripo04OS Identity Service",
		zap.String("version", buildVersion),
		zap.String("build_date", buildDate),
		zap.String("instance_id", instanceID),
	)

	cfg, err := config.Load()
	if err != nil {
		zap.L().Fatal("Failed to load configuration", zap.Error(err))
	}

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := database.Initialize(cfg.Database)
	if err != nil {
		zap.L().Fatal("Failed to initialize database", zap.Error(err))
	}

	redisClient := database.InitializeRedis(cfg.Redis)

	userRepo := repositories.NewUserRepository(db)
	driverRepo := repositories.NewDriverRepository(db)

	authService := services.NewAuthService(cfg.JWT, userRepo, redisClient)
	userService := services.NewUserService(userRepo)
	driverService := services.NewDriverService(driverRepo)

	authHandler := handlers.NewAuthHandler(authService, userService, logger)
	userHandler := handlers.NewUserHandler(userService, logger)
	driverHandler := handlers.NewDriverHandler(driverService, logger)
	healthHandler := handlers.NewHealthHandler(db, redisClient)

	router := setupRouter(cfg, authHandler, userHandler, driverHandler, healthHandler)

	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		zap.L().Info("Starting HTTP server",
			zap.String("address", server.Addr),
			zap.String("environment", cfg.Environment),
		)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zap.L().Fatal("Failed to start server", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	zap.L().Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		zap.L().Error("Server forced to shutdown", zap.Error(err))
	}

	zap.L().Info("Server stopped")
}

func setupRouter(cfg *config.Config,
	authHandler *handlers.AuthHandler,
	userHandler *handlers.UserHandler,
	driverHandler *handlers.DriverHandler,
	healthHandler *handlers.HealthHandler) *gin.Engine {
	router := gin.Default()

	router.Use(middleware.CORS())
	router.Use(middleware.RequestID())
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())

	router.GET("/health", healthHandler.Check)
	router.GET("/ready", healthHandler.Ready)

	v1 := router.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/verify-email", authHandler.VerifyEmail)
			auth.POST("/verify-phone", authHandler.VerifyPhone)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
		}

		protected := v1.Group("")
		protected.Use(middleware.Authenticate(cfg.JWT.Secret))
		{
			users := protected.Group("/users")
			{
				users.GET("/me", userHandler.GetCurrentUser)
				users.PUT("/me", userHandler.UpdateCurrentUser)
				users.PUT("/me/password", userHandler.ChangePassword)
				users.DELETE("/me", userHandler.DeleteCurrentUser)
			}

			drivers := protected.Group("/drivers")
			{
				drivers.POST("/register", driverHandler.RegisterDriver)
				drivers.GET("/me", driverHandler.GetCurrentDriver)
				drivers.PUT("/me", driverHandler.UpdateDriver)
				drivers.PUT("/me/availability", driverHandler.UpdateAvailability)
				drivers.PUT("/me/location", driverHandler.UpdateLocation)
				drivers.GET("/me/earnings", driverHandler.GetEarnings)
			}
		}

		admin := v1.Group("/admin")
		admin.Use(middleware.Authenticate(cfg.JWT.Secret))
		admin.Use(middleware.Authorize("ADMIN"))
		{
			admin.GET("/users", userHandler.ListUsers)
			admin.GET("/users/:id", userHandler.GetUser)
			admin.PUT("/users/:id", userHandler.UpdateUser)
			admin.DELETE("/users/:id", userHandler.DeleteUser)

			admin.GET("/drivers", driverHandler.ListDrivers)
			admin.GET("/drivers/:id", driverHandler.GetDriver)
			admin.PUT("/drivers/:id/status", driverHandler.UpdateDriverStatus)
		}
	}

	return router
}
