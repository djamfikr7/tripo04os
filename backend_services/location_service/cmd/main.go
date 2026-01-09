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

	"github.com/djamfikr7/tripo04os/location-service/internal/config"
	"github.com/djamfikr7/tripo04os/location-service/internal/database"
	"github.com/djamfikr7/tripo04os/location-service/internal/handlers"
	"github.com/djamfikr7/tripo04os/location-service/internal/middleware"
	"github.com/djamfikr7/tripo04os/location-service/internal/repositories"
	"github.com/djamfikr7/tripo04os/location-service/internal/services"
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

	zap.L().Info("Starting Tripo04OS Location Service",
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

	driverLocationRepo := repositories.NewDriverLocationRepository(db)
	geofenceRepo := repositories.NewGeofenceRepository(db)

	driverLocationService := services.NewDriverLocationService(driverLocationRepo)
	geofenceService := services.NewGeofenceService(geofenceRepo)

	driverLocationHandler := handlers.NewDriverLocationHandler(driverLocationService, logger)
	geofenceHandler := handlers.NewGeofenceHandler(geofenceService, logger)
	healthHandler := handlers.NewHealthHandler(db)

	router := setupRouter(cfg, driverLocationHandler, geofenceHandler, healthHandler)

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
	driverLocationHandler *handlers.DriverLocationHandler,
	geofenceHandler *handlers.GeofenceHandler,
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
		driverLocations := v1.Group("/driver-locations")
		{
			driverLocations.POST("", driverLocationHandler.UpdateLocation)
			driverLocations.GET("/:driver_id", driverLocationHandler.GetDriverLocation)
			driverLocations.GET("/nearby", driverLocationHandler.GetNearbyDrivers)
			driverLocations.GET("/area", driverLocationHandler.GetDriversInArea)
		}

		geofences := v1.Group("/geofences")
		geofences.Use(middleware.Authenticate(cfg.JWT.Secret))
		{
			geofences.POST("", geofenceHandler.CreateGeofence)
			geofences.GET("", geofenceHandler.ListGeofences)
			geofences.GET("/:id", geofenceHandler.GetGeofence)
			geofences.PUT("/:id", geofenceHandler.UpdateGeofence)
			geofences.DELETE("/:id", geofenceHandler.DeleteGeofence)
			geofences.POST("/check", geofenceHandler.CheckGeofence)
		}
	}

	return router
}
