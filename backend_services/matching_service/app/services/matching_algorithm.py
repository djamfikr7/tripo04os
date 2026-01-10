"""Matching algorithm implementation with scoring"""

import math
from typing import List, Optional, Tuple
from datetime import datetime, timedelta

from app.models.schemas import (
    DriverAvailability,
    DriverMatch,
    MatchRequest,
    AlgorithmConfig,
    MatchStatus,
)
from app.core.logging import logger


class MatchingAlgorithm:
    """
    Driver matching algorithm using multi-factor scoring
    Formula:
        score = 0.35 * eta_score +
               0.25 * rating_score +
               0.15 * reliability_score +
               0.15 * fairness_boost +
               0.10 * vehicle_match
    """

    def __init__(self, config: AlgorithmConfig):
        self.config = config

    def calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
    ) -> float:
        """
        Calculate distance between two points using Haversine formula
        Returns distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers

        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)

        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lon / 2) ** 2
        )

        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    def calculate_eta(
        self,
        distance_km: float,
        average_speed_kmh: float = 30.0,
    ) -> int:
        """
        Calculate estimated time of arrival in minutes
        """
        if average_speed_kmh <= 0:
            return 30  # Default max ETA

        eta_minutes = int((distance_km / average_speed_kmh) * 60)
        return min(eta_minutes, self.config.max_eta_minutes)

    def normalize_eta(self, eta_minutes: int) -> float:
        """
        Normalize ETA score (lower ETA = higher score)
        """
        if eta_minutes >= self.config.max_eta_minutes:
            return 0.0

        score = 1.0 - (eta_minutes / self.config.max_eta_minutes)
        return max(0.0, min(1.0, score))

    def normalize_rating(self, rating: float) -> float:
        """
        Normalize rating score (higher rating = higher score)
        Rating is 0-5, convert to 0-1
        """
        return rating / 5.0

    def normalize_reliability(
        self,
        total_trips: int,
        reliability_window_hours: int = 24,
    ) -> float:
        """
        Normalize reliability score based on recent trip count
        """
        if total_trips == 0:
            return 0.0

        # More trips = higher reliability
        # Assume average 5 trips per shift, so 100 trips in 20 shifts
        score = min(total_trips / 100.0, 1.0)
        return score

    def calculate_fairness_boost(
        self,
        driver_id: str,
        recent_matches: List[str],
        fairness_window: int = 10,
    ) -> float:
        """
        Calculate fairness boost to prevent always matching same drivers
        Boost is applied if driver hasn't been matched recently
        """
        if driver_id not in recent_matches:
            return 1.0

        # Check position in recent matches (most recent = highest boost)
        # If driver is at the end of list, they haven't matched recently
        try:
            position = recent_matches.index(driver_id)
            # Boost decreases as driver appears more recently in list
            boost = (len(recent_matches) - position) / len(recent_matches)
            return min(boost, self.config.fairness_boost_threshold)
        except ValueError:
            return 1.0

    def calculate_vehicle_match(
        self,
        request_vehicle_type: Optional[str],
        driver_vehicle_type: str,
    ) -> float:
        """
        Calculate vehicle match score
        """
        if request_vehicle_type is None:
            # No specific vehicle requested, all vehicles are equal
            return 1.0

        # Exact match = 1.0, no match = 0.0
        if request_vehicle_type == driver_vehicle_type:
            return 1.0

        return 0.0

    def calculate_match_score(
        self,
        driver: DriverAvailability,
        request: MatchRequest,
        recent_matches: List[str],
    ) -> DriverMatch:
        """
        Calculate overall match score for a driver
        """
        # Calculate distance
        distance_km = self.calculate_distance(
            driver.current_latitude,
            driver.current_longitude,
            request.pickup_latitude,
            request.pickup_longitude,
        )

        # Check distance constraint
        if distance_km > self.config.max_match_distance_km:
            raise ValueError(
                f"Driver too far: {distance_km:.2f}km > {self.config.max_match_distance_km}km"
            )

        # Calculate ETA
        eta_minutes = self.calculate_eta(distance_km)

        # Normalize individual scores
        eta_score = self.normalize_eta(eta_minutes)
        rating_score = self.normalize_rating(driver.rating)
        reliability_score = self.normalize_reliability(driver.total_trips)
        fairness_boost = self.calculate_fairness_boost(driver.driver_id, recent_matches)
        vehicle_match = self.calculate_vehicle_match(
            request.vehicle_type, driver.vehicle_type
        )

        # Calculate weighted match score
        match_score = (
            self.config.eta_weight * eta_score
            + self.config.rating_weight * rating_score
            + self.config.reliability_weight * reliability_score
            + self.config.fairness_boost * fairness_boost
            + self.config.vehicle_weight * vehicle_match
        )

        return DriverMatch(
            order_id=request.order_id,
            driver_id=driver.driver_id,
            match_score=match_score,
            eta_score=eta_score,
            rating_score=rating_score,
            reliability_score=reliability_score,
            fairness_boost=fairness_boost,
            vehicle_match=vehicle_match,
            estimated_arrival_minutes=eta_minutes,
            status=MatchStatus.PENDING,
        )

    def find_best_matches(
        self,
        request: MatchRequest,
        available_drivers: List[DriverAvailability],
        recent_matches: List[str],
        max_matches: int = 5,
    ) -> List[DriverMatch]:
        """
        Find best matches for an order from available drivers
        """
        if not available_drivers:
            return []

        valid_matches = []

        for driver in available_drivers:
            try:
                match = self.calculate_match_score(driver, request, recent_matches)
                valid_matches.append(match)
            except ValueError as e:
                logger.warning(f"Driver {driver.driver_id} filtered: {e}")
                continue

        # Sort by match score (descending)
        valid_matches.sort(key=lambda m: m.match_score, reverse=True)

        # Return top matches
        return valid_matches[:max_matches]
