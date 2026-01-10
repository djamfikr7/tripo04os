import { Page, Route } from '@playwright/test';

export class ApiMock {
  constructor(private page: Page) {}

  setupMocks() {
    this.page.route('**/api/v1/auth/login', async (route) => {
      await this.mockLogin(route);
    });

    this.page.route('**/api/v1/analytics/overview', async (route) => {
      await this.mockAnalytics(route);
    });

    this.page.route('**/api/v1/users**', async (route) => {
      await this.mockUsers(route);
    });

    this.page.route('**/api/v1/users/*', async (route) => {
      await this.mockUserById(route);
    });

    this.page.route('**/api/v1/rides**', async (route) => {
      await this.mockRides(route);
    });

    this.page.route('**/api/v1/drivers**', async (route) => {
      await this.mockDrivers(route);
    });
  }

  private async mockLogin(route: Route) {
    const request = route.request();
    const body = await request.postDataJSON();

    if (body.email === 'admin@tripo04os.com' && body.password === 'admin123') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-jwt-token-admin',
            user: {
              id: '1',
              email: 'admin@tripo04os.com',
              name: 'Admin User',
              role: 'admin',
            },
          },
        }),
      });
    } else if (body.email === 'rider@example.com' && body.password === 'rider123') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-jwt-token-rider',
            user: {
              id: '2',
              email: 'rider@example.com',
              name: 'Test Rider',
              role: 'rider',
            },
          },
        }),
      });
    } else {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials',
        }),
      });
    }
  }

  private async mockAnalytics(route: Route) {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          totalUsers: 12453,
          activeDrivers: 567,
          activeRiders: 11890,
          todayRides: 234,
          todayRevenue: 3456.78,
          avgRating: 4.6,
          totalRevenue: 1234567.89,
          weeklyRevenue: [15000, 18000, 16000, 21000, 19000, 23000, 20000],
          monthlyUsers: [10000, 10500, 11000, 11500, 12000, 12453],
        },
      }),
    });
  }

  private async mockUsers(route: Route) {
    const url = route.request().url();
    const searchParams = new URL(url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const mockData = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@tripo04os.com',
        role: 'admin',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Test Rider',
        email: 'rider@example.com',
        role: 'rider',
        status: 'active',
        createdAt: '2025-01-05T00:00:00Z',
      },
      {
        id: '3',
        name: 'John Driver',
        email: 'driver@example.com',
        role: 'driver',
        status: 'active',
        createdAt: '2025-01-03T00:00:00Z',
      },
    ];

    let filteredData = mockData;
    if (search) {
      filteredData = mockData.filter(
        (user) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()),
      );
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: filteredData.slice(0, limit),
        pagination: {
          total: filteredData.length,
          page,
          limit,
          totalPages: Math.ceil(filteredData.length / limit),
        },
      }),
    });
  }

  private async mockUserById(route: Route) {
    const url = route.request().url();
    const id = url.split('/').pop();

    const mockUser = {
      id,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      role: 'rider',
      status: 'active',
      createdAt: '2025-01-05T00:00:00Z',
    };

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockUser,
      }),
    });
  }

  private async mockRides(route: Route) {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'RIDE-001',
            riderId: '2',
            driverId: '3',
            serviceType: 'ride',
            status: 'completed',
            pickupLocation: '123 Main St',
            dropoffLocation: '456 Oak Ave',
            fare: 15.50,
            distance: 5.2,
            duration: 12,
            rating: 4.8,
            createdAt: '2025-01-09T10:30:00Z',
          },
          {
            id: 'RIDE-002',
            riderId: '2',
            driverId: null,
            serviceType: 'ride',
            status: 'cancelled',
            pickupLocation: '789 Pine Rd',
            dropoffLocation: '321 Elm St',
            fare: 0,
            distance: 0,
            duration: 0,
            rating: 0,
            createdAt: '2025-01-08T15:45:00Z',
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }),
    });
  }

  private async mockDrivers(route: Route) {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: '3',
            name: 'John Driver',
            email: 'driver@example.com',
            phone: '+1234567890',
            vehicleType: 'sedan',
            vehiclePlate: 'ABC123',
            rating: 4.7,
            totalTrips: 234,
            status: 'available',
            totalEarnings: 3456.78,
          },
          {
            id: '4',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+0987654321',
            vehicleType: 'suv',
            vehiclePlate: 'XYZ789',
            rating: 4.9,
            totalTrips: 567,
            status: 'busy',
            totalEarnings: 7890.12,
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }),
    });
  }
}
