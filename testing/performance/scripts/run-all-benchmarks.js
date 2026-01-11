#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const REPORT_DIR = path.join(__dirname, '../../reports/performance');
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8020';

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

console.log('=================================================');
console.log('Tripo04OS Performance Benchmark Suite');
console.log('=================================================\n');
console.log(`Test Environment: ${BASE_URL}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Report Directory: ${REPORT_DIR}\n`);

const results = {
  timestamp: new Date().toISOString(),
  environment: BASE_URL,
  benchmarks: {},
  summary: {},
  recommendations: [],
};

async function runBenchmark(name, scriptPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${name}`);
  console.log('='.repeat(60));

  try {
    const output = execSync(`node ${scriptPath}`, {
      env: { ...process.env, TEST_BASE_URL: BASE_URL },
      encoding: 'utf-8',
      timeout: 300000,
    });

    console.log(`✓ ${name} completed successfully`);

    try {
      const jsonOutput = JSON.parse(output);
      return { success: true, data: jsonOutput };
    } catch (parseError) {
      console.log(`Warning: Could not parse JSON output from ${name}`);
      return { success: true, data: { output } };
    }
  } catch (error) {
    console.error(`✗ ${name} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAPIBenchmarks() {
  console.log('\n=== API Performance Benchmarks ===');

  const benchmarks = [
    {
      name: 'Authentication Benchmark',
      script: path.join(__dirname, './api-benchmark.js'),
    },
    {
      name: 'Order Creation Benchmark',
      script: path.join(__dirname, './api-benchmark.js'),
    },
    {
      name: 'Pricing Calculation Benchmark',
      script: path.join(__dirname, './api-benchmark.js'),
    },
    {
      name: 'Maps API Benchmark',
      script: path.join(__dirname, './api-benchmark.js'),
    },
    {
      name: 'Matching Service Benchmark',
      script: path.join(__dirname, './api-benchmark.js'),
    },
  ];

  for (const benchmark of benchmarks) {
    const result = await runBenchmark(benchmark.name, benchmark.script);

    if (result.success) {
      results.benchmarks[benchmark.name] = result.data;
    } else {
      results.benchmarks[benchmark.name] = { error: result.error };
    }
  }
}

async function runDatabaseProfiling() {
  console.log('\n=== Database Query Profiling ===');

  const scriptPath = path.join(__dirname, './db-profiling.js');
  const result = await runBenchmark('Database Query Profiling', scriptPath);

  if (result.success) {
    results.benchmarks['Database Profiling'] = result.data;

    const slowQueries = result.data.queries.filter(q => q.isSlow);
    const expensiveQueries = result.data.queries.filter(q => q.isExpensive);

    if (slowQueries.length > 0) {
      results.recommendations.push({
        type: 'DATABASE',
        priority: 'HIGH',
        benchmark: 'Database Profiling',
        message: `Found ${slowQueries.length} slow queries. Add indexes and optimize queries.`,
      });
    }

    if (expensiveQueries.length > 0) {
      results.recommendations.push({
        type: 'DATABASE',
        priority: 'HIGH',
        benchmark: 'Database Profiling',
        message: `Found ${expensiveQueries.length} expensive queries. Consider pagination.`,
      });
    }
  } else {
    results.benchmarks['Database Profiling'] = { error: result.error };
  }
}

async function runCachingTests() {
  console.log('\n=== Caching Strategy Tests ===');

  const scriptPath = path.join(__dirname, './caching-tests.js');
  const result = await runBenchmark('Caching Strategy Tests', scriptPath);

  if (result.success) {
    results.benchmarks['Caching Tests'] = result.data;

    if (result.data.effectiveness.overallHitRate < 0.8) {
      results.recommendations.push({
        type: 'CACHE',
        priority: 'HIGH',
        benchmark: 'Caching Tests',
        message: `Cache hit rate ${(result.data.effectiveness.overallHitRate * 100).toFixed(1)}% is below target (80%). Review caching strategy.`,
      });
    }

    if (result.data.summary.avgResponseTimeUncached > 200) {
      results.recommendations.push({
        type: 'PERFORMANCE',
        priority: 'MEDIUM',
        benchmark: 'Caching Tests',
        message: 'Uncached response times are slow (> 200ms). Review API performance.',
      });
    }
  } else {
    results.benchmarks['Caching Tests'] = { error: result.error };
  }
}

async function runDistributedTracingTests() {
  console.log('\n=== Distributed Tracing Tests ===');

  const scriptPath = path.join(__dirname, './distributed-tracing.js');
  const result = await runBenchmark('Distributed Tracing Tests', scriptPath);

  if (result.success) {
    results.benchmarks['Distributed Tracing'] = result.data;

    if (result.data.summary.p95Duration > 500) {
      results.recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        benchmark: 'Distributed Tracing',
        message: `P95 trace duration ${result.data.summary.p95Duration}ms exceeds target (500ms).`,
      });
    }

    if (result.data.summary.p99Duration > 1000) {
      results.recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        benchmark: 'Distributed Tracing',
        message: `P99 trace duration ${result.data.summary.p99Duration}ms exceeds target (1000ms).`,
      });
    }
  } else {
    results.benchmarks['Distributed Tracing'] = { error: result.error };
  }
}

function generateSummary() {
  console.log('\n\n=== Performance Baseline Summary ===');

  const apiBenchmarks = Object.entries(results.benchmarks)
    .filter(([name]) =>
      [
        'Authentication Benchmark',
        'Order Creation Benchmark',
        'Pricing Calculation Benchmark',
        'Maps API Benchmark',
        'Matching Service Benchmark',
      ].includes(name)
    )
    .map(([_, data]) => data);

  results.summary = {
    totalBenchmarks: Object.keys(results.benchmarks).length,
    successfulBenchmarks: Object.values(results.benchmarks).filter(b => !b.error).length,
    failedBenchmarks: Object.values(results.benchmarks).filter(b => b.error).length,
    recommendations: results.recommendations.length,
    highPriorityRecommendations: results.recommendations.filter(r => r.priority === 'HIGH').length,
    mediumPriorityRecommendations: results.recommendations.filter(r => r.priority === 'MEDIUM').length,
  };

  console.log(`\nTotal Benchmarks: ${results.summary.totalBenchmarks}`);
  console.log(`Successful: ${results.summary.successfulBenchmarks}`);
  console.log(`Failed: ${results.summary.failedBenchmarks}`);
  console.log(`Recommendations: ${results.summary.recommendations}`);
  console.log(`  High Priority: ${results.summary.highPriorityRecommendations}`);
  console.log(`  Medium Priority: ${results.summary.mediumPriorityRecommendations}`);

  if (results.benchmarks['Database Profiling'] && !results.benchmarks['Database Profiling'].error) {
    const dbSummary = results.benchmarks['Database Profiling'].summary;
    console.log(`\nDatabase Performance:`);
    console.log(`  Avg Query Duration: ${dbSummary.avgDuration.toFixed(2)}ms`);
    console.log(`  Slow Queries: ${dbSummary.slowQueries}`);
    console.log(`  Expensive Queries: ${dbSummary.expensiveQueries}`);
  }

  if (results.benchmarks['Caching Tests'] && !results.benchmarks['Caching Tests'].error) {
    const cacheSummary = results.benchmarks['Caching Tests'].summary;
    console.log(`\nCache Performance:`);
    console.log(`  Cache Hit Rate: ${(cacheSummary.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`  Avg Cached Time: ${cacheSummary.avgResponseTimeCached.toFixed(2)}ms`);
    console.log(`  Avg Uncached Time: ${cacheSummary.avgResponseTimeUncached.toFixed(2)}ms`);
  }

  if (results.benchmarks['Distributed Tracing'] && !results.benchmarks['Distributed Tracing'].error) {
    const traceSummary = results.benchmarks['Distributed Tracing'].summary;
    console.log(`\nDistributed Tracing Performance:`);
    console.log(`  Avg Trace Duration: ${traceSummary.avgDuration.toFixed(2)}ms`);
    console.log(`  P95 Trace Duration: ${traceSummary.p95Duration}ms`);
    console.log(`  P99 Trace Duration: ${traceSummary.p99Duration}ms`);
    console.log(`  Slow Traces: ${traceSummary.slowTraces}`);
  }
}

function generateRecommendationsSummary() {
  if (results.recommendations.length === 0) {
    console.log('\n✓ No recommendations - All performance targets met!');
    return;
  }

  console.log('\n\n=== Recommendations ===\n');

  const highPriority = results.recommendations.filter(r => r.priority === 'HIGH');
  const mediumPriority = results.recommendations.filter(r => r.priority === 'MEDIUM');

  if (highPriority.length > 0) {
    console.log('HIGH PRIORITY:\n');
    for (const rec of highPriority) {
      console.log(`  [${rec.type}] ${rec.message}`);
    }
  }

  if (mediumPriority.length > 0) {
    console.log('\nMEDIUM PRIORITY:\n');
    for (const rec of mediumPriority) {
      console.log(`  [${rec.type}] ${rec.message}`);
    }
  }
}

function saveReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `performance-baseline-${timestamp}.json`;
  const filepath = path.join(REPORT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\n\nReport saved to: ${filepath}`);
}

async function main() {
  try {
    await runAPIBenchmarks();
    await runDatabaseProfiling();
    await runCachingTests();
    await runDistributedTracingTests();

    generateSummary();
    generateRecommendationsSummary();
    saveReport();

    console.log('\n=================================================');
    console.log('Performance Benchmark Suite Complete');
    console.log('=================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  }
}

main();
