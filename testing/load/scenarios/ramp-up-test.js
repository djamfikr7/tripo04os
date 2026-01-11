import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.TEST_BASE_URL || 'http://localhost:8020';
const DURATION = parseInt(__ENV.TEST_DURATION || '600');
const RAMP_UP = parseInt(__ENV.TEST_RAMP_UP || '60');
const STEADY_USERS = parseInt(__ENV.STEADY_USERS || '500');
const SPIKE_USERS = parseInt(__ENV.SPIKE_USERS || '1000');

export let options = {
  stages: [
    { duration: `${RAMP_UP}s`, target: STEADY_USERS, name: 'ramp-up' },
    { duration: `${DURATION - RAMP_UP - 60}s`, target: STEADY_USERS, name: 'steady-state' },
    { duration: '60s', target: SPIKE_USERS, name: 'spike-test' },
  ],
};

export function setupTest() {
  const authParams = new URLSearchParams({
    email: 'test-rider@example.com',
    password: 'TestPass123!',
  });

  const authRes = http.post(`${BASE_URL}/api/v1/auth/login`, authParams.toString());

  check(authRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  return authRes.json('token');
}

export function rampUpLoadTest(token) {
  console.log(`Starting ramp-up test: 0 → ${STEADY_USERS} users over ${RAMP_UP}s`);

  const users = [];
  const startTime = Date.now();

  for (let i = 0; i < STEADY_USERS; i++) {
    const targetTime = startTime + (RAMP_UP * 1000 / STEADY_USERS * (i + 1));

    while (Date.now() < targetTime) {
      const orderRes = http.post(
        `${BASE_URL}/api/v1/orders`,
        JSON.stringify({
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
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      users.push({
        userId: `test_user_${i}`,
        responseTime: Date.now() - startTime,
        status: orderRes.status,
      });

      const delay = (RAMP_UP * 1000 / STEADY_USERS) - (Date.now() - targetTime);
      sleep(Math.max(0, delay));
    }
  }
}

export function steadyStateLoadTest(token) {
    console.log(`Starting steady-state test: ${STEADY_USERS} concurrent users for ${DURATION}s`);

    const startT = Date.now();
    const requests = [];

    for (let i = 0; i < (DURATION / 1000); i++) {
      const startTime = Date.now();
      const orderRes = http.post(
        `${BASE_URL}/api/v1/orders`,
        JSON.stringify({
          vertical: 'RIDE',
          product: 'STANDARD',
          pickupLocation: {
            lat: 40.7128,
            lon: -74.0060,
          },
          dropoffLocation: {
            lat: 40.7614,
            lon: -73.9776,
          },
          paymentMethod: 'CARD',
        }),
        );

      requests.push({
        userId: `user_${Math.floor(Math.random() * 10)}`,
        responseTime: Date.now() - startTime,
        status: orderRes.status,
      });

      // Maintain steady state - make requests at constant rate
      sleep(1000 / STEADY_USERS);
    }

    return {
      totalRequests: requests.length,
      requests,
      duration: DURATION,
      users: STEADY_USERS,
    };
  }

export function spikeTest(token, baselineUsers, spikeUsers) {
  console.log(`Starting spike test: ${baselineUsers} → ${spikeUsers} users (${spikeUsers}x increase) for 60s`);

  const startT = Date.now();
  const spikeDuration = 60000; // 60 seconds

  // Baseline period (first 30 seconds)
  for (let i = 0; i < baselineUsers; i++) {
    const startTime = Date.now();
    http.post(
      `${BASE_URL}/api/v1/orders`,
      JSON.stringify({
        vertical: 'RIDE',
        pickupLocation: { lat: 40.7128, lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      }),
      );
    sleep(30000 / baselineUsers);
  }

  // Spike period (next 30 seconds)
  for (let i = 0; i < spikeUsers; i++) {
    const startTime = Date.now();
    http.post(
      `${BASE_URL}/api/v1/orders`,
      JSON.stringify({
        vertical: 'RIDE',
        pickupLocation: { lat: 40.7128, lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      }),
      );
    sleep(30000 / spikeUsers);
  }

  // Recovery period (final 30 seconds)
  console.log('Spike complete, starting recovery period...');
  for (let i = 0; i < baselineUsers; i++) {
    const startTime = Date.now();
    http.post(
      `${BASE_URL}/api/v1/orders`,
      JSON.stringify({
        vertical: 'RIDE',
        pickupLocation: { lat: 40.7128, lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      }),
      );
    sleep(30000 / baselineUsers);
  }

  console.log('Spike test complete');

  return {
    baseline: {
      totalRequests: baselineUsers,
      avgResponseTime: 0, // Calculate from requests array
      requests: [],
    },
    spike: {
      totalRequests: spikeUsers,
      avgResponseTime: 0, // Calculate from requests array
      requests: [],
    },
    recovery: {
      totalRequests: baselineUsers,
      avgResponseTime: 0,
      requests: [],
    },
  };
}

export default {
  options,
  setupTest,
  rampUpLoadTest,
  steadyStateLoadTest,
  spikeTest,
};
