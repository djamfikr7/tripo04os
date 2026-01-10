import { test, expect } from '@playwright/test';

test.describe('Driver API - Authentication', () => {
  test('should register new driver', async ({ request }) => {
    const response = await request.post('/api/v1/auth/register', {
      data: {
        email: 'newdriver@example.com',
        password: 'password123',
        name: 'New Driver',
        phone: '+0987654321',
        role: 'driver',
        vehicleType: 'sedan',
        vehiclePlate: 'XYZ789',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('newdriver@example.com');
  });

  test('should login driver', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'driver@example.com',
        password: 'driver123',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.role).toBe('driver');
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
});

test.describe('Driver API - Driver Status', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'driver@example.com',
        password: 'driver123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should go online', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/online', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('online');
  });

  test('should go offline', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/offline', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('offline');
  });

  test('should update driver location', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/location', {
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

  test('should get driver profile', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/profile', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBeDefined();
    expect(body.data.vehicleType).toBeDefined();
  });

  test('should update driver profile', async ({ request }) => {
    const response = await request.put('/api/v1/drivers/profile', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'Updated Driver Name',
        phone: '+0987654321',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

test.describe('Driver API - Ride Requests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'driver@example.com',
        password: 'driver123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should get available ride requests', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/requests', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('should accept ride request', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/requests/REQ-001/accept', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('accepted');
  });

  test('should decline ride request', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/requests/REQ-002/decline', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { reason: 'Too far' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

test.describe('Driver API - Active Rides', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'driver@example.com',
        password: 'driver123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should get active ride', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/active-ride', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('should arrive at pickup location', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/rides/RIDE-001/arrive', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('arrived');
  });

  test('should start ride', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/rides/RIDE-001/start', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('in_progress');
  });

  test('should complete ride', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/rides/RIDE-001/complete', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        finalFare: 15.50,
        distance: 5.2,
        duration: 12,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('completed');
  });

  test('should cancel ride', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/rides/RIDE-002/cancel', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { reason: 'Vehicle issue' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('cancelled');
  });
});

test.describe('Driver API - Earnings and Payouts', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'driver@example.com',
        password: 'driver123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should get earnings summary', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/earnings', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.totalEarnings).toBeDefined();
    expect(body.data.todayEarnings).toBeDefined();
    expect(body.data.weeklyEarnings).toBeDefined();
  });

  test('should get earnings history', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/earnings/history', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('should request payout', async ({ request }) => {
    const response = await request.post('/api/v1/drivers/payouts/request', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        amount: 100.00,
        payoutMethod: 'bank',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
  });

  test('should get payout history', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/payouts', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

test.describe('Driver API - Ratings', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'driver@example.com',
        password: 'driver123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should get driver rating', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/rating', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.averageRating).toBeDefined();
    expect(body.data.totalRatings).toBeDefined();
  });

  test('should get driver rating history', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/ratings', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

test.describe('Driver API - Notifications', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'driver@example.com',
        password: 'driver123',
      },
    });
    const body = await response.json();
    authToken = body.data.token;
  });

  test('should get driver notifications', async ({ request }) => {
    const response = await request.get('/api/v1/drivers/notifications', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('should mark notification as read', async ({ request }) => {
    const response = await request.put('/api/v1/drivers/notifications/NOTIF-001/read', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('should update notification preferences', async ({ request }) => {
    const response = await request.put('/api/v1/drivers/notifications/preferences', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        pushNotifications: true,
        smsNotifications: true,
        emailNotifications: false,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
