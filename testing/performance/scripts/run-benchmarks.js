#!/usr/bin/env node

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8020';
const AUTH_DURATION = parseInt(process.env.AUTH_DURATION || '20000'); // 20s

export async function benchmarkAuth() {
  console.log('Benchmarking authentication...');

  const authParams = new URLSearchParams({
    email: 'test-rider@example.com',
    password: 'TestPass123!',
  });

  let totalTime = 0;
  const iterations = 10;

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    const authRes = http.post(`${BASE_URL}/api/v1/auth/login`, authParams.toString(), {
      tags: { name: 'login' },
    });

    const duration = Date.now() - startTime;
    totalTime += duration;

    check(authRes, {
      'login successful': (r) => r.status === 200,
      'has token': (r) => r.json('token') !== undefined,
    });

    if (i % 3 === 0) {
      const token = authRes.json('token');
      await testTokenValidation(token);
    }
  }

  const avgDuration = totalTime / iterations;
  console.log(`Authentication benchmark:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Average time: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Requests/sec: ${(1000 / avgDuration).toFixed(2)}`);

  return {
    endpoint: '/api/v1/auth/login',
    iterations,
    avgDuration,
    p50Duration: calculatePercentile(totalTime, 50),
    p95Duration: calculatePercentile(totalTime, 95),
    avgDuration,
  };
}

export async function benchmarkOrderCreation() {
  console.log('Benchmarking order creation...');

  const token = await authenticateUser('rider');
  const orderData = {
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
  };

  let totalTime = 0;
  const iterations = 20;

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    const createRes = await createOrder(token, orderData);
    const duration = Date.now() - startTime;
    totalTime += duration;

    check(createRes, {
      'order created': (r) => r.status === 201,
    'has order id': (r) => r.json('id') !== undefined,
    });

    if (i % 5 === 0) {
      await fetchOrder(token, createRes.json('id'));
    }
  }

  const avgDuration = totalTime / iterations;
  console.log(`Order creation benchmark:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Average time: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Orders/sec: ${(1000 / avgDuration).toFixed(2)}`);

  return {
    endpoint: '/api/v1/orders',
    iterations,
    avgDuration,
    p50Duration: calculatePercentile(totalTime, 50),
    p95Duration: calculatePercentile(totalTime, 95),
    avgDuration,
  };
}

export async function benchmarkPricing() {
  console.log('Benchmarking pricing calculation...');

  const token = await authenticateUser('rider');
  const pricingParams = new URLSearchParams({
    vertical: 'RIDE',
    pickup_lat: '40.7128',
    pickup_lon: '-74.0060',
    dropoff_lat: '40.7614',
    dropoff_lon: '-73.9776',
  });

  let totalTime = 0;
  const iterations = 15;

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    const pricingRes = http.post(`${BASE_URL}/api/v1/pricing/calculate`, pricingParams.toString(), {
      tags: { name: 'calculate-price' },
    });

    const duration = Date.now() - startTime;
    totalTime += duration;

    check(pricingRes, {
      'pricing calculated': (r) => r.status === 200,
      'has fare': (r) => r.json('estimatedFare') !== undefined,
    });
  }

    await sleep(100); // Small delay between requests
  }

  const avgDuration = totalTime / iterations;
  console.log(`Pricing benchmark:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Average time: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Requests/sec: ${(1000 / avgDuration).toFixed(2)}`);

  return {
    endpoint: '/api/v1/pricing/calculate',
    iterations,
    avgDuration,
    p50Duration: calculatePercentile(totalTime, 50),
    p95Duration: calculatePercentile(totalTime, 95),
    avgDuration,
  };
}

export async function benchmarkMaps() {
  console.log('Benchmarking Maps API...');

  const token = await authenticateUser('rider');

  const locations = testLocations;
  let totalTime = 0;
  const iterations = 10;

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    // Geocode
    const geocodeRes = http.get(`${BASE_URL}/api/v1/maps/geocode?query=times+square,nyc`, {
      tags: { name: 'geocode' },
    });

    const geocodeDuration = Date.now() - startTime;
    totalTime += geocodeDuration;

    // Get route
    const routeRes = http.get(`${BASE_URL}/api/v1/maps/route?start_lat=${locations.timesSquare.lat}&start_lon=${locations.timesSquare.lon}&end_lat=${locations.centralPark.lat}&end_lon=${locations.centralPark.lon}`, {
      tags: { name: 'route' },
    });

    const routeDuration = Date.now() - geocodeDuration;
    totalTime += routeDuration;

    await sleep(50);
  }

  const avgDuration = totalTime / iterations;
  console.log(`Maps benchmark:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Average time: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Requests/sec: ${(1000 / avgDuration).toFixed(2)}`);

  return {
    endpoint: '/api/v1/maps',
    iterations,
    avgDuration,
    p50Duration: calculatePercentile(totalTime, 50),
    p95Duration: calculatePercentile(totalTime, 95),
    avgDuration,
  };
}

export async function benchmarkMatching() {
  console.log('Benchmarking matching service...');

  const token = await authenticateUser('rider');
  const orderId = generateOrderId();

  let totalTime = 0;
  const iterations = 10;

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    const matchingRes = http.post(`${BASE_URL}/api/v1/matching/find-drivers`, JSON.stringify({
      orderId: orderId,
      pickupLocation: {
        lat: 40.7128,
        lon: -74.0060,
      },
    }), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      tags: { name: 'find-drivers' },
    });

    const duration = Date.now() - startTime;
    totalTime += duration;

    check(matchingRes, {
      'drivers found': (r) => Array.isArray(r.json('drivers')),
      'has driver count': (r) => r.json('driverCount') !== undefined,
    });

    await sleep(100);
  }

  const avgDuration = totalTime / iterations;
  console.log(`Matching benchmark:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Average time: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Requests/sec: ${(1000 / avgDuration).toFixed(2)}`);

  return {
    endpoint: '/api/v1/matching',
    iterations,
    avgDuration,
    p50Duration: calculatePercentile(totalTime, 50),
    p95Duration: calculatePercentile(totalTime, 95),
    avgDuration,
  };
}

function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(percentile * sorted.length / 100);
  return sorted[index];
}

export default {
  benchmarkAuth,
  benchmarkOrderCreation,
  benchmarkPricing,
  benchmarkMaps,
  benchmarkMatching,
  calculatePercentile,
};
