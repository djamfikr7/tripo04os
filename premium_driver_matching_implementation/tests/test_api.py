"""
Tests for Premium Driver Matching API
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from api import app, driver_profiles_store
from algorithms import DriverProfile


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def sample_driver_profile():
    """Create a sample driver profile."""
    return {
        "driver_id": "driver_001",
        "avg_rating_30d": 4.8,
        "avg_rating_90d": 4.7,
        "avg_rating_lifetime": 4.75,
        "total_rides": 1500,
        "completion_rate_30d": 0.96,
        "acceptance_rate_30d": 0.92,
        "eta_accuracy_30d": 0.88,
        "fairness_boost": 0.0,
        "is_available": True,
        "service_types": ["RIDE", "FOOD"],
        "specialties": ["airport_transfer", "city_tour"],
        "vehicle_features": ["child_seat", "pet_friendly"]
    }


@pytest.fixture
def sample_matching_request():
    """Create a sample matching request."""
    return {
        "order_id": "order_12345",
        "pickup_location": [40.7128, -74.0060],
        "dropoff_location": [40.7308, -73.9357],
        "service_type": "RIDE",
        "user_tier": "GOLD",
        "user_preferences": {"specialties": ["airport_transfer"]},
        "premium_required": True,
        "special_requirements": ["child_seat"]
    }


@pytest.fixture
def sample_pricing_request():
    """Create a sample pricing request."""
    return {
        "base_fare": 25.0,
        "driver_tier": "GOLD",
        "service_type": "RIDE"
    }


class TestHealthEndpoint:
    """Test suite for health check endpoint."""
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
        assert "total_drivers" in data
        
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert isinstance(data["total_drivers"], int)


class TestDriverProfileEndpoints:
    """Test suite for driver profile endpoints."""
    
    def test_create_driver_profile(self, client, sample_driver_profile):
        """Test creating a driver profile."""
        response = client.post("/drivers", json=sample_driver_profile)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["driver_id"] == sample_driver_profile["driver_id"]
        assert data["avg_rating_30d"] == sample_driver_profile["avg_rating_30d"]
        assert data["completion_rate_30d"] == sample_driver_profile["completion_rate_30d"]
        assert data["is_available"] == sample_driver_profile["is_available"]
    
    def test_create_duplicate_driver(self, client, sample_driver_profile):
        """Test creating a duplicate driver profile."""
        # Create first driver
        response1 = client.post("/drivers", json=sample_driver_profile)
        assert response1.status_code == 201
        
        # Try to create duplicate
        response2 = client.post("/drivers", json=sample_driver_profile)
        assert response2.status_code == 409
        assert "already exists" in response2.json()["detail"]
    
    def test_create_driver_invalid_rating(self, client, sample_driver_profile):
        """Test creating a driver with invalid rating."""
        sample_driver_profile["avg_rating_30d"] = 6.0  # Invalid rating
        
        response = client.post("/drivers", json=sample_driver_profile)
        assert response.status_code == 422  # Validation error
    
    def test_create_driver_invalid_completion_rate(self, client, sample_driver_profile):
        """Test creating a driver with invalid completion rate."""
        sample_driver_profile["completion_rate_30d"] = 1.5  # Invalid rate
        
        response = client.post("/drivers", json=sample_driver_profile)
        assert response.status_code == 422  # Validation error
    
    def test_get_driver_profile(self, client, sample_driver_profile):
        """Test getting a driver profile."""
        # Create driver
        create_response = client.post("/drivers", json=sample_driver_profile)
        assert create_response.status_code == 201
        
        # Get driver
        response = client.get(f"/drivers/{sample_driver_profile['driver_id']}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["driver_id"] == sample_driver_profile["driver_id"]
        assert data["avg_rating_30d"] == sample_driver_profile["avg_rating_30d"]
    
    def test_get_nonexistent_driver(self, client):
        """Test getting a nonexistent driver profile."""
        response = client.get("/drivers/nonexistent_driver")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_update_driver_profile(self, client, sample_driver_profile):
        """Test updating a driver profile."""
        # Create driver
        create_response = client.post("/drivers", json=sample_driver_profile)
        assert create_response.status_code == 201
        
        # Update driver
        update_data = {
            "avg_rating_30d": 4.9,
            "completion_rate_30d": 0.98
        }
        response = client.put(
            f"/drivers/{sample_driver_profile['driver_id']}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["avg_rating_30d"] == 4.9
        assert data["completion_rate_30d"] == 0.98
    
    def test_update_nonexistent_driver(self, client):
        """Test updating a nonexistent driver profile."""
        update_data = {"avg_rating_30d": 4.9}
        response = client.put("/drivers/nonexistent_driver", json=update_data)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_delete_driver_profile(self, client, sample_driver_profile):
        """Test deleting a driver profile."""
        # Create driver
        create_response = client.post("/drivers", json=sample_driver_profile)
        assert create_response.status_code == 201
        
        # Delete driver
        response = client.delete(f"/drivers/{sample_driver_profile['driver_id']}")
        assert response.status_code == 204
        
        # Verify deletion
        get_response = client.get(f"/drivers/{sample_driver_profile['driver_id']}")
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_driver(self, client):
        """Test deleting a nonexistent driver profile."""
        response = client.delete("/drivers/nonexistent_driver")
        assert response.status_code == 404
    
    def test_list_drivers(self, client, sample_driver_profile):
        """Test listing driver profiles."""
        # Create multiple drivers
        for i in range(5):
            driver_data = sample_driver_profile.copy()
            driver_data["driver_id"] = f"driver_{i:03d}"
            client.post("/drivers", json=driver_data)
        
        # List drivers
        response = client.get("/drivers")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 5
    
    def test_list_drivers_with_pagination(self, client, sample_driver_profile):
        """Test listing drivers with pagination."""
        # Create multiple drivers
        for i in range(10):
            driver_data = sample_driver_profile.copy()
            driver_data["driver_id"] = f"driver_{i:03d}"
            client.post("/drivers", json=driver_data)
        
        # Get first page
        response1 = client.get("/drivers?skip=0&limit=5")
        assert response1.status_code == 200
        data1 = response1.json()
        assert len(data1) == 5
        
        # Get second page
        response2 = client.get("/drivers?skip=5&limit=5")
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2) == 5
        
        # Verify no overlap
        ids1 = [d["driver_id"] for d in data1]
        ids2 = [d["driver_id"] for d in data2]
        assert len(set(ids1) & set(ids2)) == 0
    
    def test_list_drivers_with_filters(self, client, sample_driver_profile):
        """Test listing drivers with filters."""
        # Create drivers with different service types
        driver_ride = sample_driver_profile.copy()
        driver_ride["driver_id"] = "driver_ride"
        driver_ride["service_types"] = ["RIDE"]
        client.post("/drivers", json=driver_ride)
        
        driver_food = sample_driver_profile.copy()
        driver_food["driver_id"] = "driver_food"
        driver_food["service_types"] = ["FOOD"]
        client.post("/drivers", json=driver_food)
        
        # Filter by service type
        response = client.get("/drivers?service_type=RIDE")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all returned drivers have RIDE service type
        for driver in data:
            assert "RIDE" in driver["service_types"]
    
    def test_list_drivers_with_rating_filter(self, client, sample_driver_profile):
        """Test listing drivers with minimum rating filter."""
        # Create drivers with different ratings
        for i in range(5):
            driver_data = sample_driver_profile.copy()
            driver_data["driver_id"] = f"driver_{i:03d}"
            driver_data["avg_rating_30d"] = 4.0 + i * 0.1
            client.post("/drivers", json=driver_data)
        
        # Filter by minimum rating
        response = client.get("/drivers?min_rating=4.5")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all returned drivers meet minimum rating
        for driver in data:
            assert driver["avg_rating_30d"] >= 4.5


class TestMatchingEndpoints:
    """Test suite for matching endpoints."""
    
    def test_match_drivers(self, client, sample_driver_profile, sample_matching_request):
        """Test driver matching."""
        # Create driver
        client.post("/drivers", json=sample_driver_profile)
        
        # Match drivers
        response = client.post("/match", json=sample_matching_request)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "order_id" in data
        assert "matched_drivers" in data
        assert "total_candidates" in data
        assert "timestamp" in data
        
        assert data["order_id"] == sample_matching_request["order_id"]
        assert isinstance(data["matched_drivers"], list)
        assert isinstance(data["total_candidates"], int)
    
    def test_match_drivers_no_drivers(self, client, sample_matching_request):
        """Test driver matching with no available drivers."""
        response = client.post("/match", json=sample_matching_request)
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["matched_drivers"]) == 0
        assert data["total_candidates"] == 0
    
    def test_match_drivers_invalid_service_type(self, client, sample_matching_request):
        """Test matching with invalid service type."""
        sample_matching_request["service_type"] = "INVALID_TYPE"
        
        response = client.post("/match", json=sample_matching_request)
        assert response.status_code == 422
    
    def test_match_drivers_invalid_coordinates(self, client, sample_matching_request):
        """Test matching with invalid coordinates."""
        sample_matching_request["pickup_location"] = [100.0, -74.0060]  # Invalid latitude
        
        response = client.post("/match", json=sample_matching_request)
        assert response.status_code == 422
    
    def test_match_drivers_invalid_user_tier(self, client, sample_matching_request):
        """Test matching with invalid user tier."""
        sample_matching_request["user_tier"] = "INVALID_TIER"
        
        response = client.post("/match", json=sample_matching_request)
        assert response.status_code == 422


class TestPricingEndpoints:
    """Test suite for pricing endpoints."""
    
    def test_calculate_pricing(self, client, sample_pricing_request):
        """Test premium pricing calculation."""
        response = client.post("/pricing", json=sample_pricing_request)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "base_fare" in data
        assert "premium_fee" in data
        assert "multiplier" in data
        assert "total_fare" in data
        assert "savings" in data
        assert "savings_percentage" in data
        
        assert data["base_fare"] == sample_pricing_request["base_fare"]
        assert data["total_fare"] > data["base_fare"]
    
    def test_calculate_pricing_invalid_tier(self, client, sample_pricing_request):
        """Test pricing with invalid driver tier."""
        sample_pricing_request["driver_tier"] = "INVALID_TIER"
        
        response = client.post("/pricing", json=sample_pricing_request)
        assert response.status_code == 422
    
    def test_calculate_pricing_all_tiers(self, client, sample_pricing_request):
        """Test pricing for all premium tiers."""
        tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"]
        fares = []
        
        for tier in tiers:
            sample_pricing_request["driver_tier"] = tier
            response = client.post("/pricing", json=sample_pricing_request)
            
            assert response.status_code == 200
            data = response.json()
            fares.append(data["total_fare"])
        
        # Verify pricing increases with tier
        for i in range(len(fares) - 1):
            assert fares[i] < fares[i + 1]


class TestRecommendationsEndpoint:
    """Test suite for recommendations endpoint."""
    
    def test_get_driver_recommendations(self, client, sample_driver_profile):
        """Test getting driver recommendations."""
        # Create driver
        client.post("/drivers", json=sample_driver_profile)
        
        # Get recommendations
        response = client.get(f"/drivers/{sample_driver_profile['driver_id']}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "driver_id" in data
        assert "recommendations" in data
        
        assert data["driver_id"] == sample_driver_profile["driver_id"]
        assert isinstance(data["recommendations"], list)
    
    def test_get_recommendations_nonexistent_driver(self, client):
        """Test getting recommendations for nonexistent driver."""
        response = client.get("/drivers/nonexistent_driver/recommendations")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


class TestFairnessEndpoint:
    """Test suite for fairness endpoint."""
    
    def test_calculate_fairness_scores(self, client, sample_driver_profile):
        """Test fairness score calculation."""
        # Create driver
        client.post("/drivers", json=sample_driver_profile)
        
        # Get fairness scores
        response = client.get("/fairness")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, dict)
        assert sample_driver_profile["driver_id"] in data


class TestStatisticsEndpoint:
    """Test suite for statistics endpoint."""
    
    def test_get_statistics(self, client, sample_driver_profile):
        """Test getting statistics."""
        # Create driver
        client.post("/drivers", json=sample_driver_profile)
        
        # Get statistics
        response = client.get("/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_drivers" in data
        assert "available_drivers" in data
        assert "avg_rating" in data
        assert "avg_completion_rate" in data
        assert "avg_acceptance_rate" in data
        
        assert data["total_drivers"] >= 1
        assert data["available_drivers"] >= 1
        assert 1.0 <= data["avg_rating"] <= 5.0
        assert 0.0 <= data["avg_completion_rate"] <= 1.0
        assert 0.0 <= data["avg_acceptance_rate"] <= 1.0
    
    def test_get_statistics_empty(self, client):
        """Test getting statistics with no drivers."""
        response = client.get("/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_drivers"] == 0
        assert data["available_drivers"] == 0
        assert data["avg_rating"] == 0.0
        assert data["avg_completion_rate"] == 0.0
        assert data["avg_acceptance_rate"] == 0.0


class TestErrorHandling:
    """Test suite for error handling."""
    
    def test_404_error(self, client):
        """Test 404 error handling."""
        response = client.get("/nonexistent_endpoint")
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client):
        """Test method not allowed error."""
        response = client.patch("/drivers")
        assert response.status_code == 405


class TestIntegration:
    """Test suite for integration scenarios."""
    
    def test_full_matching_flow(self, client, sample_driver_profile, sample_matching_request):
        """Test complete matching flow."""
        # Create driver
        create_response = client.post("/drivers", json=sample_driver_profile)
        assert create_response.status_code == 201
        
        # Match drivers
        match_response = client.post("/match", json=sample_matching_request)
        assert match_response.status_code == 200
        
        match_data = match_response.json()
        assert len(match_data["matched_drivers"]) > 0
        
        # Get driver profile
        top_driver_id = match_data["matched_drivers"][0]["driver_id"]
        driver_response = client.get(f"/drivers/{top_driver_id}")
        assert driver_response.status_code == 200
        
        # Get recommendations
        rec_response = client.get(f"/drivers/{top_driver_id}/recommendations")
        assert rec_response.status_code == 200
        
        # Calculate pricing
        pricing_request = {
            "base_fare": 25.0,
            "driver_tier": "GOLD",
            "service_type": "RIDE"
        }
        pricing_response = client.post("/pricing", json=pricing_request)
        assert pricing_response.status_code == 200
        
        # Get statistics
        stats_response = client.get("/stats")
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        assert stats_data["total_drivers"] >= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
