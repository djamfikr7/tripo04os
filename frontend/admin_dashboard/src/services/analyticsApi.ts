import { apiClient, ANALYTICS_SERVICE_URL } from './api';

// Analytics Types
export interface Metric {
  id: string;
  name: string;
  type: 'COUNTER' | 'GAUGE' | 'HISTOGRAM';
  value: number;
  unit?: string;
  timestamp: string;
  labels?: Record<string, string>;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  metrics: Metric[];
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'REVENUE' | 'ORDERS' | 'USERS' | 'DRIVERS' | 'CUSTOM';
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  parameters: any;
  result?: any;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
}

export interface AggregationRequest {
  metricName: string;
  aggregationType: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT';
  timeWindow: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  startDate?: string;
  endDate?: string;
  groupBy?: string[];
}

export interface AggregationResult {
  metricName: string;
  aggregationType: string;
  timeWindow: string;
  data: {
    timestamp: string;
    value: number;
  }[];
}

// Analytics API Service
export const analyticsApi = {
  // Get all metrics
  getMetrics: async (filters: any = {}): Promise<Metric[]> => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/metrics?${params}`);
    return response.data;
  },

  // Get metric by name
  getMetric: async (metricName: string, filters: any = {}): Promise<Metric[]> => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/metrics/${metricName}?${params}`);
    return response.data;
  },

  // Create metric
  createMetric: async (metric: Partial<Metric>): Promise<Metric> => {
    const response = await apiClient.post(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/metrics`, metric);
    return response.data;
  },

  // Update metric value
  updateMetricValue: async (metricId: string, value: number, labels?: Record<string, string>): Promise<Metric> => {
    const response = await apiClient.patch(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/metrics/${metricId}`, {
      value,
      labels,
    });
    return response.data;
  },

  // Get all dashboards
  getDashboards: async (): Promise<Dashboard[]> => {
    const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/dashboards`);
    return response.data;
  },

  // Get dashboard by ID
  getDashboard: async (dashboardId: string): Promise<Dashboard> => {
    const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/dashboards/${dashboardId}`);
    return response.data;
  },

  // Create dashboard
  createDashboard: async (dashboard: Partial<Dashboard>): Promise<Dashboard> => {
    const response = await apiClient.post(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/dashboards`, dashboard);
    return response.data;
  },

  // Update dashboard
  updateDashboard: async (dashboardId: string, dashboard: Partial<Dashboard>): Promise<Dashboard> => {
    const response = await apiClient.patch(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/dashboards/${dashboardId}`, dashboard);
    return response.data;
  },

  // Delete dashboard
  deleteDashboard: async (dashboardId: string): Promise<void> => {
    await apiClient.delete(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/dashboards/${dashboardId}`);
  },

  // Aggregate metrics
  aggregateMetrics: async (request: AggregationRequest): Promise<AggregationResult> => {
    const response = await apiClient.post(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/aggregation`, request);
    return response.data;
  },

  // Generate report
  generateReport: async (report: Partial<Report>): Promise<Report> => {
    const response = await apiClient.post(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/reports`, report);
    return response.data;
  },

  // Get reports
  getReports: async (filters: any = {}): Promise<Report[]> => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/reports?${params}`);
    return response.data;
  },

  // Get report by ID
  getReport: async (reportId: string): Promise<Report> => {
    const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/reports/${reportId}`);
    return response.data;
  },

  // Download report
  downloadReport: async (reportId: string, format: 'PDF' | 'CSV' | 'JSON'): Promise<Blob> => {
    const response = await apiClient.get(
      `${ANALYTICS_SERVICE_URL}/api/v1/analytics/reports/${reportId}/download?format=${format}`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Get data sources
  getDataSources: async (): Promise<any[]> => {
    const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/data-sources`);
    return response.data;
  },

  // Get platform statistics
  getPlatformStats: async (): Promise<any> => {
    const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/v1/analytics/stats/platform`);
    return response.data;
  },
};
