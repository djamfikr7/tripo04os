import { Injectable } from '@nestjs/common';

export interface Rating {
  id: string;
  raterId: string;
  ratedId: string;
  tripId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface UserReputation {
  userId: string;
  averageRating: number;
  totalRatings: number;
  totalTrips: number;
}

@Injectable()
export class ReputationService {
  private ratings: Map<string, Rating[]> = new Map();
  private reputations: Map<string, UserReputation> = new Map();

  calculateReputation(userId: string): UserReputation {
    const userRatings = this.ratings.get(userId) || [];
    
    if (userRatings.length === 0) {
      return {
        userId,
        averageRating: 0,
        totalRatings: 0,
        totalTrips: 0,
      };
    }

    const sum = userRatings.reduce((acc, rating) => acc + rating.rating, 0);
    const averageRating = sum / userRatings.length;

    return {
      userId,
      averageRating: Number(averageRating.toFixed(2)),
      totalRatings: userRatings.length,
      totalTrips: userRatings.length,
    };
  }

  addRating(rating: Omit<Rating, 'id' | 'createdAt'>): Rating {
    const newRating: Rating = {
      ...rating,
      id: this.generateId(),
      createdAt: new Date(),
    };

    const userRatings = this.ratings.get(rating.ratedId) || [];
    userRatings.push(newRating);
    this.ratings.set(rating.ratedId, userRatings);

    const reputation = this.calculateReputation(rating.ratedId);
    this.reputations.set(rating.ratedId, reputation);

    return newRating;
  }

  getUserRatings(userId: string): Rating[] {
    return this.ratings.get(userId) || [];
  }

  getUserReputation(userId: string): UserReputation | null {
    return this.reputations.get(userId) || null;
  }

  getTopUsers(limit: number = 10): UserReputation[] {
    return Array.from(this.reputations.values())
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }

  private generateId(): string {
    return `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
