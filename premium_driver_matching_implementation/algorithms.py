"""
Premium Driver Matching Algorithms
Implements intelligent matching algorithms for premium driver assignment
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import math


@dataclass
class DriverProfile:
    """Driver quality profile for matching."""
    driver_id: str
    avg_rating_30d: float
    avg_rating_90d: float
    avg_rating_lifetime: float
    total_rides: int
    completion_rate_30d: float
    acceptance_rate_30d: float
    eta_accuracy_30d: float
    fairness_boost: float = 0.0
    last_updated: datetime


@dataclass
class MatchingRequest:
    """Matching request for premium driver assignment."""
    order_id: str
    pickup_location: Tuple[float, float]  # (latitude, longitude)
    dropoff_location: Tuple[float, float]
    service_type: str
    scheduled_at: Optional[datetime] = None
    user_tier: Optional[str] = None
    user_preferences: Dict[str, any] = None
    premium_required: bool = False


@dataclass
class MatchingScore:
    """Matching score for driver ranking."""
    driver_id: str
    score: float
    eta_score: float
    rating_score: float
    reliability_score: float
    fairness_boost: float
    vehicle_match: float
    total_score: float


class PremiumDriverMatcher:
    """
    Premium Driver Matching Engine
    
    Implements intelligent matching algorithms considering:
    - Driver quality (rating, completion rate, acceptance rate)
    - ETA and proximity
    - Vehicle type compatibility
    - Customer preferences and history
    - Premium tier eligibility
    - Fairness and bias mitigation
    """
    
    def __init__(self):
        """Initialize the matcher."""
        self.driver_profiles: Dict[str, DriverProfile] = {}
        self.user_history: Dict[str, List[Dict]] = {}  # user_id -> list of past orders
        self.premium_tiers = {
            "BRONZE": {"multiplier": 1.3, "min_rating": 4.5},
            "SILVER": {"multiplier": 1.5, "min_rating": 4.0},
            "GOLD": {"multiplier": 2.0, "min_rating": 4.5},
            "PLATINUM": {"multiplier": 2.5, "min_rating": 4.8}
        }
    
    def calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate Haversine distance between two points.
        
        Args:
            lat1, lon1: Coordinates of point 1
            lat2, lon2: Coordinates of point 2
            
        Returns:
            Distance in kilometers
        """
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        lon1_rad = math.radians(lon1)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat / 2) ** 2
        c = math.cos(lat1_rad) * math.cos(lat2_rad)
        c2 = math.cos(lat2_rad) * math.cos(lat1_rad)
        
        # Earth's radius in kilometers
        r = 6371  # km
        
        # Calculate distance
        distance = r * math.acos(
            c * c2 + math.sin(lat1_rad) * math.sin(lat2_rad)
        )
        
        return distance
    
    def calculate_eta(
        self,
        driver_lat: float,
        driver_lon: float,
        pickup_lat: float,
        pickup_lon: float,
        distance_km: float
        average_speed_kmh: float = 30.0
    ) -> int:
        """
        Calculate estimated time of arrival.
        
        Args:
            driver_lat, driver_lon: Driver's current location
            pickup_lat, pickup_lon: Pickup location
            distance_km: Distance to pickup
            average_speed_kmh: Average speed in km/h
            
        Returns:
            ETA in minutes
        """
        # Calculate travel time
        travel_time_hours = distance_km / average_speed_kmh
        travel_time_minutes = travel_time_hours * 60
        
        # Add pickup time (3 minutes to reach driver)
        pickup_time = 3
        total_minutes = travel_time_minutes + pickup_time
        
        return int(total_minutes)
    
    def calculate_eta_score(
        self,
        eta_minutes: int,
        max_eta_minutes: int = 15
    ) -> float:
        """
        Calculate ETA score (higher is better).
        
        Args:
            eta_minutes: Estimated time of arrival
            max_eta_minutes: Maximum acceptable ETA
            
        Returns:
            Score between 0 and 1
        """
        if eta_minutes <= max_eta_minutes:
            return 1.0 - (eta_minutes / max_eta_minutes) * 0.3
        else:
            return 0.7
    
    def calculate_rating_score(
        self,
        avg_rating: float,
        min_rating: float = 4.0
    ) -> float:
        """
        Calculate rating score (higher is better).
        
        Args:
            avg_rating: Average rating (1-5 scale)
            min_rating: Minimum acceptable rating
            
        Returns:
            Score between 0 and 1
        """
        # Normalize rating to 0-1 scale
        normalized_rating = (avg_rating - 1) / 4.0
        
        # Calculate score
        if normalized_rating < 0:
            score = 0.0
        elif normalized_rating < 0.5:
            score = normalized_rating * 2.0
        else:
            score = 1.0
        
        return score
    
    def calculate_reliability_score(
        self,
        completion_rate: float,
        acceptance_rate: float
    ) -> float:
        """
        Calculate reliability score based on completion and acceptance rates.
        
        Args:
            completion_rate: Completion rate (0-1 scale)
            acceptance_rate: Acceptance rate (0-1 scale)
            
        Returns:
            Score between 0 and 1
        """
        # Weighted average (completion is more important)
        reliability_score = (completion_rate * 0.7) + (acceptance_rate * 0.3)
        
        return reliability_score
    
    def calculate_vehicle_match_score(
        self,
        request_service_type: str,
        driver_vehicle_type: str,
        request_special_requirements: List[str],
        driver_specialties: List[str],
    ) -> float:
        """
        Calculate vehicle match score based on service type and requirements.
        
        Args:
            request_service_type: Requested service type
            driver_vehicle_type: Driver's vehicle type
            request_special_requirements: Special requirements from user
            driver_specialties: Driver's specialties
            
        Returns:
            Score between 0 and 1
        """
        score = 0.0
        
        # Check service type compatibility
        service_compatibility = {
            "RIDE": ["SEDAN", "SUV", "LUXURY_SEDAN", "LUXURY_SUV"],
            "MOTO": ["MOTO"],
            "FOOD": ["MOTO", "SCOOTER", "CAR"],
            "GROCERY": ["SCOOTER", "CAR", "VAN"],
            "GOODS": ["SCOOTER", "CAR", "VAN", "TRUCK_VAN"],
            "TRUCK_VAN": ["TRUCK_VAN"]
        }
        
        if driver_vehicle_type in service_compatibility.get(request_service_type, []):
            score += 0.3
        
        # Check special requirements
        if request_special_requirements:
            matched_requirements = 0
            for req in request_special_requirements:
                if req in driver_specialties:
                    matched_requirements += 1
            
            if len(request_special_requirements) > 0:
                score += (matched_requirements / len(request_special_requirements)) * 0.2
        
        return score
    
    def calculate_fairness_boost(
        self,
        driver_profile: DriverProfile,
        recent_assignments: int
    ) -> float:
        """
        Calculate fairness boost based on driver's recent assignment history.
        
        Args:
            driver_profile: Driver's quality profile
            recent_assignments: Number of recent assignments
            
        Returns:
            Fairness boost (0-1 scale)
        """
        boost = driver_profile.fairness_boost
        
        # Reduce boost if driver has been assigned frequently recently
        if recent_assignments > 5:
            boost *= 0.8
        elif recent_assignments > 10:
            boost *= 0.6
        elif recent_assignments > 15:
            boost *= 0.4
        
        return boost
    
    def calculate_match_score(
        self,
        request: MatchingRequest,
        driver_profile: DriverProfile
        distance_km: float,
        eta_minutes: int
    ) -> MatchingScore:
        """
        Calculate comprehensive matching score for a driver.
        
        Args:
            request: Matching request
            driver_profile: Driver's quality profile
            distance_km: Distance to pickup
            eta_minutes: Estimated time of arrival
            
        Returns:
            MatchingScore with all component scores
        """
        # Calculate component scores
        eta_score = self.calculate_eta_score(eta_minutes, max_eta_minutes=15)
        rating_score = self.calculate_rating_score(driver_profile.avg_rating_30d)
        reliability_score = self.calculate_reliability_score(
            driver_profile.completion_rate_30d,
            driver_profile.acceptance_rate_30d
        )
        vehicle_match = self.calculate_vehicle_match_score(
            request.service_type,
            driver_profile.avg_rating_30d,  # Use rating as proxy for vehicle type
            request.service_type,  # Actual vehicle type would come from driver profile
            request.special_requirements,
            driver_profile.specialties if hasattr(driver_profile, 'specialties') else []
        )
        fairness_boost = self.calculate_fairness_boost(driver_profile, recent_assignments=0)
        
        # Calculate weighted total score
        # Weights (from specs103.md):
        # score = 0.35 * eta_score +
        #         0.25 * rating_score +
        #         0.15 * reliability_score +
        #         0.15 * fairness_boost +
        #         0.10 * vehicle_match
        
        total_score = (
            0.35 * eta_score +
            0.25 * rating_score +
            0.15 * reliability_score +
            0.15 * fairness_boost +
            0.10 * vehicle_match
        )
        
        return MatchingScore(
            driver_id=driver_profile.driver_id,
            score=total_score,
            eta_score=eta_score,
            rating_score=rating_score,
            reliability_score=reliability_score,
            fairness_boost=fairness_boost,
            vehicle_match=vehicle_match,
            total_score=total_score
        )
    
    def rank_drivers(
        self,
        request: MatchingRequest,
        available_drivers: List[DriverProfile],
        max_drivers: int = 10
    ) -> List[MatchingScore]:
        """
        Rank drivers for a matching request.
        
        Args:
            request: Matching request
            available_drivers: List of available drivers
            max_drivers: Maximum number of drivers to return
            
        Returns:
            Ranked list of drivers by match score
        """
        scores = []
        
        for driver in available_drivers:
            # Calculate distance
            distance = self.calculate_distance(
                driver.avg_rating_lifetime,  # Use rating as proxy for location
                driver.avg_rating_lifetime,  # Use rating as proxy for location
                request.pickup_location[0],
                request.pickup_location[1]
            )
            
            # Calculate ETA
            eta = self.calculate_eta(
                driver.avg_rating_lifetime,
                driver.avg_rating_lifetime,
                distance_km=distance,
                average_speed_kmh=30.0
            )
            
            # Calculate match score
            score = self.calculate_match_score(
                request=request,
                driver_profile=driver,
                distance_km=distance,
                eta_minutes=eta
            )
            
            scores.append(score)
        
        # Sort by total score (descending)
        scores.sort(key=lambda x: x.total_score, reverse=True)
        
        # Return top N drivers
        return scores[:max_drivers]
    
    def filter_eligible_drivers(
        self,
        drivers: List[DriverProfile],
        request: MatchingRequest
    ) -> List[DriverProfile]:
        """
        Filter drivers based on premium tier requirements.
        
        Args:
            drivers: List of all drivers
            request: Matching request
            
        Returns:
            List of eligible drivers
        """
        eligible_drivers = []
        
        for driver in drivers:
            # Check if driver is premium
            is_premium = driver.avg_rating_lifetime >= 4.5
            
            # Check premium tier requirements
            tier_requirements = self.premium_tiers.get(request.user_tier, {})
            
            if tier_requirements:
                min_rating = tier_requirements.get("min_rating", 4.0)
                
                if driver.avg_rating_30d < min_rating:
                    continue  # Driver doesn't meet minimum rating
            
                # Check if driver offers required service types
                if hasattr(driver, 'specialties'):
                    driver_specialties = driver.specialties
                else:
                    driver_specialties = []
                
                # Check if driver offers required specialties
                required_specialties = request.user_preferences.get("specialties", [])
                if not set(required_specialties).issubset(driver_specialties):
                    continue  # Driver doesn't offer required specialties
            
            # Check availability
            if not driver.is_available:
                continue  # Driver not available
            
            # Check service type compatibility
            if request.service_type:
                service_types = hasattr(driver, 'service_types') and driver.service_types
                if request.service_type not in service_types:
                    continue  # Driver doesn't offer this service type
            
            # Check special requirements
            if request.premium_required:
                # Check for child seat
                if "child_seat" in request.special_requirements:
                    if not hasattr(driver, 'vehicle_features') or "child_seat" not in driver.vehicle_features:
                        continue
                
                # Check for pet-friendly
                if "pet_friendly" in request.special_requirements:
                    if not hasattr(driver, 'vehicle_features') or "pet_friendly" not in driver.vehicle_features:
                        continue
                
                # Check for wheelchair accessible
                if "wheelchair_accessible" in request.special_requirements:
                    if not hasattr(driver, 'vehicle_features') or "wheelchair_accessible" not in driver.vehicle_features:
                        continue
            
            eligible_drivers.append(driver)
        
        return eligible_drivers
    
    def apply_premium_pricing(
        self,
        base_fare: float,
        driver_tier: str,
        service_type: str
    ) -> Dict[str, float]:
        """
        Calculate premium pricing with multipliers.
        
        Args:
            base_fare: Standard base fare
            driver_tier: Premium tier (BRONZE, SILVER, GOLD, PLATINUM)
            service_type: Service type
            
        Returns:
            Pricing breakdown
        """
        tier_config = self.premium_tiers.get(driver_tier, {"multiplier": 1.0})
        multiplier = tier_config["multiplier"]
        
        # Apply premium fee
        premium_fee = base_fare * 0.2  # 20% premium fee
        
        # Apply time-based multipliers
        current_hour = datetime.now().hour
        is_night = current_hour >= 22 or current_hour < 6
        is_weekend = datetime.now().weekday() >= 5  # Saturday or Sunday
        
        if is_night:
            multiplier *= 1.1  # Night premium
        elif is_weekend:
            multiplier *= 1.05  # Weekend premium
        
        total_fare = base_fare * multiplier + premium_fee
        
        # Calculate savings
        standard_fare = base_fare * 1.0
        savings = standard_fare - total_fare
        
        return {
            "base_fare": base_fare,
            "premium_fee": premium_fee,
            "multiplier": multiplier,
            "total_fare": total_fare,
            "savings": savings,
            "savings_percentage": (savings / standard_fare) * 100 if standard_fare > 0 else 0
        }
    
    def get_driver_recommendations(
        self,
        driver_profile: DriverProfile,
        request: MatchingRequest
    ) -> List[str]:
        """
        Get recommendations for improving driver quality.
        
        Args:
            driver_profile: Driver's quality profile
            request: Matching request
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Rating-based recommendations
        if driver_profile.avg_rating_30d < 4.0:
            recommendations.append("Improve your average rating by providing excellent service")
            recommendations.append("Be punctual and professional to increase tips")
        
        # Completion rate recommendations
        if driver_profile.completion_rate_30d < 0.95:
            recommendations.append("Focus on completing all accepted rides")
            recommendations.append("Communicate clearly if you need to cancel")
        
        # Acceptance rate recommendations
        if driver_profile.acceptance_rate_30d < 0.90:
            recommendations.append("Accept more ride requests to improve your rate")
        
        # ETA accuracy recommendations
        if driver_profile.eta_accuracy_30d < 0.85:
            recommendations.append("Update your location regularly for accurate ETAs")
            recommendations.append("Plan your routes more efficiently")
        
        # Reliability recommendations
        if driver_profile.cancellation_rate_30d > 0.05:
            recommendations.append("Reduce cancellations by maintaining your schedule")
            recommendations.append("Give advance notice for cancellations")
        
        return recommendations


def calculate_fairness_score(
    driver_profiles: List[DriverProfile],
    recent_assignments: Dict[str, int]
) -> Dict[str, float]:
    """
    Calculate fairness scores for all drivers based on recent assignment history.
    
    Args:
        driver_profiles: List of driver profiles
        recent_assignments: Dictionary of driver_id -> recent assignment count
            
        Returns:
            Dictionary of driver_id -> fairness score
    """
    fairness_scores = {}
    
    for driver in driver_profiles:
        # Get recent assignment count
        recent_count = recent_assignments.get(driver.driver_id, 0)
        
        # Calculate fairness boost
        if recent_count == 0:
            boost = 0.0
        elif recent_count <= 5:
            boost = 0.0
        elif recent_count <= 10:
            boost = -0.1  # Slight penalty for too many assignments
        elif recent_count <= 15:
            boost = -0.2
        elif recent_count <= 20:
            boost = -0.3
        else:
            boost = -0.5
        
        fairness_scores[driver.driver_id] = boost
    
    return fairness_scores


# Example usage
if __name__ == "__main__":
    # Create matcher instance
    matcher = PremiumDriverMatcher()
    
    # Example driver profiles
    driver_profiles = [
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
    
    # Example matching request
    request = MatchingRequest(
        order_id="order_12345",
        pickup_location=(40.7128, -74.0060),
        dropoff_location=(40.7308, -73.9357),
        service_type="RIDE",
        user_tier="GOLD",
        user_preferences={"specialties": ["airport_transfer"]},
        premium_required=True
    )
    
    # Filter eligible drivers
    eligible_drivers = matcher.filter_eligible_drivers(driver_profiles, request)
    
    # Rank drivers
    ranked_drivers = matcher.rank_drivers(request, eligible_drivers, max_drivers=3)
    
    # Print results
    print("="*60)
    print("Premium Driver Matching Results")
    print("="*60)
    print(f"\nRequest: Order {request.order_id}")
    print(f"Service Type: {request.service_type}")
    print(f"User Tier: {request.user_tier}")
    print(f"Premium Required: {request.premium_required}")
    print(f"Pickup: {request.pickup_location}")
    print(f"Dropoff: {request.dropoff_location}")
    print(f"\nEligible Drivers: {len(eligible_drivers)}")
    print(f"\nRanked Drivers:")
    
    for i, score in enumerate(ranked_drivers, 1):
        driver = next(d for d in driver_profiles if d.driver_id == score.driver_id)
        print(f"  {i+1}. {driver.driver_id}")
        print(f"      Total Score: {score.total_score:.4f}")
        print(f"      ETA Score: {score.eta_score:.4f}")
        print(f"      Rating Score: {score.rating_score:.4f}")
        print(f"      Reliability Score: {score.reliability_score:.4f}")
        print(f"      Fairness Boost: {score.fairness_boost:.4f}")
        print(f"      Vehicle Match: {score.vehicle_match:.4f}")
        print()
    
    # Calculate pricing
    if ranked_drivers:
        top_driver = ranked_drivers[0]
        pricing = matcher.apply_premium_pricing(
            base_fare=25.0,
            driver_tier="GOLD",
            service_type=request.service_type
        )
        
        print(f"\nPremium Pricing (Gold Tier):")
        print(f"  Base Fare: ${pricing['base_fare']:.2f}")
        print(f"  Premium Fee: ${pricing['premium_fee']:.2f}")
        print(f"  Multiplier: {pricing['multiplier']:.2f}x")
        print(f"  Total Fare: ${pricing['total_fare']:.2f}")
        print(f"  Savings: ${pricing['savings']:.2f} ({pricing['savings_percentage']:.1f}%)")
        
        # Get recommendations
        recommendations = matcher.get_driver_recommendations(top_driver, request)
        
        if recommendations:
            print(f"\nRecommendations for {top_driver.driver_id}:")
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i+1}. {rec}")
