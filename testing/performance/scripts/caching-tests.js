import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.TEST_BASE_URL || 'http://localhost:8020';
const REDIS_URL = __ENV.REDIS_URL || 'http://localhost:6379';

export let options = {
  vus: 10,
  duration: '60s',
  thresholds: {
    cache_hit_rate: ['rate>0.8'],
    cache_miss_rate: ['rate<0.2'],
    http_req_duration: ['p(95)<50'],
  },
};

export function setup() {
  const authRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'test-rider@example.com',
    password: 'TestPass123!',
  }));

  check(authRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  return {
    token: authRes.json('token'),
    userId: authRes.json('user').id,
  };
}

export function benchmarkCachingStrategies(config) {
  console.log('Benchmarking caching strategies...');

  const endpoints = [
    {
      name: 'user_profile',
      endpoint: `${BASE_URL}/api/v1/users/${config.userId}`,
      cacheable: true,
      ttl: 3600,
    },
    {
      name: 'order_history',
      endpoint: `${BASE_URL}/api/v1/orders`,
      cacheable: true,
      ttl: 300,
    },
    {
      name: 'nearby_drivers',
      endpoint: `${BASE_URL}/api/v1/location/drivers/nearby?lat=40.7128&lon=-74.0060&radius=5000`,
      cacheable: true,
      ttl: 30,
    },
    {
      name: 'pricing_estimate',
      endpoint: `${BASE_URL}/api/v1/pricing/calculate?vertical=RIDE&pickup_lat=40.7128&pickup_lon=-74.0060&dropoff_lat=40.7614&dropoff_lon=-73.9776`,
      cacheable: false,
      ttl: 0,
    },
    {
      name: 'trip_status',
      endpoint: `${BASE_URL}/api/v1/trips/trp_12345`,
      cacheable: true,
      ttl: 60,
    },
  ];

  const results = {
    endpoints: [],
    summary: {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      avgResponseTimeCached: 0,
      avgResponseTimeUncached: 0,
      avgResponseTimeOverall: 0,
    },
  };

  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint.name} (${endpoint.cacheable ? 'Cacheable' : 'Not Cacheable'})`);

    const endpointResults = {
      name: endpoint.name,
      endpoint: endpoint.endpoint,
      cacheable: endpoint.cacheable,
      ttl: endpoint.ttl,
      requests: [],
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTimeCached: 0,
      avgResponseTimeUncached: 0,
      cacheHitRate: 0,
      effectiveness: 'UNKNOWN',
    };

    if (endpoint.cacheable) {
      for (let i = 0; i < 10; i++) {
        const result = makeCachedRequest(config.token, endpoint);

        endpointResults.requests.push(result);

        if (result.fromCache) {
          endpointResults.cacheHits++;
          results.summary.cacheHits++;
        } else {
          endpointResults.cacheMisses++;
          results.summary.cacheMisses++;
        }

        sleep(100);
      }

      const cachedTimes = endpointResults.requests.filter(r => r.fromCache).map(r => r.duration);
      const uncachedTimes = endpointResults.requests.filter(r => !r.fromCache).map(r => r.duration);

      if (cachedTimes.length > 0) {
        endpointResults.avgResponseTimeCached = cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;
      }

      if (uncachedTimes.length > 0) {
        endpointResults.avgResponseTimeUncached = uncachedTimes.reduce((a, b) => a + b, 0) / uncachedTimes.length;
      }

      endpointResults.cacheHitRate = endpointResults.cacheHits / endpointResults.requests.length;

      if (endpointResults.cacheHitRate >= 0.9) {
        endpointResults.effectiveness = 'EXCELLENT';
      } else if (endpointResults.cacheHitRate >= 0.8) {
        endpointResults.effectiveness = 'GOOD';
      } else if (endpointResults.cacheHitRate >= 0.6) {
        endpointResults.effectiveness = 'FAIR';
      } else {
        endpointResults.effectiveness = 'POOR';
      }

      const speedup = endpointResults.avgResponseTimeUncached / endpointResults.avgResponseTimeCached;
      console.log(`  Cache Hit Rate: ${(endpointResults.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`  Cached Response Time: ${endpointResults.avgResponseTimeCached.toFixed(2)}ms`);
      console.log(`  Uncached Response Time: ${endpointResults.avgResponseTimeUncached.toFixed(2)}ms`);
      console.log(`  Speedup: ${speedup.toFixed(2)}x`);
      console.log(`  Effectiveness: ${endpointResults.effectiveness}`);
    } else {
      console.log(`  Not cacheable - always fetch from source`);

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();

        const res = http.get(endpoint.endpoint, {
          headers: {
            'Authorization': `Bearer ${config.token}`,
          },
          tags: { name: endpoint.name, type: 'uncached' },
        });

        const duration = Date.now() - startTime;

        endpointResults.requests.push({
          duration,
          fromCache: false,
          status: res.status,
        });

        sleep(100);
      }

      endpointResults.avgResponseTimeUncached = endpointResults.requests.reduce((a, b) => a + b.duration, 0) / endpointResults.requests.length;

      console.log(`  Response Time: ${endpointResults.avgResponseTimeUncached.toFixed(2)}ms`);
    }

    results.endpoints.push(endpointResults);
    results.summary.totalRequests += endpointResults.requests.length;
  }

  results.summary.cacheHitRate = results.summary.cacheHits / (results.summary.cacheHits + results.summary.cacheMisses);

  const allCachedTimes = results.endpoints
    .filter(e => e.cacheable)
    .flatMap(e => e.requests.filter(r => r.fromCache).map(r => r.duration));

  const allUncachedTimes = results.endpoints
    .flatMap(e => e.requests.filter(r => !r.fromCache).map(r => r.duration));

  if (allCachedTimes.length > 0) {
    results.summary.avgResponseTimeCached = allCachedTimes.reduce((a, b) => a + b, 0) / allCachedTimes.length;
  }

  if (allUncachedTimes.length > 0) {
    results.summary.avgResponseTimeUncached = allUncachedTimes.reduce((a, b) => a + b, 0) / allUncachedTimes.length;
  }

  results.summary.avgResponseTimeOverall = allUncachedTimes.reduce((a, b) => a + b, 0) / allUncachedTimes.length;

  return results;
}

function makeCachedRequest(token, endpoint) {
  const startTime = Date.now();

  const res = http.get(endpoint.endpoint, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'max-age=0',
    },
    tags: { name: endpoint.name, type: 'cached' },
  });

  const duration = Date.now() - startTime;
  const fromCache = checkCacheHit(res);

  return {
    duration,
    fromCache,
    status: res.status,
    responseHeaders: res.headers,
  };
}

function checkCacheHit(response) {
  const cacheControl = response.headers['Cache-Control'] || response.headers['cache-control'];
  const xCache = response.headers['X-Cache'] || response.headers['x-cache'];
  const age = response.headers['Age'] || response.headers['age'];

  if (xCache && xCache.includes('HIT')) {
    return true;
  }

  if (age && parseInt(age) > 0) {
    return true;
  }

  if (cacheControl && cacheControl.includes('max-age=0')) {
    return false;
  }

  return false;
}

export function analyzeCacheEffectiveness(results) {
  console.log('\n=== Cache Effectiveness Analysis ===');
  console.log(`Total Requests: ${results.summary.totalRequests}`);
  console.log(`Cache Hits: ${results.summary.cacheHits}`);
  console.log(`Cache Misses: ${results.summary.cacheMisses}`);
  console.log(`Cache Hit Rate: ${(results.summary.cacheHitRate * 100).toFixed(1)}%`);
  console.log(`Avg Cached Response Time: ${results.summary.avgResponseTimeCached.toFixed(2)}ms`);
  console.log(`Avg Uncached Response Time: ${results.summary.avgResponseTimeUncached.toFixed(2)}ms`);

  const speedup = results.summary.avgResponseTimeUncached / results.summary.avgResponseTimeCached;
  console.log(`Average Speedup: ${speedup.toFixed(2)}x`);

  if (results.summary.cacheHitRate >= 0.9) {
    console.log('\nOVERALL: EXCELLENT cache performance');
  } else if (results.summary.cacheHitRate >= 0.8) {
    console.log('\nOVERALL: GOOD cache performance');
  } else if (results.summary.cacheHitRate >= 0.6) {
    console.log('\nOVERALL: FAIR cache performance - consider increasing TTL');
  } else {
    console.log('\nOVERALL: POOR cache performance - review caching strategy');
  }

  return {
    overallHitRate: results.summary.cacheHitRate,
    overallSpeedup: speedup,
    recommendations: generateCacheRecommendations(results),
  };
}

function generateCacheRecommendations(results) {
  const recommendations = [];

  const poorCacheEndpoints = results.endpoints.filter(e => e.cacheable && e.cacheHitRate < 0.6);

  if (poorCacheEndpoints.length > 0) {
    recommendations.push({
      type: 'CONFIGURATION',
      priority: 'HIGH',
      message: `${poorCacheEndpoints.length} endpoints have poor cache hit rate (< 60%). Consider increasing TTL or using write-through caching.`,
    });
  }

  if (results.summary.avgResponseTimeCached > 50) {
    recommendations.push({
      type: 'PERFORMANCE',
      priority: 'HIGH',
      message: 'Cached response times are slow (> 50ms). Review Redis configuration and network latency.',
    });
  }

  if (results.summary.avgResponseTimeUncached > 200) {
    recommendations.push({
      type: 'PERFORMANCE',
      priority: 'MEDIUM',
      message: 'Uncached response times are slow (> 200ms). Review database queries and API performance.',
    });
  }

  const fairCacheEndpoints = results.endpoints.filter(e => e.cacheable && e.cacheHitRate >= 0.6 && e.cacheHitRate < 0.8);

  if (fairCacheEndpoints.length > 0) {
    recommendations.push({
      type: 'OPTIMIZATION',
      priority: 'MEDIUM',
      message: `${fairCacheEndpoints.length} endpoints have fair cache hit rate (60-80%). Consider optimizing cache keys and eviction policies.`,
    });
  }

  return recommendations;
}

export function testCacheInvalidation(config) {
  console.log('\n=== Testing Cache Invalidation ===');

  const orderId = 'test_order_' + Date.now();

  console.log('Step 1: Create order (cache miss)');
  const createRes = http.post(`${BASE_URL}/api/v1/orders`, JSON.stringify({
    vertical: 'RIDE',
    product: 'STANDARD',
    pickupLocation: { lat: 40.7128, lon: -74.0060 },
    dropoffLocation: { lat: 40.7614, lon: -73.9776 },
    paymentMethod: 'CARD',
  }), {
    headers: { 'Authorization': `Bearer ${config.token}` },
  });

  const createTime1 = Date.now() - createRes.timings.duration;

  check(createRes, {
    'order created': (r) => r.status === 201,
  });

  sleep(100);

  console.log('Step 2: Fetch order (cache hit expected)');
  const getRes1 = http.get(`${BASE_URL}/api/v1/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${config.token}` },
  });

  const getTime1 = Date.now() - getRes1.timings.duration;
  const cached1 = checkCacheHit(getRes1);

  console.log(`  Response time: ${getTime1}ms (cached: ${cached1})`);

  console.log('Step 3: Update order (should invalidate cache)');
  const updateRes = http.put(`${BASE_URL}/api/v1/orders/${orderId}`, JSON.stringify({
    status: 'ASSIGNED',
  }), {
    headers: { 'Authorization': `Bearer ${config.token}` },
  });

  check(updateRes, {
    'order updated': (r) => r.status === 200,
  });

  sleep(100);

  console.log('Step 4: Fetch order again (cache miss expected after invalidation)');
  const getRes2 = http.get(`${BASE_URL}/api/v1/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${config.token}` },
  });

  const getTime2 = Date.now() - getRes2.timings.duration;
  const cached2 = checkCacheHit(getRes2);

  console.log(`  Response time: ${getTime2}ms (cached: ${cached2})`);

  const invalidationCorrect = !cached2 && getTime2 > getTime1;

  if (invalidationCorrect) {
    console.log('✓ Cache invalidation working correctly');
  } else {
    console.log('✗ Cache invalidation FAILED - stale data may be served');
  }

  return {
    cacheInvalidationWorking: invalidationCorrect,
    createResponseTime: createTime1,
    firstGetResponseTime: getTime1,
    firstGetCached: cached1,
    secondGetResponseTime: getTime2,
    secondGetCached: cached2,
  };
}

export function generateCacheReport(results) {
  const effectiveness = analyzeCacheEffectiveness(results);

  return {
    timestamp: new Date().toISOString(),
    summary: results.summary,
    endpoints: results.endpoints,
    effectiveness: {
      overallHitRate: effectiveness.overallHitRate,
      overallSpeedup: effectiveness.overallSpeedup,
    },
    recommendations: effectiveness.recommendations,
  };
}

export default {
  setup,
  benchmarkCachingStrategies,
  testCacheInvalidation,
  generateCacheReport,
};
