# Tripo04OS Admin Dashboard

React-based admin dashboard for Tripo04OS platform management.

## Features

### Implemented Modules

1. **Users Management** ✅
   - User list with search and filtering
   - User status management (Active, Suspended, Banned)
   - Role management (Rider, Driver, Admin)
   - User verification and actions
   - Pagination support

2. **Order Monitoring** ✅
   - Real-time order tracking
   - Active orders dashboard
   - Completed and cancelled orders
   - Support for all verticals (RIDE, MOTO, FOOD, GROCERY, GOODS, TRUCK_VAN)
   - Revenue statistics

3. **Fraud & Reputation** ✅
   - Fraud alert management
   - User risk profiles
   - Reputation scores and ratings
   - Trust score tracking
   - Fraud investigation workflow

4. **API Integration** ✅
   - Complete API service layer
   - User API
   - Order API
   - Reputation API
   - Fraud API
   - Analytics API
   - Error handling and interceptors

### Pending Modules

5. **Support Tickets** (Task 5)
6. **Configuration & Settings** (Task 6)

## Technology Stack

- **React 18.2.0** - UI Framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - UI Components
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Recharts** - Data visualization

## Project Structure

```
frontend/admin_dashboard/
├── public/
├── src/
│   ├── components/
│   │   ├── UsersManagement.tsx
│   │   ├── OrderMonitoring.tsx
│   │   ├── FraudReputation.tsx
│   │   └── [More components...]
│   ├── services/
│   │   ├── api.ts              # Base API configuration
│   │   ├── userApi.ts          # User service API
│   │   ├── orderApi.ts         # Order service API
│   │   ├── reputationApi.ts    # Reputation service API
│   │   ├── fraudApi.ts         # Fraud service API
│   │   ├── analyticsApi.ts     # Analytics service API
│   │   └── index.ts            # Exports
│   ├── App.tsx
│   └── index.tsx
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend/admin_dashboard

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Update .env with your service URLs
```

### Configuration

Edit `.env` file with your service endpoints:

```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_IDENTITY_SERVICE_URL=http://localhost:8000
REACT_APP_ORDER_SERVICE_URL=http://localhost:8001
REACT_APP_REPUTATION_SERVICE_URL=http://localhost:8009
REACT_APP_FRAUD_SERVICE_URL=http://localhost:8010
REACT_APP_ANALYTICS_SERVICE_URL=http://localhost:8012
```

### Running the Dashboard

```bash
# Development mode
npm start

# Build for production
npm run build

# Test production build
npm run serve
```

The dashboard will be available at `http://localhost:3000`

## API Services

### User API
- `getUsers(filters)` - Get all users with filters
- `getUserById(userId)` - Get user by ID
- `createUser(userData)` - Create new user
- `updateUserStatus(userId, statusData)` - Update user status
- `updateUserRole(userId, roleData)` - Update user role
- `verifyUser(userId)` - Verify user
- `banUser(userId, reason)` - Ban user
- `unbanUser(userId)` - Unban user
- `deleteUser(userId)` - Delete user
- `getUserStats()` - Get user statistics

### Order API
- `getOrders(filters)` - Get all orders with filters
- `getOrderById(orderId)` - Get order by ID
- `getActiveOrders()` - Get active orders
- `getCompletedOrdersToday()` - Get completed orders today
- `getCancelledOrdersToday()` - Get cancelled orders today
- `cancelOrder(orderId, reason)` - Cancel order
- `getOrderStats()` - Get order statistics
- `getRevenue(fromDate, toDate)` - Get revenue data

### Reputation API
- `getReputationProfile(userId)` - Get user reputation profile
- `getAllProfiles(filters)` - Get all reputation profiles
- `getUserRatings(userId, filters)` - Get user ratings
- `createRating(rating)` - Create rating
- `deleteRating(ratingId)` - Delete rating
- `getTopRatedUsers(role, limit)` - Get top rated users
- `getAggregatedStats(userId)` - Get aggregated statistics

### Fraud API
- `getFraudAlerts(filters)` - Get all fraud alerts
- `getFraudAlertById(alertId)` - Get fraud alert by ID
- `updateAlertStatus(alertId, status, notes)` - Update alert status
- `getPendingAlerts()` - Get pending alerts
- `getInvestigatingAlerts()` - Get investigating alerts
- `getUserRiskProfile(userId)` - Get user risk profile
- `getAllRiskProfiles(filters)` - Get all risk profiles
- `getFraudReports(filters)` - Get fraud reports
- `createFraudReport(report)` - Create fraud report
- `updateReportStatus(reportId, status, notes)` - Update report status
- `getFraudStats()` - Get fraud statistics
- `updateUserRiskLevel(userId, riskLevel, notes)` - Update user risk level

### Analytics API
- `getMetrics(filters)` - Get all metrics
- `getMetric(metricName, filters)` - Get metric by name
- `createMetric(metric)` - Create metric
- `updateMetricValue(metricId, value, labels)` - Update metric value
- `getDashboards()` - Get all dashboards
- `getDashboard(dashboardId)` - Get dashboard by ID
- `createDashboard(dashboard)` - Create dashboard
- `updateDashboard(dashboardId, dashboard)` - Update dashboard
- `deleteDashboard(dashboardId)` - Delete dashboard
- `aggregateMetrics(request)` - Aggregate metrics
- `generateReport(report)` - Generate report
- `getReports(filters)` - Get reports
- `getReport(reportId)` - Get report by ID
- `downloadReport(reportId, format)` - Download report
- `getDataSources()` - Get data sources
- `getPlatformStats()` - Get platform statistics

## Authentication

The dashboard uses JWT tokens for authentication:

```typescript
// Token is automatically added to requests via interceptor
const token = localStorage.getItem('authToken');

// Token is set when user logs in
localStorage.setItem('authToken', 'your-jwt-token');

// Token is removed when user logs out
localStorage.removeItem('authToken');
```

## Error Handling

All API errors are handled via the `handleApiError` helper:

```typescript
import { handleApiError } from './services';

try {
  await userApi.getUsers();
} catch (error) {
  const errorMessage = handleApiError(error);
  // Display error message to user
}
```

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for formatting

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run serve
```

## Backend Integration

The dashboard integrates with the following backend services:

- **Identity Service** (Port 8000) - User management
- **Order Service** (Port 8001) - Order tracking
- **Reputation Service** (Port 8009) - Ratings and trust scores
- **Fraud Service** (Port 8010) - Fraud detection
- **Analytics Service** (Port 8012) - Platform analytics

## Future Enhancements

- Real-time updates via WebSocket
- Advanced analytics with charts
- Export functionality for reports
- Dark mode support
- Mobile responsive design improvements
- Support tickets management
- System configuration interface

## Contributing

When adding new features:

1. Create TypeScript interfaces for data structures
2. Add API methods to appropriate service file
3. Create React components in `src/components/`
4. Use Material-UI components for consistency
5. Add proper error handling
6. Update this README

## License

Proprietary - Tripo04OS Internal Use Only
