import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8020';
const RAMP_DURATION = 60000; // 60 seconds
const STEADY_DURATION = 180000; // 3 minutes
const SPIKE_DURATION = 60000; // 60 seconds
const RECOVERY_DURATION = 30000; // 30 seconds

export let metrics = {
  requests: [],
  responses: [],
  errors: [],
  latencies: [],
  throughputs: [],
};

export let results = {
  apiResponseTimes: {},
  databaseQueryTimes: {},
  resourceUsage: {
    cpu: [],
    memory: [],
    network: [],
  },
};

export function resetMetrics() {
  metrics = {
    requests: [],
    responses: [],
    errors: [],
    latencies: [],
    throughputs: [],
  };
  results = {
    apiResponseTimes: {},
    databaseQueryTimes: {},
    resourceUsage: {
      cpu: [],
      memory: [],
      network: [],
    },
  };
}

function recordRequest(endpoint, method, startTime, status = null) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  metrics.requests.push({
    endpoint,
    method,
    duration,
    startTime,
    endTime,
    status,
  });

  return duration;
}

function recordResponse(endpoint, method, statusCode, startTime, endTime) {
  const duration = endTime - startTime;
  
  metrics.responses.push({
    endpoint,
    method,
    statusCode,
    duration,
    startTime,
    endTime,
  });
  
  results.apiResponseTimes[`${method}:${endpoint}`] = results.apiResponseTimes[`${method}:${endpoint}`] || [];
  results.apiResponseTimes[`${method}:${endpoint}`].push(duration);
  
  return duration;
}

function recordError(endpoint, method, error, startTime) {
  const endTime = Date.now();
  
  metrics.errors.push({
    endpoint,
    method,
    error: error.message,
    errorType: error.name || 'Unknown',
    startTime,
    endTime,
  });
}

export function calculatePercentiles(values, key = 'duration') {
  if (values.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.50);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return {
    [key]: {
      avg,
      p50: sorted[p50Index],
      p95: sorted[p95Index],
      p99: sorted[p99Index],
      min,
      max,
      count: values.length,
    },
  };
}

export function calculateThroughput(requests, duration) {
  const totalRequests = requests.length;
  const successfulRequests = requests.filter(r => r.status >= 200 && r.status < 300).length;
  
  const throughput = (successfulRequests / duration) * 1000;
  const requestsPerSecond = totalRequests / duration;
  
  return {
    throughput,
    requestsPerSecond,
    successRate: (successfulRequests / totalRequests) * 100,
    totalRequests,
    successfulRequests,
    failedRequests: totalRequests - successfulRequests,
  };
}

export function generateReport() {
  const responseTimes = Object.values(results.apiResponseTimes);
  const requestTimes = metrics.requests;
  const errorCount = metrics.errors.length;
  
  const allTimes = [
    ...requestTimes.filter(r => r.duration !== undefined).map(r => r.duration),
    ...responseTimes.filter(r => r !== undefined).map(r => r),
  ];
  
  const { p50, p95, p99, avg, min, max } = calculatePercentiles(allTimes);
  
  const errorRate = (errorCount / metrics.requests.length) * 100;
  
  const throughput = calculateThroughput(metrics.requests, 60000); // 1 minute
  
  return {
    summary: {
      totalRequests: metrics.requests.length,
      successfulRequests: metrics.requests.length - errorCount,
      failedRequests: errorCount,
      errorRate: `${errorRate.toFixed(2)}%`,
      avgResponseTime: `${avg.toFixed(2)}ms`,
      p95ResponseTime: `${p95}ms`,
      p99ResponseTime: `${p99}ms`,
      minResponseTime: `${min}ms`,
      maxResponseTime: `${max}ms`,
    },
    endpoints: calculatePercentiles(allTimes),
    errors: metrics.errors.map(e => ({
      endpoint: e.endpoint,
      method: e.method,
      error: e.error,
      timestamp: e.endTime,
    })),
    recommendations: [],
    timestamp: new Date().toISOString(),
  };
}
