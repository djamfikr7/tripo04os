export enum Vertical {
  RIDE = "RIDE",
  MOTO = "MOTO",
  FOOD = "FOOD",
  GROCERY = "GROCERY",
  GOODS = "GOODS",
  TRUCK_VAN = "TRUCK_VAN",
}

export enum RideType {
  SOLO = "SOLO",
  SHARED = "SHARED",
  SCHEDULED = "SCHEDULED",
  LONG_DISTANCE = "LONG_DISTANCE",
  CORPORATE = "CORPORATE",
  WOMEN_ONLY = "WOMEN_ONLY",
}

export enum TimeOfDay {
  PEAK_HOUR = "PEAK_HOUR",
  NORMAL_HOUR = "NORMAL_HOUR",
  OFF_PEAK_HOUR = "OFF_PEAK_HOUR",
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface BasePricing {
  base_fare_per_km: number;
  minimum_fare: number;
  cost_per_minute: number;
  booking_fee: number;
  service_fee_percent: number;
}

export interface SurgePricing {
  demand_multiplier_low: number;
  demand_multiplier_high: number;
  demand_threshold: number;
  surge_decay_rate: number;
  surge_duration_minutes: number;
}

export interface PricingRequest {
  order_id: string;
  vertical: Vertical;
  product: string;
  ride_type: RideType;
  pickup_location: Location;
  destination_location: Location;
  distance_km: number;
  estimated_duration_minutes: number;
  time_of_day: TimeOfDay;
  is_premium_user: boolean;
  is_shared_ride: boolean;
  scheduled_pickup_time?: Date;
}

export interface PricingResponse {
  order_id: string;
  base_fare: number;
  surge_multiplier: number;
  total_fare: number;
  final_fare: number;
  breakdown: Record<string, any>;
}
