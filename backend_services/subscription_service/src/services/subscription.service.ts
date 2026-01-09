import { Injectable } from '@nestjs/common';

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'BASIC' | 'PREMIUM' | 'UNLIMITED';
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: string[];
  discountPercentage: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface UsageTracking {
  userId: string;
  planId: string;
  ridesTaken: number;
  ridesLimit: number;
  currentMonth: string;
}

@Injectable()
export class SubscriptionService {
  private plans: SubscriptionPlan[] = [
    {
      id: 'basic-monthly',
      name: 'Basic Monthly',
      type: 'BASIC',
      price: 9.99,
      billingCycle: 'MONTHLY',
      features: ['Unlimited rides', '5% service fee discount', 'Priority support'],
      discountPercentage: 5,
    },
    {
      id: 'basic-yearly',
      name: 'Basic Yearly',
      type: 'BASIC',
      price: 99.99,
      billingCycle: 'YEARLY',
      features: ['Unlimited rides', '5% service fee discount', 'Priority support', '2 months free'],
      discountPercentage: 5,
    },
    {
      id: 'premium-monthly',
      name: 'Premium Monthly',
      type: 'PREMIUM',
      price: 19.99,
      billingCycle: 'MONTHLY',
      features: [
        'Unlimited rides',
        '10% service fee discount',
        'Priority matching',
        'Exclusive discounts',
        '24/7 support',
      ],
      discountPercentage: 10,
    },
    {
      id: 'premium-yearly',
      name: 'Premium Yearly',
      type: 'PREMIUM',
      price: 199.99,
      billingCycle: 'YEARLY',
      features: [
        'Unlimited rides',
        '10% service fee discount',
        'Priority matching',
        'Exclusive discounts',
        '24/7 support',
        '3 months free',
      ],
      discountPercentage: 10,
    },
    {
      id: 'unlimited-monthly',
      name: 'Unlimited Monthly',
      type: 'UNLIMITED',
      price: 29.99,
      billingCycle: 'MONTHLY',
      features: [
        'Zero service fees',
        'Priority matching (top 5%)',
        'Exclusive driver access',
        'VIP support',
        'Monthly ride reports',
      ],
      discountPercentage: 0,
    },
    {
      id: 'unlimited-yearly',
      name: 'Unlimited Yearly',
      type: 'UNLIMITED',
      price: 299.99,
      billingCycle: 'YEARLY',
      features: [
        'Zero service fees',
        'Priority matching (top 5%)',
        'Exclusive driver access',
        'VIP support',
        'Monthly ride reports',
        '4 months free',
      ],
      discountPercentage: 0,
    },
  ];

  private subscriptions: Map<string, UserSubscription> = new Map();
  private usage: Map<string, UsageTracking> = new Map();

  getAvailablePlans(): SubscriptionPlan[] {
    return this.plans;
  }

  getPlanById(planId: string): SubscriptionPlan | null {
    return this.plans.find((plan) => plan.id === planId) || null;
  }

  subscribe(
    userId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
  ): UserSubscription {
    const plan = this.getPlanById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const subscription: UserSubscription = {
      id: this.generateId(),
      userId,
      planId: this.generateId(),
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: this.calculateEndDate(billingCycle),
      autoRenew: true,
    };

    this.subscriptions.set(subscription.id, subscription);

    const usage: UsageTracking = {
      userId,
      planId: subscription.id,
      ridesTaken: 0,
      ridesLimit: plan.type === 'UNLIMITED' ? Infinity : 50,
      currentMonth: new Date().toISOString().substring(0, 7),
    };

    this.usage.set(userId, usage);

    return subscription;
  }

  getUserSubscription(userId: string): UserSubscription | null {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.userId === userId && subscription.status === 'ACTIVE') {
        return subscription;
      }
    }
    return null;
  }

  cancelSubscription(subscriptionId: string): UserSubscription | null {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return null;
    }

    subscription.status = 'CANCELLED';
    subscription.endDate = new Date();

    return subscription;
  }

  trackRideUsage(userId: string): UsageTracking | null {
    const usage = this.usage.get(userId);
    if (!usage) {
      return null;
    }

    usage.ridesTaken++;
    return usage;
  }

  getUserUsage(userId: string): UsageTracking | null {
    return this.usage.get(userId) || null;
  }

  private calculateEndDate(billingCycle: 'MONTHLY' | 'YEARLY'): Date {
    const now = new Date();
    if (billingCycle === 'MONTHLY') {
      now.setMonth(now.getMonth() + 1);
    } else {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now;
  }

  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
