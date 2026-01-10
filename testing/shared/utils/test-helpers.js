#!/usr/bin/env node

import axios from 'axios';

// Test utilities for Tripo04OS E2E tests

const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8020';

export const testConfig = {
  baseURL: TEST_BASE_URL,
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  retryCount: parseInt(process.env.TEST_RETRY_COUNT || '3'),
};

export const apiEndpoints = {
  identity: `${TEST_BASE_URL}/api/v1/auth`,
  order: `${TEST_BASE_URL}/api/v1/orders`,
  trip: `${TEST_BASE_URL}/api/v1/trips`,
  matching: `${TEST_BASE_URL}/api/v1/matching`,
  pricing: `${TEST_BASE_URL}/api/v1/pricing`,
  payment: `${TEST_BASE_URL}/api/v1/payments`,
  location: `${TEST_BASE_URL}/api/v1/location`,
  maps: `${TEST_BASE_URL}/api/v1/maps`,
  notification: `${TEST_BASE_URL}/api/v1/notifications`,
};

export const testUser = {
  rider: {
    email: 'test-rider@example.com',
    password: 'TestPass123!',
    phone: '+1234567890',
  },
  driver: {
    email: 'test-driver@example.com',
    password: 'TestPass123!',
    phone: '+1987654321',
  },
  corporate: {
    email: 'test-corporate@example.com',
    password: 'TestPass123!',
  },
};

export async function authenticateUser(userType = 'rider') {
  const user = testUser[userType];
  
  const response = await axios.post(`${apiEndpoints.identity}/register`, {
    email: user.email,
    password: user.password,
    phone: user.phone,
  });

  const loginResponse = await axios.post(`${apiEndpoints.identity}/login`, {
    email: user.email,
    password: user.password,
  });

  return {
    token: loginResponse.data.token,
    userId: loginResponse.data.userId,
    user,
  };
}

export async function createOrder(token, orderData) {
  const response = await axios.post(apiEndpoints.order, orderData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: testConfig.timeout,
  });

  return response.data;
}

export async function acceptOrder(token, orderId) {
  const response = await axios.post(
    `${apiEndpoints.trip}/accept`,
    { orderId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: testConfig.timeout,
    }
  );

  return response.data;
}

export async function completeTrip(token, tripId, rating) {
  const response = await axios.post(
    `${apiEndpoints.trip}/${tripId}/complete`,
    { rating },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: testConfig.timeout,
    }
  );

  return response.data;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateOrderId() {
  return `test_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateTripId() {
  return `test_trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function withRetry(fn, maxRetries = 3) {
  return async (...args) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${i + 1} failed:`, error.message);
        
        if (i < maxRetries - 1) {
          await sleep(1000 * (i + 1));
        }
      }
    }
    
    throw lastError;
  };
}

export const testLocations = {
  pickup: {
    lat: 40.7128,
    lon: -74.0060,
    address: 'Times Square, New York',
  },
  dropoff: {
    lat: 40.7614,
    lon: -73.9776,
    address: 'Central Park, New York',
  },
};

export const testOrderData = {
  vertical: 'RIDE',
  product: 'STANDARD',
  pickupLocation: testLocations.pickup,
  dropoffLocation: testLocations.dropoff,
  scheduledFor: null,
  paymentMethod: 'CARD',
};

export async function cleanupTestData(token, orderIds = [], tripIds = []) {
  // Cancel all test orders
  for (const orderId of orderIds) {
    try {
      await axios.delete(
        `${apiEndpoints.order}/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.warn(`Failed to cleanup order ${orderId}:`, error.message);
    }
  }

  // Complete all test trips
  for (const tripId of tripIds) {
    try {
      await axios.post(
        `${apiEndpoints.trip}/${tripId}/complete`,
        { rating: 5 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.warn(`Failed to cleanup trip ${tripId}:`, error.message);
    }
  }
}

export default {
  testConfig,
  apiEndpoints,
  testUser,
  authenticateUser,
  createOrder,
  acceptOrder,
  completeTrip,
  sleep,
  generateOrderId,
  generateTripId,
  withRetry,
  testLocations,
  testOrderData,
  cleanupTestData,
};
