import { test, expect } from '@playwright/test';

test.describe('Rider API - Authentication', () => {
  test('should register new rider', async ({ request }) => {
    const response = await request.post('/api/v1/auth/register', {
      data: {
        email: 'newrider@example.com',
        password: 'password123',
        name: 'New Rider',
        phone: '+1234567890',
        role: 'rider',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('newrider@example.com');
  });

  test('should login rider', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'rider@example.com',
        password: 'rider123',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.role).toBe('rider');
  });

  test('should fail login with invalid credentials', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('should refresh token', async ({ request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'rider@example.com',
        password: 'rider123',
      },
    });

    const loginBody = await loginResponse.json();
    const refreshToken = loginBody.data.refreshToken;

    const refreshResponse = await request.post('/api/v1/auth/refresh', {
      data: { refreshToken },
    });

    expect(refreshResponse.status()).toBe(200);
    const body = await refreshResponse.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });
});

test.describe('Rider API - Ride Management', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'rider@example.com',
        password: 'rider123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should get ride estimate', async ({ request }) => {
    const response = await request.post('/api/v1/rides/estimate', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        serviceType: 'ride',
        pickupLocation: { lat: 40.7128, lng: -74.006 },
        dropoffLocation: { lat: 40.758, lng: -73.9855 },
        vehicleType: 'economy',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.estimatedFare).toBeDefined();
    expect(body.data.distance).toBeDefined();
    expect(body.data.duration).toBeDefined();
  });

  test('should create ride', async ({ request }) => {
    const response = await request.post('/api/v1/rides', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        serviceType: 'ride',
        pickupLocation: { lat: 40.7128, lng: -74.006, address: '123 Main St' },
        dropoffLocation: { lat: 40.758, lng: -73.9855, address: '456 Oak Ave' },
        vehicleType: 'economy',
        paymentMethod: 'card',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.status).toBe('pending');
  });

  test('should get rider rides', async ({ request }) => {
    const response = await request.get('/api/v1/rides', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('should get ride by id', async ({ request }) => {
    const createResponse = await request.post('/api/v1/rides', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        serviceType: 'ride',
        pickupLocation: { lat: 40.7128, lng: -74.006, address: '123 Main St' },
        dropoffLocation: { lat: 40.758, lng: -73.9855, address: '456 Oak Ave' },
        vehicleType: 'economy',
        paymentMethod: 'card',
      },
    });

    const createBody = await createResponse.json();
    const rideId = createBody.data.id;

    const response = await request.get(`/api/v1/rides/${rideId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(rideId);
  });

  test('should cancel ride', async ({ request }) => {
    const createResponse = await request.post('/api/v1/rides', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        serviceType: 'ride',
        pickupLocation: { lat: 40.7128, lng: -74.006, address: '123 Main St' },
        dropoffLocation: { lat: 40.758, lng: -73.9855, address: '456 Oak Ave' },
        vehicleType: 'economy',
        paymentMethod: 'card',
      },
    });

    const createBody = await createResponse.json();
    const rideId = createBody.data.id;

    const response = await request.post(`/api/v1/rides/${rideId}/cancel`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { reason: 'Changed plans' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('cancelled');
  });

  test('should rate driver', async ({ request }) => {
    const response = await request.post('/api/v1/rides/RIDE-001/rate', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        rating: 5,
        comment: 'Great ride!',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

test.describe('Rider API - Location Services', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'rider@example.com',
        password: 'rider123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should update rider location', async ({ request }) => {
    const response = await request.post('/api/v1/location/update', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        latitude: 40.7128,
        longitude: -74.006,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('should search locations', async ({ request }) => {
    const response = await request.get('/api/v1/location/search', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { query: '123 Main St' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('should get nearby drivers', async ({ request }) => {
    const response = await request.get('/api/v1/location/nearby-drivers', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        latitude: 40.7128,
        longitude: -74.006,
        radius: 5000,
        vehicleType: 'economy',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

test.describe('Rider API - Payment', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'rider@example.com',
        password: 'rider123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should get payment methods', async ({ request }) => {
    const response = await request.get('/api/v1/payment/methods', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('should add payment method', async ({ request }) => {
    const response = await request.post('/api/v1/payment/methods', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '28',
        cvv: '123',
        holderName: 'Test Rider',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
  });

  test('should delete payment method', async ({ request }) => {
    const getResponse = await request.get('/api/v1/payment/methods', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const getBody = await getResponse.json();
    const methodId = getBody.data[0]?.id;

    if (methodId) {
      const response = await request.delete(`/api/v1/payment/methods/${methodId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('should get payment history', async ({ request }) => {
    const response = await request.get('/api/v1/payment/history', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

test.describe('Rider API - Notifications', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'rider@example.com',
        password: 'rider123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should get notifications', async ({ request }) => {
    const response = await request.get('/api/v1/notifications', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('should mark notification as read', async ({ request }) => {
    const response = await request.put('/api/v1/notifications/NOTIF-001/read', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('should mark all notifications as read', async ({ request }) => {
    const response = await request.put('/api/v1/notifications/read-all', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('should update notification preferences', async ({ request }) => {
    const response = await request.put('/api/v1/notifications/preferences', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
