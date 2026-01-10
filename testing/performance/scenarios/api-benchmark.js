import http from 'k6/http';

const BASE_URL = __ENV.TEST_BASE_URL || 'http://localhost:8020';
const TARGET_USERS = parseInt(__ENV.LOAD_TEST_USERS || '500');
const TEST_DURATION = parseInt(__ENV.LOAD_TEST_DURATION || '600');

export let options = {
  vus: TARGET_USERS,
  duration: `${TEST_DURATION}s`,
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const authParams = new URLSearchParams({
    email: 'test-rider@example.com',
    password: 'TestPass123!',
  });

  let authToken;

  group('Authentication', () => {
    const authRes = http.post(`${BASE_URL}/api/v1/auth/login`, authParams.toString(), {
      tags: { name: 'login' },
    });

    check(authRes, {
      'login successful': (r) => r.status === 200,
      'has token': (r) => r.json('token') !== undefined,
    });

    authToken = authRes.json('token');
  });

  const orderParams = JSON.stringify({
    vertical: 'RIDE',
    product: 'STANDARD',
    pickupLocation: {
      lat: 40.7128,
      lon: -74.0060,
      address: 'Times Square, New York',
    },
    dropoffLocation: {
      lat: 40.7614,
      lon: -73.9776,
      address: 'Central Park, New York',
    },
    paymentMethod: 'CARD',
  });

  group('Order Creation', () => {
    const createRes = http.post(`${BASE_URL}/api/v1/orders`, orderParams, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'create-order' },
    });

    check(createRes, {
      'order created': (r) => r.status === 201,
      'has order id': (r) => r.json('id') !== undefined,
    });

    const orderId = createRes.json('id');

    // Fetch order details
    group('Order Retrieval', () => {
      const getRes = http.get(`${BASE_URL}/api/v1/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        tags: { name: 'get-order' },
      });

      check(getRes, {
        'order retrieved': (r) => r.status === 200,
        'has pickup': (r) => r.json('pickupLocation') !== undefined,
        'has dropoff': (r) => r.json('dropoffLocation') !== undefined,
      });
    });

    // List orders
    group('Order Listing', () => {
      const listRes = http.get(`${BASE_URL}/api/v1/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        tags: { name: 'list-orders' },
      });

      check(listRes, {
        'orders listed': (r) => r.status === 200,
        'is array': (r) => Array.isArray(r.json()),
      });
    });
  });

  group('Pricing', () => {
    const pricingParams = new URLSearchParams({
      vertical: 'RIDE',
      pickup_lat: '40.7128',
      pickup_lon: '-74.0060',
      dropoff_lat: '40.7614',
      dropoff_lon: '-73.9776',
    });

    const pricingRes = http.post(`${BASE_URL}/api/v1/pricing/calculate`, pricingParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'calculate-price' },
    });

    check(pricingRes, {
      'pricing calculated': (r) => r.status === 200,
      'has fare': (r) => r.json('estimatedFare') !== undefined,
      'has distance': (r) => r.json('distance') !== undefined,
      'has duration': (r) => r.json('duration') !== undefined,
    });
  });

  group('Maps', () => {
    const mapsParams = new URLSearchParams({
      start_lat: '40.7128',
      start_lon: '-74.0060',
      end_lat: '40.7614',
      end_lon: '-73.9776',
    });

    const mapsRes = http.get(`${BASE_URL}/api/v1/maps/route?${mapsParams.toString()}`, {
      tags: { name: 'get-route' },
    });

    check(mapsRes, {
      'route found': (r) => r.status === 200,
      'has distance': (r) => r.json('distance_m') !== undefined,
      'has duration': (r) => r.json('duration_s') !== undefined,
    });
  });
}
