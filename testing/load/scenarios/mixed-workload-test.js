import http from 'k6/http';

const BASE_URL = __ENV.TEST_BASE_URL || 'http://localhost:8000';
const API_TOKEN = __ENV.API_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
};

export let options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 1500 },
    { duration: '5m', target: 2000 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword',
  }), { headers });

  return { token: loginRes.json('token') };
}

export default function (data) {
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${data.token}`,
  };

  const scenarios = [
    () => {
      http.post(`${BASE_URL}/api/orders`, JSON.stringify({
        pickup_lat: 40.7128,
        pickup_lng: -74.0060,
        dropoff_lat: 40.7419,
        dropoff_lng: -74.0024,
        vertical: 'RIDE',
      }), { headers: authHeaders });
    },
    () => {
      http.get(`${BASE_URL}/api/orders`, { headers: authHeaders });
    },
    () => {
      http.post(`${BASE_URL}/api/pricing/estimate`, JSON.stringify({
        pickup_lat: 40.7128,
        pickup_lng: -74.0060,
        dropoff_lat: 40.7419,
        dropoff_lng: -74.0024,
        vertical: 'RIDE',
      }), { headers: authHeaders });
    },
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
}
