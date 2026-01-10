import { apiClient, ORDER_SERVICE_URL } from './api';

// Order Types
export interface Order {
  id: string;
  riderId: string;
  riderName: string;
  driverId: string | null;
  driverName: string | null;
  vertical: 'RIDE' | 'MOTO' | 'FOOD' | 'GROCERY' | 'GOODS' | 'TRUCK_VAN';
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  pickupLocation: string;
  dropoffLocation: string;
  createdAt: string;
  estimatedArrival: string | null;
  fare: number;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  rideType: string;
}

export interface OrderFilters {
  vertical?: string;
  status?: string;
  riderId?: string;
  driverId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderStats {
  totalOrders: number;
  activeOrders: number;
  completedToday: number;
  cancelledToday: number;
  totalRevenue: number;
  averageWaitTime: number;
  totalRevenueToday: number;
}

// Order API Service
export const orderApi = {
  // Get all orders with filters
  getOrders: async (filters: OrderFilters = {}): Promise<OrderListResponse> => {
    const params = new URLSearchParams();
    if (filters.vertical) params.append('vertical', filters.vertical);
    if (filters.status) params.append('status', filters.status);
    if (filters.riderId) params.append('rider_id', filters.riderId);
    if (filters.driverId) params.append('driver_id', filters.driverId);
    if (filters.fromDate) params.append('from_date', filters.fromDate);
    if (filters.toDate) params.append('to_date', filters.toDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${ORDER_SERVICE_URL}/api/v1/orders?${params}`);
    return response.data;
  },

  // Get order by ID
  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get(`${ORDER_SERVICE_URL}/api/v1/orders/${orderId}`);
    return response.data;
  },

  // Get active orders
  getActiveOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get(`${ORDER_SERVICE_URL}/api/v1/orders/active`);
    return response.data;
  },

  // Get completed orders for today
  getCompletedOrdersToday: async (): Promise<Order[]> => {
    const response = await apiClient.get(`${ORDER_SERVICE_URL}/api/v1/orders/completed/today`);
    return response.data;
  },

  // Get cancelled orders for today
  getCancelledOrdersToday: async (): Promise<Order[]> => {
    const response = await apiClient.get(`${ORDER_SERVICE_URL}/api/v1/orders/cancelled/today`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`${ORDER_SERVICE_URL}/api/v1/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  // Get order statistics
  getOrderStats: async (): Promise<OrderStats> => {
    const response = await apiClient.get(`${ORDER_SERVICE_URL}/api/v1/orders/stats`);
    return response.data;
  },

  // Get revenue data
  getRevenue: async (fromDate: string, toDate: string): Promise<any> => {
    const response = await apiClient.get(`${ORDER_SERVICE_URL}/api/v1/orders/revenue?from=${fromDate}&to=${toDate}`);
    return response.data;
  },
};
