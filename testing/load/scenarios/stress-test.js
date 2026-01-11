import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.TEST_BASE_URL || 'http://localhost:8020';
const MAX_USERS = parseInt(__ENV.LOAD_TEST_MAX_VUS || '2000');

export function stressTest(token, startUsers = 500) {
  console.log(`Starting stress test: ${startUsers} → ${MAX_USERS} users, incrementing by 100 every 2 min`);

  let currentUsers = startUsers;
  let failurePoint = null;
  let totalRequests = 0;

  while (currentUsers <= MAX_USERS) {
    const startTime = Date.now();
    const requests = [];

    for (let i = 0; i < currentUsers; i++) {
      const startTime = Date.now();
      const orderRes = http.post(
        `${BASE_URL}/api/v1/orders`,
        JSON.stringify({
          vertical: 'RIDE',
          product: 'STANDARD',
          pickupLocation: { lat: 40.7128, lon: -74.0060 },
          dropoffLocation: { { lat: 40.7614, lon: -73.9776 },
          paymentMethod: 'CARD',
        }),
      );

      requests.push({
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        responseTime: Date.now() - startTime,
        status: orderRes.status,
        error: orderRes.status !== 200 ? orderRes.statusText : undefined,
      });

      if (orderRes.status >= 500) {
        console.error(`Stress test failed at ${currentUsers} users: ${orderRes.statusText}`);
        failurePoint = { users: currentUsers, requests: totalRequests };
        break;
      }

      totalRequests++;
    }

    if (failurePoint) {
      break;
    }

    currentUsers += 100;
    console.log(`Stress test: ${currentUsers} users completed, ${totalRequests} total requests`);

    // Wait 30 seconds before next ramp-up
    check(() => totalRequests < 100000, 'Total requests too high, stopping test');
    sleep(30000);
  }

  return {
    failurePoint,
    maxUsers: currentUsers,
    totalRequests,
    maxRequestRate: totalRequests / 300, // Approx 3.33 requests/sec at end
  };
}

export function analyzeCapacityLimits(results) {
  console.log('\n=== Capacity Limits Analysis ===\n');

  const maxLoad = results.maxUsers || 0;
  const maxRequestRate = results.maxRequestRate || 0;
  const failurePoint = results.failurePoint || null;

  console.log(`Max Users Handled: ${maxLoad}`);
  console.log(`Max Request Rate: ${maxRequestRate.toFixed(2)} requests/sec`);

  if (failurePoint) {
    console.log(`First Failure Point:`);
    console.log(`  Users: ${failurePoint.users}`);
    console.log(`  Total Requests: ${failurePoint.requests}`);
    console.log(`  Error: ${failurePoint.error}`);
    console.log(`  Reason: System or infrastructure failure`);
  }

  // Calculate capacity recommendations
  console.log('\nCapacity Recommendations:');

  if (maxLoad >= 1000) {
    console.log(`✅ Can handle ${maxLoad} concurrent users`);
    console.log(`   Need: Auto-scaling enabled for ${maxLoad}+ capacity`);
  }

  if (maxRequestRate > 100) {
    console.log(`✅ Can handle ${maxRequestRate.toFixed(2)} requests/sec`);
    console.log(`   Need: Rate limiting or CDN for caching`);
  }

  if (failurePoint && failurePoint.users >= 500) {
    console.log(`⚠️ Failed at ${failurePoint.users} users`);
    console.log(`   Current infrastructure limited to < 500 users`);
    console.log(`   Need: Horizontal scaling, database sharding`);
  }

  return {
    recommendedMaxUsers: Math.min(maxLoad * 0.8, 10000), // 80% of failure point
    recommendedAutoScale: {
      minInstances: Math.floor(maxLoad / 10),
      maxInstances: Math.floor(maxLoad / 5),
      targetCPU: 60,
      targetMemory: 70,
    },
  };
}

export default {
  stressTest,
  analyzeCapacityLimits,
};
