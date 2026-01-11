import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.TEST_BASE_URL || 'http://localhost:8020';
const DB_ADMIN_URL = __ENV.DB_ADMIN_URL || 'http://localhost:8023';

export let options = {
  vus: 10,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<100'],
    db_query_duration: ['p(95)<100'],
    db_rows_scanned: ['p(95)<1000'],
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

  return authRes.json('token');
}

export function benchmarkDatabaseQueries(token) {
  console.log('Benchmarking database queries...');

  const queries = [
    {
      name: 'get_user_by_email',
      endpoint: `${BASE_URL}/api/v1/auth/me`,
      expectedDuration: 50,
      expectedRows: 1,
    },
    {
      name: 'get_orders_by_user',
      endpoint: `${BASE_URL}/api/v1/orders`,
      expectedDuration: 100,
      expectedRows: 10,
    },
    {
      name: 'get_order_by_id',
      endpoint: `${BASE_URL}/api/v1/orders/ord_12345`,
      expectedDuration: 50,
      expectedRows: 1,
    },
    {
      name: 'get_nearby_drivers',
      endpoint: `${BASE_URL}/api/v1/location/drivers/nearby?lat=40.7128&lon=-74.0060&radius=5000`,
      expectedDuration: 200,
      expectedRows: 50,
    },
    {
      name: 'get_trip_by_order',
      endpoint: `${BASE_URL}/api/v1/trips?order_id=ord_12345`,
      expectedDuration: 75,
      expectedRows: 1,
    },
    {
      name: 'get_payment_history',
      endpoint: `${BASE_URL}/api/v1/payments`,
      expectedDuration: 150,
      expectedRows: 20,
    },
  ];

  const results = {
    queries: [],
    summary: {
      totalQueries: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      slowQueries: 0,
      expensiveQueries: 0,
    },
  };

  for (const query of queries) {
    const durations = [];
    const rowCounts = [];

    for (let i = 0; i < 20; i++) {
      const startTime = Date.now();

      const res = http.get(query.endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        tags: { name: query.name, type: 'db-query' },
      });

      const duration = Date.now() - startTime;
      durations.push(duration);

      check(res, {
        [`${query.name} successful`]: (r) => r.status === 200,
      });

      const rowCount = extractRowCount(res);
      rowCounts.push(rowCount);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const p95Duration = calculatePercentile(durations, 95);
    const p99Duration = calculatePercentile(durations, 99);
    const avgRows = rowCounts.reduce((a, b) => a + b, 0) / rowCounts.length;

    const queryResult = {
      name: query.name,
      endpoint: query.endpoint,
      avgDuration: avgDuration.toFixed(2),
      minDuration: minDuration,
      maxDuration: maxDuration,
      p95Duration: p95Duration,
      p99Duration: p99Duration,
      avgRows: avgRows.toFixed(0),
      expectedDuration: query.expectedDuration,
      expectedRows: query.expectedRows,
      isSlow: avgDuration > query.expectedDuration * 2,
      isExpensive: avgRows > query.expectedRows * 2,
      status: avgDuration <= query.expectedDuration ? 'GOOD' : 'SLOW',
    };

    results.queries.push(queryResult);

    if (queryResult.isSlow) {
      results.summary.slowQueries++;
    }
    if (queryResult.isExpensive) {
      results.summary.expensiveQueries++;
    }

    results.summary.totalQueries++;
    results.summary.avgDuration += avgDuration;
    results.summary.maxDuration = Math.max(results.summary.maxDuration, maxDuration);
    results.summary.minDuration = Math.min(results.summary.minDuration, minDuration);
  }

  results.summary.avgDuration = results.summary.avgDuration / results.queries.length;

  console.log('\n=== Database Query Benchmark Results ===');
  console.log(`Total Queries: ${results.summary.totalQueries}`);
  console.log(`Average Duration: ${results.summary.avgDuration.toFixed(2)}ms`);
  console.log(`Max Duration: ${results.summary.maxDuration}ms`);
  console.log(`Min Duration: ${results.summary.minDuration}ms`);
  console.log(`Slow Queries: ${results.summary.slowQueries}`);
  console.log(`Expensive Queries: ${results.summary.expensiveQueries}`);
  console.log('\n=== Query Details ===');

  for (const query of results.queries) {
    console.log(`\n${query.name}:`);
    console.log(`  Status: ${query.status}`);
    console.log(`  Avg Duration: ${query.avgDuration}ms (expected: ${query.expectedDuration}ms)`);
    console.log(`  P95 Duration: ${query.p95Duration}ms`);
    console.log(`  P99 Duration: ${query.p99Duration}ms`);
    console.log(`  Avg Rows: ${query.avgRows} (expected: ${query.expectedRows})`);
    console.log(`  Slow: ${query.isSlow ? 'YES' : 'NO'}`);
    console.log(`  Expensive: ${query.isExpensive ? 'YES' : 'NO'}`);
  }

  return results;
}

export function getQueryPlan(queryName) {
  const res = http.get(`${DB_ADMIN_URL}/api/v1/query-plan?query=${queryName}`);

  if (res.status === 200) {
    return res.json('plan');
  }

  return null;
}

export function analyzeSlowQueries(results) {
  console.log('\n=== Slow Query Analysis ===');

  const slowQueries = results.queries.filter(q => q.isSlow);
  const expensiveQueries = results.queries.filter(q => q.isExpensive);

  if (slowQueries.length === 0 && expensiveQueries.length === 0) {
    console.log('No slow or expensive queries detected!');
    return;
  }

  for (const query of slowQueries) {
    console.log(`\nSLOW QUERY: ${query.name}`);
    console.log(`  Avg Duration: ${query.avgDuration}ms (expected: ${query.expectedDuration}ms)`);
    console.log(`  P95 Duration: ${query.p95Duration}ms`);
    console.log(`  P99 Duration: ${query.p99Duration}ms`);

    const plan = getQueryPlan(query.name);
    if (plan) {
      console.log('  Query Plan:');
      console.log(`    Plan Type: ${plan.planType}`);
      console.log(`    Index Used: ${plan.indexUsed ? 'YES' : 'NO'}`);
      console.log(`    Seq Scan: ${plan.seqScan ? 'YES' : 'NO'}`);
      console.log(`    Rows Scanned: ${plan.rowsScanned}`);

      if (!plan.indexUsed || plan.seqScan) {
        console.log('  RECOMMENDATION: Add index on relevant columns');
      }
    } else {
      console.log('  RECOMMENDATION: Analyze query plan and add appropriate index');
    }
  }

  for (const query of expensiveQueries) {
    console.log(`\nEXPENSIVE QUERY: ${query.name}`);
    console.log(`  Avg Rows: ${query.avgRows} (expected: ${query.expectedRows})`);
    console.log(`  Ratio: ${(query.avgRows / query.expectedRows).toFixed(2)}x expected`);

    const plan = getQueryPlan(query.name);
    if (plan) {
      console.log('  Query Plan:');
      console.log(`    Plan Type: ${plan.planType}`);
      console.log(`    Index Used: ${plan.indexUsed ? 'YES' : 'NO'}`);
      console.log(`    Rows Scanned: ${plan.rowsScanned}`);

      if (!plan.indexUsed) {
        console.log('  RECOMMENDATION: Add index to reduce rows scanned');
      }

      if (plan.rowsScanned > 10000) {
        console.log('  RECOMMENDATION: Consider pagination or partitioning');
      }
    } else {
      console.log('  RECOMMENDATION: Analyze query plan and optimize');
    }
  }
}

export function generateDatabaseReport(results) {
  return {
    timestamp: new Date().toISOString(),
    summary: results.summary,
    queries: results.queries,
    recommendations: generateRecommendations(results),
  };
}

function generateRecommendations(results) {
  const recommendations = [];

  const slowQueries = results.queries.filter(q => q.isSlow);
  const expensiveQueries = results.queries.filter(q => q.isExpensive);

  if (slowQueries.length > 0) {
    recommendations.push({
      type: 'PERFORMANCE',
      priority: 'HIGH',
      message: `Found ${slowQueries.length} slow queries. Analyze and add indexes where needed.`,
    });
  }

  if (expensiveQueries.length > 0) {
    recommendations.push({
      type: 'OPTIMIZATION',
      priority: 'HIGH',
      message: `Found ${expensiveQueries.length} expensive queries. Consider pagination or partitioning.`,
    });
  }

  if (results.summary.avgDuration > 100) {
    recommendations.push({
      type: 'PERFORMANCE',
      priority: 'MEDIUM',
      message: 'Average query duration > 100ms. Review overall database performance.',
    });
  }

  return recommendations;
}

function extractRowCount(response) {
  try {
    if (response.json('data') && Array.isArray(response.json('data'))) {
      return response.json('data').length;
    }
    if (response.json('count') !== undefined) {
      return response.json('count');
    }
    if (response.json('total') !== undefined) {
      return response.json('total');
    }
    return 1;
  } catch (error) {
    return 0;
  }
}

function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(percentile * sorted.length / 100);

  return sorted[index];
}

export default {
  setup,
  benchmarkDatabaseQueries,
  getQueryPlan,
  analyzeSlowQueries,
  generateDatabaseReport,
};
