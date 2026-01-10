import { apiClient, REPUTATION_SERVICE_URL } from './api';

// Reputation Types
export interface Rating {
  id: string;
  userId: string;
  raterId: string;
  orderId: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface ReputationProfile {
  id: string;
  userId: string;
  overallRating: number;
  totalRatings: number;
  reliabilityScore: number;
  punctualityScore: number;
  communicationScore: number;
  vehicleScore: number;
  behaviorScore: number;
  trustScore: number;
  role: 'RIDER' | 'DRIVER';
}

export interface RatingFilters {
  userId?: string;
  raterId?: string;
  minScore?: number;
  maxScore?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

// Reputation API Service
export const reputationApi = {
  // Get reputation profile for user
  getReputationProfile: async (userId: string): Promise<ReputationProfile> => {
    const response = await apiClient.get(`${REPUTATION_SERVICE_URL}/api/v1/reputation/${userId}/profile`);
    return response.data;
  },

  // Get all reputation profiles
  getAllProfiles: async (filters: any = {}): Promise<ReputationProfile[]> => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.minTrustScore) params.append('min_trust_score', filters.minTrustScore);
    if (filters.maxTrustScore) params.append('max_trust_score', filters.maxTrustScore);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${REPUTATION_SERVICE_URL}/api/v1/reputation/profiles?${params}`);
    return response.data;
  },

  // Get ratings for user
  getUserRatings: async (userId: string, filters: RatingFilters = {}): Promise<Rating[]> => {
    const params = new URLSearchParams();
    if (filters.minScore) params.append('min_score', filters.minScore.toString());
    if (filters.maxScore) params.append('max_score', filters.maxScore.toString());
    if (filters.fromDate) params.append('from_date', filters.fromDate);
    if (filters.toDate) params.append('to_date', filters.toDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${REPUTATION_SERVICE_URL}/api/v1/reputation/${userId}/ratings?${params}`);
    return response.data;
  },

  // Create rating
  createRating: async (rating: Partial<Rating>): Promise<Rating> => {
    const response = await apiClient.post(`${REPUTATION_SERVICE_URL}/api/v1/reputation/ratings`, rating);
    return response.data;
  },

  // Delete rating
  deleteRating: async (ratingId: string): Promise<void> => {
    await apiClient.delete(`${REPUTATION_SERVICE_URL}/api/v1/reputation/ratings/${ratingId}`);
  },

  // Get top rated users
  getTopRatedUsers: async (role: 'RIDER' | 'DRIVER', limit: number = 10): Promise<ReputationProfile[]> => {
    const response = await apiClient.get(`${REPUTATION_SERVICE_URL}/api/v1/reputation/top-rated?role=${role}&limit=${limit}`);
    return response.data;
  },

  // Get aggregated statistics
  getAggregatedStats: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`${REPUTATION_SERVICE_URL}/api/v1/reputation/${userId}/stats`);
    return response.data;
  },
};
