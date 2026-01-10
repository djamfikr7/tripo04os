import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const IDENTITY_SERVICE_URL = process.env.REACT_APP_IDENTITY_SERVICE_URL || 'http://localhost:8000';
const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:8001';
const REPUTATION_SERVICE_URL = process.env.REACT_APP_REPUTATION_SERVICE_URL || 'http://localhost:8009';
const FRAUD_SERVICE_URL = process.env.REACT_APP_FRAUD_SERVICE_URL || 'http://localhost:8010';
const ANALYTICS_SERVICE_URL = process.env.REACT_APP_ANALYTICS_SERVICE_URL || 'http://localhost:8012';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Error handling helper
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Error in request setup
    return error.message || 'An unknown error occurred';
  }
};

export {
  apiClient,
  IDENTITY_SERVICE_URL,
  ORDER_SERVICE_URL,
  REPUTATION_SERVICE_URL,
  FRAUD_SERVICE_URL,
  ANALYTICS_SERVICE_URL,
};
