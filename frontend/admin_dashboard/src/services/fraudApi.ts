import { apiClient, FRAUD_SERVICE_URL } from './api';

// Fraud Types
export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  fraudType: 'RATING_MANIPULATION' | 'FAKE_TRIPS' | 'ACCOUNT_TAKEOVER' | 'PAYMENT_FRAUD' | 'BOT_ACTIVITY' | 'REVIEW_MANIPULATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  description: string;
  metadata?: any;
}

export interface FraudReport {
  id: string;
  reportedUserId: string;
  reportedBy: string;
  reason: string;
  fraudType: string;
  evidence?: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  resolutionNotes?: string;
}

export interface UserRiskProfile {
  id: string;
  userId: string;
  userName: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fraudAlertCount: number;
  lastAlertAt?: string;
  totalFraudReports: number;
  createdAt: string;
  updatedAt: string;
}

export interface FraudFilters {
  userId?: string;
  fraudType?: string;
  severity?: string;
  status?: string;
  riskLevel?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

// Fraud API Service
export const fraudApi = {
  // Get all fraud alerts
  getFraudAlerts: async (filters: FraudFilters = {}): Promise<FraudAlert[]> => {
    const params = new URLSearchParams();
    if (filters.userId) params.append('user_id', filters.userId);
    if (filters.fraudType) params.append('fraud_type', filters.fraudType);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.fromDate) params.append('from_date', filters.fromDate);
    if (filters.toDate) params.append('to_date', filters.toDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${FRAUD_SERVICE_URL}/api/v1/fraud/alerts?${params}`);
    return response.data;
  },

  // Get fraud alert by ID
  getFraudAlertById: async (alertId: string): Promise<FraudAlert> => {
    const response = await apiClient.get(`${FRAUD_SERVICE_URL}/api/v1/fraud/alerts/${alertId}`);
    return response.data;
  },

  // Update alert status
  updateAlertStatus: async (alertId: string, status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED', notes?: string): Promise<FraudAlert> => {
    const response = await apiClient.patch(`${FRAUD_SERVICE_URL}/api/v1/fraud/alerts/${alertId}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // Get pending alerts
  getPendingAlerts: async (): Promise<FraudAlert[]> => {
    const response = await apiClient.get(`${FRAUD_SERVICE_URL}/api/v1/fraud/alerts/pending`);
    return response.data;
  },

  // Get investigating alerts
  getInvestigatingAlerts: async (): Promise<FraudAlert[]> => {
    const response = await apiClient.get(`${FRAUD_SERVICE_URL}/api/v1/fraud/alerts/investigating`);
    return response.data;
  },

  // Get user risk profile
  getUserRiskProfile: async (userId: string): Promise<UserRiskProfile> => {
    const response = await apiClient.get(`${FRAUD_SERVICE_URL}/api/v1/fraud/users/${userId}/risk-profile`);
    return response.data;
  },

  // Get all risk profiles
  getAllRiskProfiles: async (filters: any = {}): Promise<UserRiskProfile[]> => {
    const params = new URLSearchParams();
    if (filters.riskLevel) params.append('risk_level', filters.riskLevel);
    if (filters.minRiskScore) params.append('min_risk_score', filters.minRiskScore);
    if (filters.maxRiskScore) params.append('max_risk_score', filters.maxRiskScore);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${FRAUD_SERVICE_URL}/api/v1/fraud/risk-profiles?${params}`);
    return response.data;
  },

  // Get fraud reports
  getFraudReports: async (filters: FraudFilters = {}): Promise<FraudReport[]> => {
    const params = new URLSearchParams();
    if (filters.userId) params.append('user_id', filters.userId);
    if (filters.status) params.append('status', filters.status);
    if (filters.fromDate) params.append('from_date', filters.fromDate);
    if (filters.toDate) params.append('to_date', filters.toDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${FRAUD_SERVICE_URL}/api/v1/fraud/reports?${params}`);
    return response.data;
  },

  // Create fraud report
  createFraudReport: async (report: Partial<FraudReport>): Promise<FraudReport> => {
    const response = await apiClient.post(`${FRAUD_SERVICE_URL}/api/v1/fraud/reports`, report);
    return response.data;
  },

  // Update fraud report status
  updateReportStatus: async (reportId: string, status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED', resolutionNotes?: string): Promise<FraudReport> => {
    const response = await apiClient.patch(`${FRAUD_SERVICE_URL}/api/v1/fraud/reports/${reportId}/status`, {
      status,
      resolutionNotes,
    });
    return response.data;
  },

  // Get fraud statistics
  getFraudStats: async (): Promise<any> => {
    const response = await apiClient.get(`${FRAUD_SERVICE_URL}/api/v1/fraud/stats`);
    return response.data;
  },

  // Update user risk level
  updateUserRiskLevel: async (userId: string, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', notes?: string): Promise<UserRiskProfile> => {
    const response = await apiClient.patch(`${FRAUD_SERVICE_URL}/api/v1/fraud/users/${userId}/risk-level`, {
      riskLevel,
      notes,
    });
    return response.data;
  },
};
