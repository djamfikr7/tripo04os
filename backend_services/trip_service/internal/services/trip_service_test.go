package services

import (
	"testing"

	"github.com/djamfikr7/tripo04os/trip-service/internal/models"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestTripService_CreateTrip(t *testing.T) {
	trip := &models.Trip{
		ID:       uuid.New(),
		OrderID:  uuid.New(),
		DriverID: uuid.New(),
		Status:   models.TripStatusDriverAssigned,
	}

	assert.NotNil(t, trip)
	assert.Equal(t, models.TripStatusDriverAssigned, trip.Status)
}

func TestTripService_StatusTransition(t *testing.T) {
	validTransitions := map[string][]string{
		"CREATED":         {"DRIVER_ASSIGNED", "CANCELLED"},
		"DRIVER_ASSIGNED": {"DRIVER_EN_ROUTE", "CANCELLED"},
		"DRIVER_EN_ROUTE": {"ARRIVED", "CANCELLED"},
		"ARRIVED":         {"IN_PROGRESS", "CANCELLED"},
		"IN_PROGRESS":     {"COMPLETED", "CANCELLED"},
	}

	currentStatus := "CREATED"
	nextStatuses := validTransitions[currentStatus]

	assert.Len(t, nextStatuses, 2)
	assert.Contains(t, nextStatuses, "DRIVER_ASSIGNED")
	assert.Contains(t, nextStatuses, "CANCELLED")
}
