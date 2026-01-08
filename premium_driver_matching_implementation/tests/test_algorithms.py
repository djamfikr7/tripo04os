"""
Tests for Premium Driver Matching algorithms
"""

import pytest
import numpy as np
from datetime import datetime, timedelta
from algorithms import (
    PremiumDriverMatcher,
    DriverProfile,
    MatchingRequest,
    MatchingScore,
    calculate_fairness_score
)


class TestPremiumDriverMatcher:
    """Test suite for PremiumDriverMatcher class."""
    
    @pytest.fixture
    def matcher(self):
        """Create a matcher instance."""
        return PremiumDriverMatcher()
    
    @pytest.fixture
    def sample_drivers(self):
        """Create sample driver profiles."""
        return [
            DriverProfile(
                driver_id="driver_001",
                avg_rating_30d=4.8,
                avg_rating_90d=4.7,
                avg_rating_lifetime=4.75,
                total_rides=1500,
                completion_rate_30d=0.96,
                acceptance_rate_30d=0.92,
                eta_accuracy_30d=0.88,
                fairness_boost=0.0
            ),
            DriverProfile(
                driver_id="driver_002",
                avg_rating_30d=4.5,
                avg_rating_90d=4.4,
                avg_rating_lifetime=4.45,
                total_rides=1200,
                completion_rate_30d=0.94,
                acceptance_rate_30d=0.88,
                eta_accuracy_30d=0.85,
                fairness_boost=0.0
            ),
            DriverProfile(
                driver_id="driver_003",
                avg_rating_30d=4.2,
                avg_rating_90d=4.1,
                avg_rating_lifetime=4.15,
                total_rides=800,
                completion_rate_30d=0.92,
                acceptance_rate_30d=0.85,
                eta_accuracy_30d=0.82,
                fairness_boost=0.1
            )
        ]
    
    @pytest.fixture
    def sample_request(self):
        """Create a sample matching request."""
        return MatchingRequest(
            order_id="order_12345",
            pickup_location=(40.7128, -74.0060),
            dropoff_location=(40.7308, -73.9357),
            service_type="RIDE",
            user_tier="GOLD",
            user_preferences={"specialties": ["airport_transfer"]},
            premium_required=True
        )
    
    def test_calculate_distance(self, matcher):
        """Test distance calculation."""
        # Test distance between NYC coordinates
        distance = matcher.calculate_distance(40.7128, -74.0060, 40.7308, -73.9357)
        
        # Distance should be positive and reasonable
        assert distance > 0
        assert distance < 20  # Should be less than 20km
        
        # Test same point (should be 0)
        same_point_distance = matcher.calculate_distance(40.7128, -74.0060, 40.7128, -74.0060)
        assert same_point_distance == pytest.approx(0.0, abs=0.01)
    
    def test_calculate_eta(self, matcher):
        """Test ETA calculation."""
        # Test ETA for 5km distance
        eta = matcher.calculate_eta(
            driver_lat=40.7128,
            driver_lon=-74.0060,
            pickup_lat=40.7308,
            pickup_lon=-73.9357,
            distance_km=5.0,
            average_speed_kmh=30.0
        )
        
        # ETA should be positive and reasonable
        assert eta > 0
        assert eta < 20  # Should be less than 20 minutes
        
        # Test with higher speed
        eta_fast = matcher.calculate_eta(
            driver_lat=40.7128,
            driver_lon=-74.0060,
            pickup_lat=40.7308,
            pickup_lon=-73.9357,
            distance_km=5.0,
            average_speed_kmh=60.0
        )
        
        # Higher speed should result in lower ETA
        assert eta_fast < eta
    
    def test_calculate_eta_score(self, matcher):
        """Test ETA score calculation."""
        # Test ETA within max limit
        score_5min = matcher.calculate_eta_score(5, max_eta_minutes=15)
        assert score_5min > 0.7
        assert score_5min <= 1.0
        
        # Test ETA at max limit
        score_15min = matcher.calculate_eta_score(15, max_eta_minutes=15)
        assert score_15min == pytest.approx(0.7)
        
        # Test ETA over max limit
        score_20min = matcher.calculate_eta_score(20, max_eta_minutes=15)
        assert score_20min == pytest.approx(0.7)
    
    def test_calculate_rating_score(self, matcher):
        """Test rating score calculation."""
        # Test high rating
        score_5 = matcher.calculate_rating_score(5.0)
        assert score_5 == pytest.approx(1.0)
        
        # Test medium rating
        score_4 = matcher.calculate_rating_score(4.0)
        assert score_4 > 0.5
        assert score_4 < 1.0
        
        # Test low rating
        score_2 = matcher.calculate_rating_score(2.0)
        assert score_2 < 0.5
        
        # Test minimum rating
        score_1 = matcher.calculate_rating_score(1.0)
        assert score_1 == pytest.approx(0.0)
    
    def test_calculate_reliability_score(self, matcher):
        """Test reliability score calculation."""
        # Test high reliability
        score = matcher.calculate_reliability_score(0.98, 0.95)
        assert score > 0.9
        assert score <= 1.0
        
        # Test medium reliability
        score = matcher.calculate_reliability_score(0.90, 0.85)
        assert score > 0.8
        assert score < 0.9
        
        # Test low reliability
        score = matcher.calculate_reliability_score(0.70, 0.60)
        assert score < 0.7
        
        # Test edge cases
        score = matcher.calculate_reliability_score(1.0, 1.0)
        assert score == pytest.approx(1.0)
        
        score = matcher.calculate_reliability_score(0.0, 0.0)
        assert score == pytest.approx(0.0)
    
    def test_calculate_vehicle_match_score(self, matcher):
        """Test vehicle match score calculation."""
        # Test compatible service type
        score = matcher.calculate_vehicle_match_score(
            request_service_type="RIDE",
            driver_vehicle_type="SEDAN",
            request_special_requirements=[],
            driver_specialties=[]
        )
        assert score > 0
        
        # Test incompatible service type
        score = matcher.calculate_vehicle_match_score(
            request_service_type="MOTO",
            driver_vehicle_type="SEDAN",
            request_special_requirements=[],
            driver_specialties=[]
        )
        assert score == pytest.approx(0.0)
        
        # Test with special requirements
        score = matcher.calculate_vehicle_match_score(
            request_service_type="RIDE",
            driver_vehicle_type="SEDAN",
            request_special_requirements=["airport_transfer"],
            driver_specialties=["airport_transfer", "city_tour"]
        )
        assert score > 0.3
    
    def test_calculate_fairness_boost(self, matcher, sample_drivers):
        """Test fairness boost calculation."""
        driver = sample_drivers[0]
        
        # Test with no recent assignments
        boost = matcher.calculate_fairness_boost(driver, recent_assignments=0)
        assert boost == pytest.approx(0.0)
        
        # Test with few recent assignments
        boost = matcher.calculate_fairness_boost(driver, recent_assignments=5)
        assert boost == pytest.approx(0.0)
        
        # Test with many recent assignments (should reduce boost)
        boost = matcher.calculate_fairness_boost(driver, recent_assignments=10)
        assert boost <= driver.fairness_boost
        
        # Test with very many recent assignments (should reduce boost more)
        boost = matcher.calculate_fairness_boost(driver, recent_assignments=20)
        assert boost <= driver.fairness_boost * 0.4
    
    def test_calculate_match_score(self, matcher, sample_drivers, sample_request):
        """Test comprehensive match score calculation."""
        driver = sample_drivers[0]
        
        # Calculate match score
        score = matcher.calculate_match_score(
            request=sample_request,
            driver_profile=driver,
            distance_km=5.0,
            eta_minutes=8
        )
        
        # Verify score is a MatchingScore object
        assert isinstance(score, MatchingScore)
        assert score.driver_id == driver.driver_id
        
        # Verify all component scores are in valid range
        assert 0 <= score.eta_score <= 1.0
        assert 0 <= score.rating_score <= 1.0
        assert 0 <= score.reliability_score <= 1.0
        assert 0 <= score.fairness_boost <= 1.0
        assert 0 <= score.vehicle_match <= 1.0
        assert 0 <= score.total_score <= 1.0
        
        # Verify total score is weighted sum of components
        expected_total = (
            0.35 * score.eta_score +
            0.25 * score.rating_score +
            0.15 * score.reliability_score +
            0.15 * score.fairness_boost +
            0.10 * score.vehicle_match
        )
        assert score.total_score == pytest.approx(expected_total)
    
    def test_rank_drivers(self, matcher, sample_drivers, sample_request):
        """Test driver ranking."""
        # Rank drivers
        ranked = matcher.rank_drivers(sample_request, sample_drivers, max_drivers=3)
        
        # Verify results
        assert len(ranked) == 3
        assert all(isinstance(score, MatchingScore) for score in ranked)
        
        # Verify scores are sorted in descending order
        scores = [score.total_score for score in ranked]
        assert scores == sorted(scores, reverse=True)
        
        # Verify top driver has highest score
        assert ranked[0].total_score >= ranked[1].total_score
        assert ranked[1].total_score >= ranked[2].total_score
    
    def test_filter_eligible_drivers(self, matcher, sample_drivers, sample_request):
        """Test driver eligibility filtering."""
        # Add additional attributes to drivers
        for driver in sample_drivers:
            driver.is_available = True
            driver.service_types = ["RIDE", "FOOD"]
            driver.specialties = ["airport_transfer", "city_tour"]
            driver.vehicle_features = ["child_seat", "pet_friendly"]
        
        # Filter eligible drivers
        eligible = matcher.filter_eligible_drivers(sample_drivers, sample_request)
        
        # Verify results
        assert len(eligible) > 0
        assert all(isinstance(driver, DriverProfile) for driver in eligible)
    
    def test_apply_premium_pricing(self, matcher):
        """Test premium pricing calculation."""
        # Test Gold tier
        pricing = matcher.apply_premium_pricing(
            base_fare=25.0,
            driver_tier="GOLD",
            service_type="RIDE"
        )
        
        # Verify pricing structure
        assert "base_fare" in pricing
        assert "premium_fee" in pricing
        assert "multiplier" in pricing
        assert "total_fare" in pricing
        assert "savings" in pricing
        assert "savings_percentage" in pricing
        
        # Verify values
        assert pricing["base_fare"] == 25.0
        assert pricing["premium_fee"] == 5.0  # 20% of base fare
        assert pricing["multiplier"] == 2.0  # Gold tier multiplier
        assert pricing["total_fare"] == 55.0  # 25 * 2.0 + 5
        
        # Test different tiers
        bronze_pricing = matcher.apply_premium_pricing(25.0, "BRONZE", "RIDE")
        silver_pricing = matcher.apply_premium_pricing(25.0, "SILVER", "RIDE")
        platinum_pricing = matcher.apply_premium_pricing(25.0, "PLATINUM", "RIDE")
        
        # Verify pricing increases with tier
        assert bronze_pricing["total_fare"] < silver_pricing["total_fare"]
        assert silver_pricing["total_fare"] < pricing["total_fare"]
        assert pricing["total_fare"] < platinum_pricing["total_fare"]
    
    def test_get_driver_recommendations(self, matcher, sample_drivers, sample_request):
        """Test driver recommendations."""
        driver = sample_drivers[2]  # Lowest rated driver
        
        # Get recommendations
        recommendations = matcher.get_driver_recommendations(driver, sample_request)
        
        # Verify recommendations
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        assert all(isinstance(rec, str) for rec in recommendations)
        
        # Test high-rated driver (should have fewer recommendations)
        top_driver = sample_drivers[0]
        top_recommendations = matcher.get_driver_recommendations(top_driver, sample_request)
        assert len(top_recommendations) <= len(recommendations)


class TestFairnessScore:
    """Test suite for fairness score calculation."""
    
    @pytest.fixture
    def sample_drivers(self):
        """Create sample driver profiles."""
        return [
            DriverProfile(
                driver_id="driver_001",
                avg_rating_30d=4.8,
                avg_rating_90d=4.7,
                avg_rating_lifetime=4.75,
                total_rides=1500,
                completion_rate_30d=0.96,
                acceptance_rate_30d=0.92,
                eta_accuracy_30d=0.88,
                fairness_boost=0.0
            ),
            DriverProfile(
                driver_id="driver_002",
                avg_rating_30d=4.5,
                avg_rating_90d=4.4,
                avg_rating_lifetime=4.45,
                total_rides=1200,
                completion_rate_30d=0.94,
                acceptance_rate_30d=0.88,
                eta_accuracy_30d=0.85,
                fairness_boost=0.0
            )
        ]
    
    def test_calculate_fairness_score(self, sample_drivers):
        """Test fairness score calculation."""
        # Test with no recent assignments
        recent_assignments = {"driver_001": 0, "driver_002": 0}
        scores = calculate_fairness_score(sample_drivers, recent_assignments)
        
        # Verify all drivers have zero boost
        assert all(score == 0.0 for score in scores.values())
        
        # Test with varying recent assignments
        recent_assignments = {"driver_001": 5, "driver_002": 15}
        scores = calculate_fairness_score(sample_drivers, recent_assignments)
        
        # Verify driver with more assignments has lower score
        assert scores["driver_001"] > scores["driver_002"]
        
        # Test with very high assignment counts
        recent_assignments = {"driver_001": 25, "driver_002": 0}
        scores = calculate_fairness_score(sample_drivers, recent_assignments)
        
        # Verify driver with many assignments has negative score
        assert scores["driver_001"] < 0
        assert scores["driver_002"] == 0.0


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    @pytest.fixture
    def matcher(self):
        """Create a matcher instance."""
        return PremiumDriverMatcher()
    
    def test_empty_driver_list(self, matcher):
        """Test matching with empty driver list."""
        request = MatchingRequest(
            order_id="order_12345",
            pickup_location=(40.7128, -74.0060),
            dropoff_location=(40.7308, -73.9357),
            service_type="RIDE"
        )
        
        # Rank empty list
        ranked = matcher.rank_drivers(request, [], max_drivers=10)
        assert len(ranked) == 0
        
        # Filter empty list
        eligible = matcher.filter_eligible_drivers([], request)
        assert len(eligible) == 0
    
    def test_invalid_coordinates(self, matcher):
        """Test distance calculation with invalid coordinates."""
        # Test with invalid latitude
        with pytest.raises(Exception):
            matcher.calculate_distance(100.0, -74.0060, 40.7308, -73.9357)
        
        # Test with invalid longitude
        with pytest.raises(Exception):
            matcher.calculate_distance(40.7128, -200.0, 40.7308, -73.9357)
    
    def test_zero_distance(self, matcher):
        """Test ETA calculation with zero distance."""
        eta = matcher.calculate_eta(
            driver_lat=40.7128,
            driver_lon=-74.0060,
            pickup_lat=40.7128,
            pickup_lon=-74.0060,
            distance_km=0.0,
            average_speed_kmh=30.0
        )
        
        # Should still include pickup time
        assert eta == pytest.approx(3.0)
    
    def test_extreme_ratings(self, matcher):
        """Test rating score calculation with extreme values."""
        # Test minimum rating
        score = matcher.calculate_rating_score(1.0)
        assert score == pytest.approx(0.0)
        
        # Test maximum rating
        score = matcher.calculate_rating_score(5.0)
        assert score == pytest.approx(1.0)
        
        # Test invalid rating (below minimum)
        score = matcher.calculate_rating_score(0.5)
        assert score == pytest.approx(0.0)
    
    def test_extreme_reliability(self, matcher):
        """Test reliability score calculation with extreme values."""
        # Test perfect reliability
        score = matcher.calculate_reliability_score(1.0, 1.0)
        assert score == pytest.approx(1.0)
        
        # Test zero reliability
        score = matcher.calculate_reliability_score(0.0, 0.0)
        assert score == pytest.approx(0.0)
        
        # Test mixed reliability
        score = matcher.calculate_reliability_score(1.0, 0.0)
        assert score == pytest.approx(0.7)  # Weighted average
    
    def test_large_driver_pool(self, matcher):
        """Test ranking with large driver pool."""
        # Create large driver pool
        drivers = []
        for i in range(100):
            driver = DriverProfile(
                driver_id=f"driver_{i:03d}",
                avg_rating_30d=4.0 + (i % 10) * 0.1,
                avg_rating_90d=4.0 + (i % 10) * 0.1,
                avg_rating_lifetime=4.0 + (i % 10) * 0.1,
                total_rides=1000 + i * 10,
                completion_rate_30d=0.9 + (i % 10) * 0.01,
                acceptance_rate_30d=0.85 + (i % 10) * 0.01,
                eta_accuracy_30d=0.8 + (i % 10) * 0.02,
                fairness_boost=0.0
            )
            drivers.append(driver)
        
        request = MatchingRequest(
            order_id="order_12345",
            pickup_location=(40.7128, -74.0060),
            dropoff_location=(40.7308, -73.9357),
            service_type="RIDE"
        )
        
        # Rank drivers
        ranked = matcher.rank_drivers(request, drivers, max_drivers=10)
        
        # Verify results
        assert len(ranked) == 10
        assert all(isinstance(score, MatchingScore) for score in ranked)
        
        # Verify scores are sorted
        scores = [score.total_score for score in ranked]
        assert scores == sorted(scores, reverse=True)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
