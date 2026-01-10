"""Test suite for Matching Service"""

import pytest
from app.services.matching_algorithm import MatchingAlgorithm
from app.models.schemas import (
    DriverAvailability,
    MatchRequest,
    AlgorithmConfig,
    MatchStatus,
)
from datetime import datetime


@pytest.fixture
def algorithm_config():
    return AlgorithmConfig()


@pytest.fixture
def sample_driver():
    return DriverAvailability(
        driver_id="driver-1",
        is_online=True,
        is_available=True,
        current_latitude=40.7128,
        current_longitude=-74.0060,
        last_location_update=datetime.now(),
        vehicle_type="SEDAN",
        is_verified=True,
        rating=4.5,
        total_trips=150,
    )


@pytest.fixture
def sample_request():
    return MatchRequest(
        order_id="order-1",
        pickup_latitude=40.7128,
        pickup_longitude=-74.0060,
        destination_latitude=40.7589,
        destination_longitude=-73.9851,
        vehicle_type="SEDAN",
        ride_type="SOLO",
    )


class TestMatchingAlgorithm:
    """Test matching algorithm"""

    def test_calculate_distance(self, algorithm_config):
        """Test distance calculation"""
        algorithm = MatchingAlgorithm(algorithm_config)

        # Manhattan distance (approx 5 km)
        distance = algorithm.calculate_distance(
            40.7128,
            -74.0060,  # NYC Penn Station
            40.7580,
            -73.9850,  # LaGuardia Airport
        )

        assert distance > 4.0
        assert distance < 6.0

    def test_calculate_eta(self, algorithm_config):
        """Test ETA calculation"""
        algorithm = MatchingAlgorithm(algorithm_config)

        # 10km at 30km/h = 20 minutes
        eta = algorithm.calculate_eta(10.0, 30.0)

        assert eta == 20

    def test_normalize_eta(self, algorithm_config, sample_request):
        """Test ETA score normalization"""
        algorithm = MatchingAlgorithm(algorithm_config)

        # Within max ETA
        eta_score = algorithm.normalize_eta(15)
        assert 0.0 < eta_score <= 1.0

        # At max ETA
        eta_score = algorithm.normalize_eta(30)
        assert eta_score == 0.0

        # Zero ETA
        eta_score = algorithm.normalize_eta(0)
        assert eta_score == 1.0

    def test_normalize_rating(self, algorithm_config):
        """Test rating score normalization"""
        algorithm = MatchingAlgorithm(algorithm_config)

        # Perfect rating
        rating_score = algorithm.normalize_rating(5.0)
        assert rating_score == 1.0

        # Good rating
        rating_score = algorithm.normalize_rating(4.5)
        assert rating_score == 0.9

        # Minimum rating
        rating_score = algorithm.normalize_rating(0.0)
        assert rating_score == 0.0

    def test_normalize_reliability(self, algorithm_config):
        """Test reliability score normalization"""
        algorithm = MatchingAlgorithm(algorithm_config)

        # No trips
        reliability_score = algorithm.normalize_reliability(0)
        assert reliability_score == 0.0

        # High reliability
        reliability_score = algorithm.normalize_reliability(100)
        assert reliability_score == 1.0

        # Medium reliability
        reliability_score = algorithm.normalize_reliability(50)
        assert reliability_score == 0.5

    def test_calculate_fairness_boost(self, algorithm_config):
        """Test fairness boost calculation"""
        algorithm = MatchingAlgorithm(algorithm_config)

        # Driver not in recent matches
        boost = algorithm.calculate_fairness_boost("driver-1", [])
        assert boost == 1.0

        # Driver matched recently (at end of list)
        boost = algorithm.calculate_fairness_boost(
            "driver-1",
            ["driver-2", "driver-3", "driver-1"],
        )
        assert boost > 0.0
        assert boost <= 1.0

    def test_calculate_vehicle_match(self, algorithm_config):
        """Test vehicle match calculation"""
        algorithm = MatchingAlgorithm(algorithm_config)

        # No vehicle preference
        match = algorithm.calculate_vehicle_match(None, "SUV")
        assert match == 1.0

        # Matching vehicle type
        match = algorithm.calculate_vehicle_match("SEDAN", "SEDAN")
        assert match == 1.0

        # Non-matching vehicle type
        match = algorithm.calculate_vehicle_match("SEDAN", "SUV")
        assert match == 0.0

    def test_calculate_match_score(
        self, algorithm_config, sample_driver, sample_request
    ):
        """Test overall match score calculation"""
        algorithm = MatchingAlgorithm(algorithm_config)

        match = algorithm.calculate_match_score(
            driver=sample_driver,
            request=sample_request,
            recent_matches=[],
        )

        assert match.order_id == sample_request.order_id
        assert match.driver_id == sample_driver.driver_id
        assert 0.0 <= match.match_score <= 1.0
        assert match.status == MatchStatus.PENDING
        assert match.estimated_arrival_minutes > 0

    def test_find_best_matches(self, algorithm_config, sample_driver, sample_request):
        """Test finding best matches"""
        algorithm = MatchingAlgorithm(algorithm_config)

        matches = algorithm.find_best_matches(
            request=sample_request,
            available_drivers=[sample_driver],
            recent_matches=[],
            max_matches=5,
        )

        assert len(matches) > 0
        assert all(match.match_score >= 0 for match in matches)
        assert all(match.match_score <= 1.0 for match in matches)
        # Matches should be sorted by score (descending)
        assert matches[0].match_score >= matches[-1].match_score

    def test_no_available_drivers(self, algorithm_config, sample_request):
        """Test behavior when no drivers available"""
        algorithm = MatchingAlgorithm(algorithm_config)

        matches = algorithm.find_best_matches(
            request=sample_request,
            available_drivers=[],
            recent_matches=[],
            max_matches=5,
        )

        assert len(matches) == 0
