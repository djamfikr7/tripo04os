"""Integration tests for Matching Service endpoints"""

import pytest
from fastapi.testclient import TestClient
from app.models.schemas import MatchRequest


def test_health_endpoint(test_client):
    """Test health check endpoint"""
    response = test_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_ready_endpoint(test_client):
    """Test readiness endpoint"""
    response = test_client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


def test_find_drivers_no_drivers(test_client):
    """Test find drivers when no drivers available"""
    request = MatchRequest(
        order_id="test-order",
        pickup_latitude=40.7128,
        pickup_longitude=-74.0060,
        destination_latitude=40.7589,
        destination_longitude=-73.9851,
    )

    # This will return 404 because no drivers in database (stub)
    response = test_client.post("/api/v1/matching/find-drivers", json=request.dict())
    assert response.status_code == 404


def test_get_config(test_client):
    """Test get configuration endpoint"""
    response = test_client.get("/api/v1/matching/config")
    assert response.status_code == 200
    data = response.json()
    assert "eta_weight" in data
    assert "rating_weight" in data
    assert data["eta_weight"] == 0.35
    assert data["rating_weight"] == 0.25
