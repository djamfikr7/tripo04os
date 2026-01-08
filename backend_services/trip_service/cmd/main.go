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

	"github.com/djamfikr7/tripo04os/trip-service/internal/config"
	"github.com/djamfikr7/tripo04os/trip-service/internal/database"
	"github.com/djamfikr7/tripo04os/trip-service/internal/handlers"
	"github.com/djamfikr7/tripo04os/trip-service/internal/middleware"
	"github.com/djamfikr7/tripo04os/trip-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/trip-service/internal/services"
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

	zap.L().Info("Starting Tripo04OS Trip Service",
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

	tripRepo := repositories.NewTripRepository(db)
	driverLocationRepo := repositories.NewDriverLocationRepository(db)

	tripService := services.NewTripService(tripRepo, driverLocationRepo)
	tripHandler := handlers.NewTripHandler(tripService, logger)
	healthHandler := handlers.NewHealthHandler(db)

	router := setupRouter(cfg, tripHandler, healthHandler)

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
	tripHandler *handlers.TripHandler,
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
		trips := v1.Group("/trips")
		{
			trips.POST("", tripHandler.CreateTrip)
			trips.GET("/:id", tripHandler.GetTrip)
			trips.PUT("/:id", tripHandler.UpdateTrip)
			trips.PUT("/:id/status", tripHandler.UpdateTripStatus)
			trips.PUT("/:id/location", tripHandler.UpdateTripLocation)
			trips.POST("/:id/start", tripHandler.StartTrip)
			trips.POST("/:id/complete", tripHandler.CompleteTrip)
			trips.POST("/:id/cancel", tripHandler.CancelTrip)
			trips.GET("/order/:order_id", tripHandler.GetTripByOrderID)
			trips.GET("/driver/:driver_id", tripHandler.GetDriverActiveTrip)
			trips.GET("/active", tripHandler.GetActiveTrips)
			trips.GET("/driver/:driver_id", tripHandler.GetDriverTrips)
			trips.GET("/driver/:driver_id/completed", tripHandler.GetDriverCompletedTrips)
			trips.GET("/completed", tripHandler.GetCompletedTrips)
		}
	}

	return router
}
