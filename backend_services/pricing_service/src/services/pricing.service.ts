import { Injectable } from '@nestjs/common';
import { PricingRequest, PricingResponse, BasePricing, SurgePricing, TimeOfDay } from '../models/pricing-request';

@Injectable()
export class PricingService {
  private basePricing: Map<string, BasePricing>;
  private surgePricing: Map<string, SurgePricing>;
  private timeOfDaySettings: Map<string, TimeOfDay[]>;

  constructor() {
    this.initializePricingConfig();
  }

  calculatePricing(request: PricingRequest): PricingResponse {
    const baseFare = this.calculateBaseFare(request);
    const surgeMultiplier = this.calculateSurgeMultiplier(request, baseFare);
    const totalFare = baseFare * surgeMultiplier;
    const finalFare = this.applyPremiumDiscount(totalFare, request);

    return {
      order_id: request.order_id,
      base_fare: Number(baseFare.toFixed(2)),
      surge_multiplier: Number(surgeMultiplier.toFixed(2)),
      total_fare: Number(totalFare.toFixed(2)),
      final_fare: Number(finalFare.toFixed(2)),
      breakdown: {
        distance_fare: Number((request.distance_km * this.getBasePricing(request).base_fare_per_km).toFixed(2)),
        time_fare: Number((request.estimated_duration_minutes * this.getBasePricing(request).cost_per_minute).toFixed(2)),
        booking_fee: Number(this.getBasePricing(request).booking_fee),
        service_fee: Number((totalFare * (this.getBasePricing(request).service_fee_percent / 100)).toFixed(2)),
      },
    };
  }

  private calculateBaseFare(request: PricingRequest): number {
    const pricing = this.getBasePricing(request);
    const distanceFare = request.distance_km * pricing.base_fare_per_km;
    const timeFare = request.estimated_duration_minutes * pricing.cost_per_minute;
    const subtotal = distanceFare + timeFare + pricing.booking_fee;

    return Math.max(subtotal, pricing.minimum_fare);
  }

  private calculateSurgeMultiplier(request: PricingRequest, baseFare: number): number {
    const surgePricing = this.surgePricing.get(request.vertical);
    if (!surgePricing) {
      return 1.0;
    }

    const timeOfDay = this.getTimeOfDay();
    const baseMultiplier = this.getBaseMultiplierForTime(timeOfDay, request.vertical);

    return baseMultiplier;
  }

  private applyPremiumDiscount(totalFare: number, request: PricingRequest): number {
    if (request.is_premium_user) {
      return totalFare * 0.9;
    }
    return totalFare;
  }

  private getBasePricing(request: PricingRequest): BasePricing {
    return this.basePricing.get(request.vertical) || this.basePricing.get('RIDE');
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();

    if (hour >= 7 && hour < 10) {
      return 'PEAK_HOUR';
    } else if (hour >= 17 && hour < 20) {
      return 'PEAK_HOUR';
    } else if (hour >= 0 && hour < 5) {
      return 'OFF_PEAK_HOUR';
    } else {
      return 'NORMAL_HOUR';
    }
  }

  private getBaseMultiplierForTime(timeOfDay: string, vertical: string): number {
    const settings = this.timeOfDaySettings.get(vertical) || [];

    for (const setting of settings) {
      if (setting.name === timeOfDay) {
        return setting.base_multiplier;
      }
    }

    return 1.0;
  }

  private initializePricingConfig(): void {
    this.basePricing = new Map([
      ['RIDE', {
        base_fare_per_km: 0.50,
        cost_per_minute: 0.15,
        minimum_fare: 3.00,
        booking_fee: 1.50,
        service_fee_percent: 10.0,
      }],
      ['MOTO', {
        base_fare_per_km: 0.30,
        cost_per_minute: 0.10,
        minimum_fare: 2.00,
        booking_fee: 1.00,
        service_fee_percent: 10.0,
      }],
      ['FOOD', {
        base_fare_per_km: 0.40,
        cost_per_minute: 0.12,
        minimum_fare: 2.50,
        booking_fee: 1.00,
        service_fee_percent: 15.0,
      }],
      ['GROCERY', {
        base_fare_per_km: 0.35,
        cost_per_minute: 0.12,
        minimum_fare: 2.00,
        booking_fee: 0.75,
        service_fee_percent: 12.0,
      }],
      ['GOODS', {
        base_fare_per_km: 0.60,
        cost_per_minute: 0.20,
        minimum_fare: 5.00,
        booking_fee: 2.00,
        service_fee_percent: 15.0,
      }],
      ['TRUCK_VAN', {
        base_fare_per_km: 1.00,
        cost_per_minute: 0.30,
        minimum_fare: 10.00,
        booking_fee: 3.00,
        service_fee_percent: 20.0,
      }],
    ]);

    this.surgePricing = new Map([
      ['RIDE', {
        demand_multiplier_low: 1.2,
        demand_multiplier_high: 2.5,
        demand_threshold: 100,
        surge_decay_rate: 0.1,
        surge_duration_minutes: 30,
      }],
      ['MOTO', {
        demand_multiplier_low: 1.2,
        demand_multiplier_high: 2.5,
        demand_threshold: 50,
        surge_decay_rate: 0.1,
        surge_duration_minutes: 30,
      }],
    ]);

    this.timeOfDaySettings = new Map([
      ['RIDE', [
        { name: 'PEAK_HOUR', base_multiplier: 1.5 },
        { name: 'NORMAL_HOUR', base_multiplier: 1.0 },
        { name: 'OFF_PEAK_HOUR', base_multiplier: 0.8 },
      ]],
      ['MOTO', [
        { name: 'PEAK_HOUR', base_multiplier: 1.3 },
        { name: 'NORMAL_HOUR', base_multiplier: 1.0 },
        { name: 'OFF_PEAK_HOUR', base_multiplier: 0.8 },
      ]],
    ]);
  }
}
