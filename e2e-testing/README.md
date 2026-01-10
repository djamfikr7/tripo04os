# Tripo04OS E2E Testing Suite

Comprehensive end-to-end testing for the Tripo04OS platform using Playwright.

## Overview

This testing suite provides complete E2E test coverage for:

- **Admin Dashboard** - React admin interface
- **Web Interface** - React user-facing web application
- **Rider API** - Backend API endpoints for rider operations
- **Driver API** - Backend API endpoints for driver operations

## Setup

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn

### Installation

```bash
cd e2e-testing
npm install
npx playwright install
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the variables in `.env`:

```env
BASE_URL=http://localhost:3000
API_GATEWAY_URL=http://localhost:8000
TEST_ADMIN_EMAIL=admin@tripo04os.com
TEST_ADMIN_PASSWORD=admin123
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=user123
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Files

```bash
npx playwright test admin-dashboard.spec.ts
npx playwright test web-interface.spec.ts
npx playwright test rider-api.spec.ts
npx playwright test driver-api.spec.ts
```

### Run with UI Mode

```bash
npm run test:ui
```

### Run in Headed Mode

```bash
npm run test:headed
```

### Run in Debug Mode

```bash
npm run test:debug
```

### View Test Reports

```bash
npm run test:report
```

## Test Structure

### Directory Layout

```
e2e-testing/
├── tests/                      # Test files
│   ├── admin-dashboard.spec.ts  # Admin Dashboard tests
│   ├── web-interface.spec.ts   # Web Interface tests
│   ├── rider-api.spec.ts       # Rider API tests
│   └── driver-api.spec.ts      # Driver API tests
├── utils/                      # Test utilities
│   ├── test-data.ts            # Mock data
│   ├── helpers.ts              # Helper functions
│   └── api-mock.ts             # API mocking
├── .github/workflows/           # CI/CD workflows
│   └── e2e-tests.yml
├── playwright.config.ts         # Playwright configuration
├── tsconfig.json               # TypeScript configuration
├── package.json
└── .env.example                # Environment variables template
```

## Test Coverage

### Admin Dashboard Tests

**Authentication:**
- Login page display
- Valid credentials login
- Invalid credentials handling
- Session persistence

**Dashboard:**
- Metrics display (users, drivers, rides, revenue)
- Revenue chart rendering
- User growth chart rendering

**User Management:**
- User list display
- Search functionality
- Role filtering
- User detail modal
- Add new user
- Edit existing user
- Delete user with confirmation
- Pagination

**Navigation:**
- Sidebar navigation
- Page routing
- Logout functionality

### Web Interface Tests

**Booking Flow:**
- Booking widget display
- Service type selection (ride, moto, food, grocery, goods)
- Vehicle options display
- Pickup/dropoff location input
- Fare estimation
- Map route visualization
- Booking confirmation

**Ride History:**
- Ride list display
- Status filtering (all, completed, cancelled)
- Sorting (date, fare, rating)
- Ride details modal
- Ride cancellation

**Profile Management:**
- Profile tabs (Profile, Payment, Settings)
- Profile information display
- Profile update
- Payment methods display
- Add new payment method
- Notification preferences
- Toggle notifications

**Responsive Design:**
- Desktop layout
- Tablet layout
- Mobile layout
- Mobile menu

**Navigation:**
- Page navigation
- Home page link

### Rider API Tests

**Authentication:**
- Register new rider
- Login rider
- Invalid credentials handling
- Token refresh

**Ride Management:**
- Get ride estimate
- Create ride
- Get rider rides
- Get ride by ID
- Cancel ride
- Rate driver

**Location Services:**
- Update rider location
- Search locations
- Get nearby drivers

**Payment:**
- Get payment methods
- Add payment method
- Delete payment method
- Get payment history

**Notifications:**
- Get notifications
- Mark as read
- Mark all as read
- Update preferences

### Driver API Tests

**Authentication:**
- Register new driver
- Login driver
- Invalid credentials handling

**Driver Status:**
- Go online/offline
- Update location
- Get profile
- Update profile

**Ride Requests:**
- Get available requests
- Accept request
- Decline request

**Active Rides:**
- Get active ride
- Arrive at pickup
- Start ride
- Complete ride
- Cancel ride

**Earnings and Payouts:**
- Get earnings summary
- Get earnings history
- Request payout
- Get payout history

**Ratings:**
- Get driver rating
- Get rating history

**Notifications:**
- Get notifications
- Mark as read
- Update preferences

## API Mocking

The test suite includes comprehensive API mocking to test UI functionality without requiring a live backend.

### Mock Data

Mock data is defined in `utils/test-data.ts`:
- Mock users (admin, rider, driver)
- Mock rides
- Mock drivers
- Mock analytics data

### Mock Endpoints

API endpoints are mocked in `utils/api-mock.ts`:
- Authentication endpoints
- Analytics endpoints
- User management endpoints
- Ride endpoints
- Driver endpoints

### Using Mocks in Tests

```typescript
import { ApiMock } from '../utils/api-mock';

test.beforeEach(async ({ page }) => {
  const apiMock = new ApiMock(page);
  apiMock.setupMocks();
});
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Test Matrix

Tests run across:
- Browsers: Chromium, Firefox, WebKit
- Shards: 4 parallel test runs

### Test Results

Results are uploaded as artifacts:
- Playwright HTML reports (7-day retention)
- Screenshots on failure (7-day retention)

## Best Practices

### Writing New Tests

1. Use descriptive test names
2. Group related tests with `test.describe`
3. Use `test.beforeEach` for common setup
4. Use `test.beforeAll` for one-time setup
5. Clean up in `test.afterEach` if needed

### Test Organization

```typescript
test.describe('Feature Name', () => {
  test.use({ storageState: 'auth-state.json' });

  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('should do something', async ({ page }) => {
    // Test
  });
});
```

### Selectors

- Prefer role-based selectors: `getByRole('button', { name: 'Submit' })`
- Use test IDs for specific elements: `[data-testid="booking-widget"]`
- Use text selectors for simple cases: `text=Login`

### Assertions

- Be specific with expectations
- Use waitFor for async operations
- Check both presence and content

```typescript
await expect(page.locator('h1')).toContainText('Welcome');
await expect(page).toHaveURL(/.*\/dashboard/);
await expect(element).toBeVisible();
```

## Troubleshooting

### Browser Not Installed

```bash
npx playwright install
```

### Port Already in Use

Change the port in `.env`:

```env
BASE_URL=http://localhost:3001
```

### Tests Failing

1. Run tests in headed mode to see what's happening
2. Check screenshots in `test-results/`
3. Use debug mode to step through tests
4. Verify API mocks are correct

### Slow Tests

- Use sharding for parallel execution
- Reduce browser viewport size
- Disable video recording in `playwright.config.ts`

## Contributing

When adding new tests:

1. Add test file to appropriate directory
2. Follow existing naming conventions
3. Include API mocks for new endpoints
4. Update this README with test coverage
5. Ensure CI/CD pipeline passes

## License

MIT
