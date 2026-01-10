import { apiClient, IDENTITY_SERVICE_URL } from './api';

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';
  createdAt: string;
  lastLogin: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  password?: string;
}

export interface UpdateUserStatusRequest {
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  reason?: string;
}

export interface UpdateUserRoleRequest {
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
}

export interface UserFilters {
  role?: string;
  status?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

// User API Service
export const userApi = {
  // Get all users with filters
  getUsers: async (filters: UserFilters = {}): Promise<UserListResponse> => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.searchQuery) params.append('search', filters.searchQuery);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${IDENTITY_SERVICE_URL}/api/v1/users?${params}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`${IDENTITY_SERVICE_URL}/api/v1/users/${userId}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post(`${IDENTITY_SERVICE_URL}/api/v1/users`, userData);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId: string, statusData: UpdateUserStatusRequest): Promise<User> => {
    const response = await apiClient.patch(`${IDENTITY_SERVICE_URL}/api/v1/users/${userId}/status`, statusData);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId: string, roleData: UpdateUserRoleRequest): Promise<User> => {
    const response = await apiClient.patch(`${IDENTITY_SERVICE_URL}/api/v1/users/${userId}/role`, roleData);
    return response.data;
  },

  // Verify user
  verifyUser: async (userId: string): Promise<User> => {
    const response = await apiClient.post(`${IDENTITY_SERVICE_URL}/api/v1/users/${userId}/verify`);
    return response.data;
  },

  // Ban user
  banUser: async (userId: string, reason?: string): Promise<User> => {
    const response = await apiClient.post(`${IDENTITY_SERVICE_URL}/api/v1/users/${userId}/ban`, { reason });
    return response.data;
  },

  // Unban user
  unbanUser: async (userId: string): Promise<User> => {
    const response = await apiClient.post(`${IDENTITY_SERVICE_URL}/api/v1/users/${userId}/unban`);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`${IDENTITY_SERVICE_URL}/api/v1/users/${userId}`);
  },

  // Get user statistics
  getUserStats: async (): Promise<any> => {
    const response = await apiClient.get(`${IDENTITY_SERVICE_URL}/api/v1/users/stats`);
    return response.data;
  },
};
