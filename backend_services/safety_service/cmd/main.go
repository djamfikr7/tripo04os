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

	"github.com/djamfikr7/tripo04os/safety-service/internal/config"
	"github.com/djamfikr7/tripo04os/safety-service/internal/database"
	"github.com/djamfikr7/tripo04os/safety-service/internal/handlers"
	"github.com/djamfikr7/tripo04os/safety-service/internal/middleware"
	"github.com/djamfikr7/tripo04os/safety-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/safety-service/internal/services"
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

	zap.L().Info("Starting Tripo04OS Safety Service",
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

	safetyReportRepo := repositories.NewSafetyReportRepository(db)
	safetyAlertRepo := repositories.NewSafetyAlertRepository(db)

	safetyService := services.NewSafetyService(safetyReportRepo, safetyAlertRepo, logger)
	safetyHandler := handlers.NewSafetyHandler(safetyService, logger)
	healthHandler := handlers.NewHealthHandler(db)

	router := setupRouter(cfg, safetyHandler, healthHandler)

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

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		zap.L().Error("Server forced to shutdown", zap.Error(err))
	}

	zap.L().Info("Server exited")
}

func setupRouter(cfg *config.Config, safetyHandler *handlers.SafetyHandler, healthHandler *handlers.HealthHandler) *gin.Engine {
	router := gin.New()

	router.Use(middleware.LoggingMiddleware(logger))
	router.Use(middleware.RecoveryMiddleware(logger))
	router.Use(middleware.CORSMiddleware())

	router.GET("/health", healthHandler.HealthCheck)
	router.GET("/ready", healthHandler.ReadinessCheck)

	api := router.Group("/api/v1")
	{
		api.POST("/safety/reports", safetyHandler.CreateSafetyReport)
		api.GET("/safety/reports/:id", safetyHandler.GetSafetyReport)
		api.GET("/safety/reports/user/:user_id", safetyHandler.GetUserSafetyReports)
		api.POST("/safety/alerts", safetyHandler.CreateSafetyAlert)
		api.GET("/safety/alerts/:id", safetyHandler.GetSafetyAlert)
		api.GET("/safety/alerts", safetyHandler.GetActiveAlerts)
		api.POST("/safety/emergency", safetyHandler.ReportEmergency)
	}

	return router
}
