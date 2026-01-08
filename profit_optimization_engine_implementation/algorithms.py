"""
Profit Optimization Engine Algorithms
Implements AI-powered profit optimization algorithms for Tripo04OS platform
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import math


class OptimizationObjective(Enum):
    """Optimization objectives."""
    MAXIMIZE_PROFIT = "maximize_profit"
    MAXIMIZE_REVENUE = "maximize_revenue"
    MAXIMIZE_USER_SATISFACTION = "maximize_user_satisfaction"
    BALANCED = "balanced"


class ServiceType(Enum):
    """Service types."""
    RIDE = "RIDE"
    MOTO = "MOTO"
    FOOD = "FOOD"
    GROCERY = "GROCERY"
    GOODS = "GOODS"
    TRUCK_VAN = "TRUCK_VAN"


class PremiumTier(Enum):
    """Premium tiers."""
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"


@dataclass
class MarketConditions:
    """Current market conditions."""
    demand_level: float  # 0-1 scale
    supply_level: float  # 0-1 scale
    competitor_pricing: Dict[str, float]  # service_type -> avg_price
    time_of_day: int  # 0-23
    day_of_week: int  # 0-6 (Monday=0)
    is_holiday: bool
    weather_impact: float  # -1 to 1 (negative = bad weather)
    event_impact: float  # 0-1 (presence of major events)


@dataclass
class UserProfile:
    """User profile for personalization."""
    user_id: str
    user_tier: Optional[PremiumTier]
    avg_order_value: float
    order_frequency: float  # orders per week
    churn_risk: float  # 0-1 scale
    monetization_propensity: float  # 0-1 scale
    price_sensitivity: float  # 0-1 scale
    loyalty_score: float  # 0-1 scale
    behavior_segment: str
    lifetime_value: float


@dataclass
class OptimizationResult:
    """Result of profit optimization."""
    recommended_price: float
    expected_revenue: float
    expected_profit: float
    confidence_score: float
    optimization_factors: Dict[str, float]
    alternative_options: List[Dict[str, Any]]


class ProfitOptimizationEngine:
    """
    AI-Powered Dynamic Profit Optimization Engine
    
    Implements intelligent optimization algorithms considering:
    - Market conditions and demand patterns
    - User behavior and personalization
    - Competitive positioning
    - Operational constraints
    - Multi-objective optimization
    """
    
    def __init__(self):
        """Initialize the optimization engine."""
        self.service_types = [st.value for st in ServiceType]
        self.premium_tiers = [pt.value for pt in PremiumTier]
        
        # Base prices for each service type
        self.base_prices = {
            "RIDE": 15.0,
            "MOTO": 8.0,
            "FOOD": 12.0,
            "GROCERY": 10.0,
            "GOODS": 18.0,
            "TRUCK_VAN": 35.0
        }
        
        # Premium tier multipliers
        self.tier_multipliers = {
            "BRONZE": 1.3,
            "SILVER": 1.5,
            "GOLD": 2.0,
            "PLATINUM": 2.5
        }
        
        # Optimization weights for different objectives
        self.optimization_weights = {
            OptimizationObjective.MAXIMIZE_PROFIT: {
                "revenue": 0.4,
                "profit_margin": 0.4,
                "user_satisfaction": 0.1,
                "operational_efficiency": 0.1
            },
            OptimizationObjective.MAXIMIZE_REVENUE: {
                "revenue": 0.6,
                "profit_margin": 0.2,
                "user_satisfaction": 0.1,
                "operational_efficiency": 0.1
            },
            OptimizationObjective.MAXIMIZE_USER_SATISFACTION: {
                "revenue": 0.1,
                "profit_margin": 0.1,
                "user_satisfaction": 0.6,
                "operational_efficiency": 0.2
            },
            OptimizationObjective.BALANCED: {
                "revenue": 0.3,
                "profit_margin": 0.3,
                "user_satisfaction": 0.2,
                "operational_efficiency": 0.2
            }
        }
    
    def calculate_demand_multiplier(
        self,
        market_conditions: MarketConditions,
        service_type: str
    ) -> float:
        """
        Calculate demand-based pricing multiplier.
        
        Args:
            market_conditions: Current market conditions
            service_type: Service type
            
        Returns:
            Demand multiplier (0.5 - 3.0)
        """
        # Base multiplier on demand level
        demand_multiplier = 1.0 + (market_conditions.demand_level - 0.5) * 2.0
        
        # Adjust for supply level (lower supply = higher prices)
        supply_factor = 1.0 + (1.0 - market_conditions.supply_level) * 0.5
        
        # Time-based adjustments
        time_multiplier = 1.0
        if 7 <= market_conditions.time_of_day < 9:  # Morning rush
            time_multiplier = 1.3
        elif 17 <= market_conditions.time_of_day < 19:  # Evening rush
            time_multiplier = 1.4
        elif 22 <= market_conditions.time_of_day or market_conditions.time_of_day < 6:  # Night
            time_multiplier = 1.2
        
        # Weekend adjustment
        if market_conditions.day_of_week >= 5:  # Weekend
            time_multiplier *= 1.1
        
        # Holiday adjustment
        if market_conditions.is_holiday:
            time_multiplier *= 1.2
        
        # Weather impact (bad weather = higher demand for rides, lower for food)
        if service_type in ["RIDE", "MOTO"]:
            weather_multiplier = 1.0 + abs(market_conditions.weather_impact) * 0.3
        else:
            weather_multiplier = 1.0 - market_conditions.weather_impact * 0.2
        
        # Event impact
        event_multiplier = 1.0 + market_conditions.event_impact * 0.5
        
        # Combine all factors
        total_multiplier = (
            demand_multiplier *
            supply_factor *
            time_multiplier *
            weather_multiplier *
            event_multiplier
        )
        
        # Clamp to reasonable range
        total_multiplier = max(0.5, min(3.0, total_multiplier))
        
        return total_multiplier
    
    def calculate_competitive_multiplier(
        self,
        market_conditions: MarketConditions,
        service_type: str
    ) -> float:
        """
        Calculate competitive pricing multiplier.
        
        Args:
            market_conditions: Current market conditions
            service_type: Service type
            
        Returns:
            Competitive multiplier (0.8 - 1.2)
        """
        if service_type not in market_conditions.competitor_pricing:
            return 1.0
        
        competitor_price = market_conditions.competitor_pricing[service_type]
        base_price = self.base_prices.get(service_type, 10.0)
        
        # Calculate price ratio
        price_ratio = competitor_price / base_price
        
        # Adjust to be competitive but profitable
        if price_ratio < 0.9:
            # Competitor is cheaper, match slightly above
            multiplier = price_ratio * 1.05
        elif price_ratio > 1.1:
            # Competitor is more expensive, stay competitive
            multiplier = price_ratio * 0.95
        else:
            # Prices are similar
            multiplier = 1.0
        
        # Clamp to reasonable range
        multiplier = max(0.8, min(1.2, multiplier))
        
        return multiplier
    
    def calculate_user_multiplier(
        self,
        user_profile: UserProfile,
        service_type: str
    ) -> float:
        """
        Calculate user-based pricing multiplier for personalization.
        
        Args:
            user_profile: User profile
            service_type: Service type
            
        Returns:
            User multiplier (0.7 - 1.5)
        """
        multiplier = 1.0
        
        # Tier-based adjustment
        if user_profile.user_tier:
            tier_multiplier = self.tier_multipliers.get(user_profile.user_tier.value, 1.0)
            multiplier *= tier_multiplier
        
        # Price sensitivity adjustment
        if user_profile.price_sensitivity > 0.7:
            # Highly price-sensitive user
            multiplier *= 0.85
        elif user_profile.price_sensitivity < 0.3:
            # Not price-sensitive
            multiplier *= 1.15
        
        # Loyalty adjustment (loyal users get better prices)
        if user_profile.loyalty_score > 0.8:
            multiplier *= 0.9
        elif user_profile.loyalty_score < 0.3:
            multiplier *= 1.1
        
        # Churn risk adjustment (high churn risk = better prices)
        if user_profile.churn_risk > 0.7:
            multiplier *= 0.85
        
        # Monetization propensity adjustment
        if user_profile.monetization_propensity > 0.8:
            # High propensity to monetize
            multiplier *= 1.1
        elif user_profile.monetization_propensity < 0.3:
            # Low propensity
            multiplier *= 0.9
        
        # Order frequency adjustment (frequent users get better prices)
        if user_profile.order_frequency > 5.0:
            multiplier *= 0.9
        elif user_profile.order_frequency < 1.0:
            multiplier *= 1.1
        
        # Clamp to reasonable range
        multiplier = max(0.7, min(1.5, multiplier))
        
        return multiplier
    
    def calculate_optimal_price(
        self,
        service_type: str,
        market_conditions: MarketConditions,
        user_profile: Optional[UserProfile] = None,
        objective: OptimizationObjective = OptimizationObjective.BALANCED
    ) -> OptimizationResult:
        """
        Calculate optimal price for a service.
        
        Args:
            service_type: Service type
            market_conditions: Current market conditions
            user_profile: Optional user profile for personalization
            objective: Optimization objective
            
        Returns:
            Optimization result with recommended price and factors
        """
        # Get base price
        base_price = self.base_prices.get(service_type, 10.0)
        
        # Calculate multipliers
        demand_multiplier = self.calculate_demand_multiplier(market_conditions, service_type)
        competitive_multiplier = self.calculate_competitive_multiplier(market_conditions, service_type)
        
        if user_profile:
            user_multiplier = self.calculate_user_multiplier(user_profile, service_type)
        else:
            user_multiplier = 1.0
        
        # Get optimization weights
        weights = self.optimization_weights.get(objective, self.optimization_weights[OptimizationObjective.BALANCED])
        
        # Calculate weighted multiplier
        weighted_multiplier = (
            weights["revenue"] * demand_multiplier +
            weights["profit_margin"] * competitive_multiplier +
            weights["user_satisfaction"] * user_multiplier +
            weights["operational_efficiency"] * 1.0
        )
        
        # Calculate recommended price
        recommended_price = base_price * weighted_multiplier
        
        # Round to 2 decimal places
        recommended_price = round(recommended_price, 2)
        
        # Calculate expected revenue and profit
        expected_revenue = recommended_price
        expected_profit = expected_revenue * 0.3  # 30% profit margin
        
        # Calculate confidence score based on data quality
        confidence_score = self._calculate_confidence_score(
            market_conditions,
            user_profile
        )
        
        # Calculate optimization factors
        optimization_factors = {
            "demand_multiplier": demand_multiplier,
            "competitive_multiplier": competitive_multiplier,
            "user_multiplier": user_multiplier,
            "weighted_multiplier": weighted_multiplier,
            "base_price": base_price
        }
        
        # Generate alternative options
        alternative_options = self._generate_alternatives(
            base_price,
            recommended_price,
            market_conditions,
            user_profile
        )
        
        return OptimizationResult(
            recommended_price=recommended_price,
            expected_revenue=expected_revenue,
            expected_profit=expected_profit,
            confidence_score=confidence_score,
            optimization_factors=optimization_factors,
            alternative_options=alternative_options
        )
    
    def _calculate_confidence_score(
        self,
        market_conditions: MarketConditions,
        user_profile: Optional[UserProfile]
    ) -> float:
        """
        Calculate confidence score for optimization result.
        
        Args:
            market_conditions: Current market conditions
            user_profile: Optional user profile
            
        Returns:
            Confidence score (0-1)
        """
        confidence = 0.5  # Base confidence
        
        # Increase confidence if we have good market data
        if market_conditions.demand_level > 0:
            confidence += 0.1
        if market_conditions.supply_level > 0:
            confidence += 0.1
        if market_conditions.competitor_pricing:
            confidence += 0.1
        
        # Increase confidence if we have user data
        if user_profile:
            if user_profile.order_frequency > 0:
                confidence += 0.1
            if user_profile.lifetime_value > 0:
                confidence += 0.1
        
        # Clamp to 0-1
        confidence = max(0.0, min(1.0, confidence))
        
        return confidence
    
    def _generate_alternatives(
        self,
        base_price: float,
        recommended_price: float,
        market_conditions: MarketConditions,
        user_profile: Optional[UserProfile]
    ) -> List[Dict[str, Any]]:
        """
        Generate alternative pricing options.
        
        Args:
            base_price: Base price
            recommended_price: Recommended price
            market_conditions: Current market conditions
            user_profile: Optional user profile
            
        Returns:
            List of alternative options
        """
        alternatives = []
        
        # Conservative option (lower price, higher volume)
        conservative_price = recommended_price * 0.9
        alternatives.append({
            "option": "conservative",
            "price": round(conservative_price, 2),
            "expected_volume_increase": 0.15,
            "expected_revenue_change": 0.03,
            "risk": "low"
        })
        
        # Aggressive option (higher price, lower volume)
        aggressive_price = recommended_price * 1.1
        alternatives.append({
            "option": "aggressive",
            "price": round(aggressive_price, 2),
            "expected_volume_decrease": 0.1,
            "expected_revenue_change": -0.01,
            "risk": "high"
        })
        
        # Balanced option (recommended price)
        alternatives.append({
            "option": "balanced",
            "price": recommended_price,
            "expected_volume_change": 0.0,
            "expected_revenue_change": 0.0,
            "risk": "medium"
        })
        
        return alternatives
    
    def optimize_resource_allocation(
        self,
        market_conditions: MarketConditions,
        available_resources: Dict[str, int],
        demand_forecast: Dict[str, int]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Optimize resource allocation across service types.
        
        Args:
            market_conditions: Current market conditions
            available_resources: Available resources by service type
            demand_forecast: Demand forecast by service type
            
        Returns:
            Optimized allocation recommendations
        """
        recommendations = {}
        
        for service_type in self.service_types:
            available = available_resources.get(service_type, 0)
            demand = demand_forecast.get(service_type, 0)
            
            # Calculate demand-supply ratio
            if available > 0:
                ratio = demand / available
            else:
                ratio = float('inf')
            
            # Calculate recommended allocation
            if ratio > 1.2:
                # High demand, need more resources
                action = "increase_allocation"
                recommended = min(available * 1.5, demand)
                priority = "high"
            elif ratio < 0.8:
                # Low demand, can reallocate resources
                action = "decrease_allocation"
                recommended = max(available * 0.7, demand)
                priority = "medium"
            else:
                # Balanced
                action = "maintain_allocation"
                recommended = available
                priority = "low"
            
            recommendations[service_type] = {
                "current_allocation": available,
                "demand_forecast": demand,
                "demand_supply_ratio": ratio,
                "recommended_allocation": int(recommended),
                "action": action,
                "priority": priority,
                "expected_impact": self._calculate_resource_impact(action, ratio)
            }
        
        return recommendations
    
    def _calculate_resource_impact(
        self,
        action: str,
        ratio: float
    ) -> Dict[str, float]:
        """
        Calculate expected impact of resource allocation change.
        
        Args:
            action: Action to take
            ratio: Demand-supply ratio
            
        Returns:
            Expected impact metrics
        """
        if action == "increase_allocation":
            return {
                "revenue_impact": 0.15,
                "profit_impact": 0.12,
                "user_satisfaction_impact": 0.1,
                "operational_cost_impact": 0.08
            }
        elif action == "decrease_allocation":
            return {
                "revenue_impact": -0.05,
                "profit_impact": 0.08,
                "user_satisfaction_impact": -0.03,
                "operational_cost_impact": -0.1
            }
        else:
            return {
                "revenue_impact": 0.0,
                "profit_impact": 0.0,
                "user_satisfaction_impact": 0.0,
                "operational_cost_impact": 0.0
            }


class UserMonetizationPredictor:
    """
    Predictive User Monetization System
    
    Predicts user monetization opportunities and optimal timing.
    """
    
    def __init__(self):
        """Initialize the predictor."""
        self.monetization_types = [
            "premium_subscription",
            "cross_sell",
            "up_sell",
            "promotional_offer",
            "loyalty_program"
        ]
    
    def predict_monetization_opportunity(
        self,
        user_profile: UserProfile,
        service_type: str,
        order_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Predict monetization opportunity for a user.
        
        Args:
            user_profile: User profile
            service_type: Service type
            order_history: User's order history
            
        Returns:
            Monetization prediction with recommendations
        """
        # Calculate monetization propensity score
        propensity_score = self._calculate_monetization_propensity(
            user_profile,
            order_history
        )
        
        # Determine optimal monetization type
        monetization_type = self._determine_monetization_type(
            user_profile,
            propensity_score
        )
        
        # Calculate optimal timing
        optimal_timing = self._calculate_optimal_timing(
            user_profile,
            order_history
        )
        
        # Generate personalized offer
        personalized_offer = self._generate_personalized_offer(
            user_profile,
            service_type,
            monetization_type,
            propensity_score
        )
        
        # Calculate expected conversion rate
        expected_conversion = self._calculate_expected_conversion(
            propensity_score,
            monetization_type,
            personalized_offer
        )
        
        return {
            "user_id": user_profile.user_id,
            "monetization_propensity": propensity_score,
            "monetization_type": monetization_type,
            "optimal_timing": optimal_timing,
            "personalized_offer": personalized_offer,
            "expected_conversion_rate": expected_conversion,
            "confidence_score": min(0.9, propensity_score + 0.1)
        }
    
    def _calculate_monetization_propensity(
        self,
        user_profile: UserProfile,
        order_history: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate monetization propensity score.
        
        Args:
            user_profile: User profile
            order_history: Order history
            
        Returns:
            Propensity score (0-1)
        """
        propensity = 0.0
        
        # Base propensity from user profile
        propensity += user_profile.monetization_propensity * 0.4
        
        # Order frequency contribution
        if user_profile.order_frequency > 3.0:
            propensity += 0.2
        elif user_profile.order_frequency > 1.0:
            propensity += 0.1
        
        # Average order value contribution
        if user_profile.avg_order_value > 20.0:
            propensity += 0.15
        elif user_profile.avg_order_value > 10.0:
            propensity += 0.1
        
        # Loyalty score contribution
        propensity += user_profile.loyalty_score * 0.15
        
        # Churn risk contribution (lower churn = higher propensity)
        propensity += (1.0 - user_profile.churn_risk) * 0.1
        
        # Clamp to 0-1
        propensity = max(0.0, min(1.0, propensity))
        
        return propensity
    
    def _determine_monetization_type(
        self,
        user_profile: UserProfile,
        propensity_score: float
    ) -> str:
        """
        Determine optimal monetization type.
        
        Args:
            user_profile: User profile
            propensity_score: Monetization propensity score
            
        Returns:
            Monetization type
        """
        # High propensity users get premium offers
        if propensity_score > 0.8:
            if user_profile.user_tier is None:
                return "premium_subscription"
            elif user_profile.user_tier == PremiumTier.BRONZE:
                return "up_sell"
            else:
                return "cross_sell"
        
        # Medium propensity users get promotional offers
        elif propensity_score > 0.5:
            return "promotional_offer"
        
        # Low propensity users get loyalty program offers
        else:
            return "loyalty_program"
    
    def _calculate_optimal_timing(
        self,
        user_profile: UserProfile,
        order_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate optimal timing for monetization offer.
        
        Args:
            user_profile: User profile
            order_history: Order history
            
        Returns:
            Optimal timing information
        """
        # Calculate time since last order
        if order_history:
            last_order_date = order_history[-1].get("date", datetime.now())
            time_since_last_order = (datetime.now() - last_order_date).days
        else:
            time_since_last_order = float('inf')
        
        # Determine optimal timing
        if time_since_last_order > 7:
            # User hasn't ordered in a week, good time for offer
            timing = "immediate"
            urgency = "high"
        elif time_since_last_order > 3:
            # User hasn't ordered in 3 days, moderate timing
            timing = "within_24_hours"
            urgency = "medium"
        else:
            # User ordered recently, wait a bit
            timing = "within_3_days"
            urgency = "low"
        
        return {
            "timing": timing,
            "urgency": urgency,
            "days_since_last_order": time_since_last_order,
            "recommended_contact_time": self._get_optimal_contact_time(user_profile)
        }
    
    def _get_optimal_contact_time(
        self,
        user_profile: UserProfile
    ) -> str:
        """
        Get optimal contact time for user.
        
        Args:
            user_profile: User profile
            
        Returns:
            Optimal contact time
        """
        # This would be based on user's historical engagement patterns
        # For now, return a reasonable default
        return "10:00 - 12:00"
    
    def _generate_personalized_offer(
        self,
        user_profile: UserProfile,
        service_type: str,
        monetization_type: str,
        propensity_score: float
    ) -> Dict[str, Any]:
        """
        Generate personalized monetization offer.
        
        Args:
            user_profile: User profile
            service_type: Service type
            monetization_type: Monetization type
            propensity_score: Propensity score
            
        Returns:
            Personalized offer details
        """
        offers = {
            "premium_subscription": {
                "title": "Unlock Premium Benefits",
                "description": "Get exclusive discounts, priority support, and more",
                "discount_percentage": 20,
                "trial_days": 14,
                "price": 9.99
            },
            "cross_sell": {
                "title": "Try Our Other Services",
                "description": "Get 15% off your first order on other services",
                "discount_percentage": 15,
                "valid_days": 7
            },
            "up_sell": {
                "title": "Upgrade Your Experience",
                "description": "Get 25% off premium tier upgrade",
                "discount_percentage": 25,
                "valid_days": 14
            },
            "promotional_offer": {
                "title": "Special Offer Just For You",
                "description": "Get 10% off your next order",
                "discount_percentage": 10,
                "valid_days": 3
            },
            "loyalty_program": {
                "title": "Join Our Loyalty Program",
                "description": "Earn points and rewards on every order",
                "points_per_order": 100,
                "redemption_value": 0.01
            }
        }
        
        offer = offers.get(monetization_type, offers["promotional_offer"])
        
        # Personalize based on user profile
        if user_profile.price_sensitivity > 0.7:
            offer["discount_percentage"] = min(offer.get("discount_percentage", 10) + 5, 30)
        
        return offer
    
    def _calculate_expected_conversion(
        self,
        propensity_score: float,
        monetization_type: str,
        personalized_offer: Dict[str, Any]
    ) -> float:
        """
        Calculate expected conversion rate.
        
        Args:
            propensity_score: Monetization propensity score
            monetization_type: Monetization type
            personalized_offer: Personalized offer
            
        Returns:
            Expected conversion rate (0-1)
        """
        # Base conversion rate
        base_conversion = {
            "premium_subscription": 0.15,
            "cross_sell": 0.25,
            "up_sell": 0.20,
            "promotional_offer": 0.30,
            "loyalty_program": 0.40
        }.get(monetization_type, 0.20)
        
        # Adjust by propensity score
        conversion = base_conversion * (0.5 + propensity_score)
        
        # Adjust by discount percentage
        discount = personalized_offer.get("discount_percentage", 0)
        conversion *= (1.0 + discount * 0.01)
        
        # Clamp to 0-1
        conversion = max(0.0, min(1.0, conversion))
        
        return conversion


class RevenueCaptureOptimizer:
    """
    Autonomous Revenue Capture System
    
    Automatically identifies and captures revenue opportunities.
    """
    
    def __init__(self):
        """Initialize the optimizer."""
        self.fee_types = {
            "base_fee": 0.10,  # 10% base fee
            "service_fee": 0.05,  # 5% service fee
            "peak_fee": 0.15,  # 15% peak fee
            "surge_fee": 0.25  # 25% surge fee
        }
    
    def optimize_fees(
        self,
        market_conditions: MarketConditions,
        service_type: str,
        order_value: float
    ) -> Dict[str, Any]:
        """
        Optimize fees for an order.
        
        Args:
            market_conditions: Current market conditions
            service_type: Service type
            order_value: Order value
            
        Returns:
            Optimized fee structure
        """
        # Calculate base fee
        base_fee = order_value * self.fee_types["base_fee"]
        
        # Calculate service fee
        service_fee = order_value * self.fee_types["service_fee"]
        
        # Calculate peak fee if applicable
        peak_fee = 0.0
        if self._is_peak_time(market_conditions):
            peak_fee = order_value * self.fee_types["peak_fee"]
        
        # Calculate surge fee if applicable
        surge_fee = 0.0
        if self._is_surge_time(market_conditions):
            surge_fee = order_value * self.fee_types["surge_fee"]
        
        # Calculate total fees
        total_fees = base_fee + service_fee + peak_fee + surge_fee
        
        # Calculate net revenue
        net_revenue = order_value - total_fees
        
        return {
            "order_value": order_value,
            "base_fee": base_fee,
            "service_fee": service_fee,
            "peak_fee": peak_fee,
            "surge_fee": surge_fee,
            "total_fees": total_fees,
            "net_revenue": net_revenue,
            "fee_percentage": (total_fees / order_value) * 100
        }
    
    def _is_peak_time(
        self,
        market_conditions: MarketConditions
    ) -> bool:
        """
        Determine if current time is peak time.
        
        Args:
            market_conditions: Current market conditions
            
        Returns:
            True if peak time
        """
        hour = market_conditions.time_of_day
        
        # Peak hours: 7-9 AM and 5-7 PM
        return (7 <= hour < 9) or (17 <= hour < 19)
    
    def _is_surge_time(
        self,
        market_conditions: MarketConditions
    ) -> bool:
        """
        Determine if current time is surge time.
        
        Args:
            market_conditions: Current market conditions
            
        Returns:
            True if surge time
        """
        # Surge time when demand is high and supply is low
        return (
            market_conditions.demand_level > 0.7 and
            market_conditions.supply_level < 0.5
        )


# Example usage
if __name__ == "__main__":
    # Create optimization engine
    engine = ProfitOptimizationEngine()
    
    # Create market conditions
    market_conditions = MarketConditions(
        demand_level=0.8,
        supply_level=0.6,
        competitor_pricing={"RIDE": 18.0, "FOOD": 14.0},
        time_of_day=18,
        day_of_week=4,
        is_holiday=False,
        weather_impact=-0.2,
        event_impact=0.3
    )
    
    # Create user profile
    user_profile = UserProfile(
        user_id="user_12345",
        user_tier=PremiumTier.GOLD,
        avg_order_value=25.0,
        order_frequency=3.5,
        churn_risk=0.2,
        monetization_propensity=0.85,
        price_sensitivity=0.3,
        loyalty_score=0.9,
        behavior_segment="high_value",
        lifetime_value=500.0
    )
    
    # Calculate optimal price
    result = engine.calculate_optimal_price(
        service_type="RIDE",
        market_conditions=market_conditions,
        user_profile=user_profile,
        objective=OptimizationObjective.BALANCED
    )
    
    print("="*60)
    print("Profit Optimization Result")
    print("="*60)
    print(f"\nService Type: RIDE")
    print(f"Recommended Price: ${result.recommended_price:.2f}")
    print(f"Expected Revenue: ${result.expected_revenue:.2f}")
    print(f"Expected Profit: ${result.expected_profit:.2f}")
    print(f"Confidence Score: {result.confidence_score:.2f}")
    print(f"\nOptimization Factors:")
    for factor, value in result.optimization_factors.items():
        print(f"  {factor}: {value:.4f}")
    print(f"\nAlternative Options:")
    for option in result.alternative_options:
        print(f"  {option['option']}: ${option['price']:.2f} (Risk: {option['risk']})")
    
    # Test monetization predictor
    predictor = UserMonetizationPredictor()
    
    order_history = [
        {"date": datetime.now() - timedelta(days=5), "value": 20.0, "service": "RIDE"},
        {"date": datetime.now() - timedelta(days=10), "value": 25.0, "service": "FOOD"},
        {"date": datetime.now() - timedelta(days=15), "value": 18.0, "service": "RIDE"}
    ]
    
    monetization_result = predictor.predict_monetization_opportunity(
        user_profile=user_profile,
        service_type="RIDE",
        order_history=order_history
    )
    
    print("\n" + "="*60)
    print("User Monetization Prediction")
    print("="*60)
    print(f"\nUser ID: {monetization_result['user_id']}")
    print(f"Monetization Propensity: {monetization_result['monetization_propensity']:.2f}")
    print(f"Monetization Type: {monetization_result['monetization_type']}")
    print(f"Optimal Timing: {monetization_result['optimal_timing']['timing']}")
    print(f"Urgency: {monetization_result['optimal_timing']['urgency']}")
    print(f"\nPersonalized Offer:")
    offer = monetization_result['personalized_offer']
    print(f"  Title: {offer['title']}")
    print(f"  Description: {offer['description']}")
    print(f"  Discount: {offer.get('discount_percentage', 0)}%")
    print(f"\nExpected Conversion Rate: {monetization_result['expected_conversion_rate']:.2%}")
    print(f"Confidence Score: {monetization_result['confidence_score']:.2f}")
    
    # Test revenue capture optimizer
    optimizer = RevenueCaptureOptimizer()
    
    fee_result = optimizer.optimize_fees(
        market_conditions=market_conditions,
        service_type="RIDE",
        order_value=25.0
    )
    
    print("\n" + "="*60)
    print("Revenue Capture Optimization")
    print("="*60)
    print(f"\nOrder Value: ${fee_result['order_value']:.2f}")
    print(f"Base Fee: ${fee_result['base_fee']:.2f}")
    print(f"Service Fee: ${fee_result['service_fee']:.2f}")
    print(f"Peak Fee: ${fee_result['peak_fee']:.2f}")
    print(f"Surge Fee: ${fee_result['surge_fee']:.2f}")
    print(f"Total Fees: ${fee_result['total_fees']:.2f}")
    print(f"Net Revenue: ${fee_result['net_revenue']:.2f}")
    print(f"Fee Percentage: {fee_result['fee_percentage']:.1f}%")
