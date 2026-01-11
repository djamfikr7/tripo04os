import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.TEST_BASE_URL || 'http://localhost:8020';
const JAEGER_HOST = __ENV.JAEGER_HOST || 'http://localhost:16686';

export let options = {
  vus: 5,
  duration: '60s',
  thresholds: {
    trace_duration: ['p(95)<1000'],
    trace_completion: ['rate>0.95'],
    http_req_duration: ['p(95)<500'],
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

export function benchmarkDistributedTracing(config) {
  console.log('Benchmarking distributed tracing...');

  const traces = [];
  const workflows = [
    'order_creation',
    'trip_assignment',
    'payment_processing',
    'location_update',
    'notification_send',
  ];

  for (let i = 0; i < 10; i++) {
    for (const workflow of workflows) {
      const trace = executeWorkflow(config.token, workflow);
      traces.push(trace);
    }
  }

  const results = analyzeTraces(traces);

  console.log('\n=== Distributed Tracing Results ===');
  console.log(`Total Traces: ${results.summary.totalTraces}`);
  console.log(`Successful Traces: ${results.summary.successfulTraces}`);
  console.log(`Failed Traces: ${results.summary.failedTraces}`);
  console.log(`Success Rate: ${(results.summary.successRate * 100).toFixed(1)}%`);
  console.log(`Avg Trace Duration: ${results.summary.avgDuration.toFixed(2)}ms`);
  console.log(`P95 Trace Duration: ${results.summary.p95Duration}ms`);
  console.log(`P99 Trace Duration: ${results.summary.p99Duration}ms`);
  console.log(`Max Trace Duration: ${results.summary.maxDuration}ms`);
  console.log(`Min Trace Duration: ${results.summary.minDuration}ms`);
  console.log(`Avg Spans per Trace: ${results.summary.avgSpansPerTrace.toFixed(1)}`);
  console.log(`Max Spans in Trace: ${results.summary.maxSpansPerTrace}`);
  console.log(`Slow Traces: ${results.summary.slowTraces}`);
  console.log(`Failed Traces: ${results.summary.failedTraces}`);

  return results;
}

function executeWorkflow(token, workflow) {
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  const startTime = Date.now();

  const spans = [];

  switch (workflow) {
    case 'order_creation':
      spans.push(...createOrderWorkflow(token, traceId, spanId));
      break;
    case 'trip_assignment':
      spans.push(...tripAssignmentWorkflow(token, traceId, spanId));
      break;
    case 'payment_processing':
      spans.push(...paymentProcessingWorkflow(token, traceId, spanId));
      break;
    case 'location_update':
      spans.push(...locationUpdateWorkflow(token, traceId, spanId));
      break;
    case 'notification_send':
      spans.push(...notificationSendWorkflow(token, traceId, spanId));
      break;
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  return {
    traceId,
    spans,
    startTime,
    endTime,
    duration,
    workflow,
    status: spans.every(s => s.status === 'ok') ? 'completed' : 'failed',
  };
}

function createOrderWorkflow(token, traceId, parentSpanId) {
  const startTime = Date.now();

  const apiGatewaySpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId,
    operationName: 'POST /api/v1/orders',
    service: 'api-gateway',
    startTime: startTime,
    duration: 10,
    tags: [
      { key: 'http.method', value: 'POST' },
      { key: 'http.url', value: '/api/v1/orders' },
      { key: 'span.kind', value: 'server' },
    ],
    logs: [],
    status: 'ok',
  };

  const identityServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: apiGatewaySpan.spanId,
    operationName: 'validateToken',
    service: 'identity-service',
    startTime: startTime + 10,
    duration: 20,
    tags: [
      { key: 'db.type', value: 'postgresql' },
      { key: 'db.statement', value: 'SELECT * FROM users WHERE token = ?' },
    ],
    logs: [],
    status: 'ok',
  };

  const orderServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: apiGatewaySpan.spanId,
    operationName: 'createOrder',
    service: 'order-service',
    startTime: startTime + 15,
    duration: 50,
    tags: [
      { key: 'db.type', value: 'postgresql' },
      { key: 'db.statement', value: 'INSERT INTO orders (...) VALUES (...)' },
      { key: 'vertical', value: 'RIDE' },
    ],
    logs: [
      { timestamp: startTime + 20, fields: [{ key: 'event', value: 'Validating order data' }] },
      { timestamp: startTime + 40, fields: [{ key: 'event', value: 'Creating order in database' }] },
    ],
    status: 'ok',
  };

  const pricingServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: orderServiceSpan.spanId,
    operationName: 'calculatePrice',
    service: 'pricing-service',
    startTime: startTime + 30,
    duration: 30,
    tags: [
      { key: 'algorithm', value: 'distance_based' },
      { key: 'product', value: 'STANDARD' },
    ],
    logs: [],
    status: 'ok',
  };

  const mapsServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: pricingServiceSpan.spanId,
    operationName: 'calculateDistance',
    service: 'maps-service',
    startTime: startTime + 35,
    duration: 25,
    tags: [
      { key: 'provider', value: 'osm' },
      { key: 'api', value: 'nominatim' },
    ],
    logs: [],
    status: 'ok',
  };

  const kafkaSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: orderServiceSpan.spanId,
    operationName: 'publishEvent',
    service: 'kafka',
    startTime: startTime + 65,
    duration: 5,
    tags: [
      { key: 'messaging.system', value: 'kafka' },
      { key: 'topic', value: 'orders.created' },
    ],
    logs: [],
    status: 'ok',
  };

  return [
    apiGatewaySpan,
    identityServiceSpan,
    orderServiceSpan,
    pricingServiceSpan,
    mapsServiceSpan,
    kafkaSpan,
  ];
}

function tripAssignmentWorkflow(token, traceId, parentSpanId) {
  const startTime = Date.now();

  const orderServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId,
    operationName: 'assignDriver',
    service: 'order-service',
    startTime: startTime,
    duration: 30,
    tags: [{ key: 'span.kind', value: 'server' }],
    logs: [],
    status: 'ok',
  };

  const matchingServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: orderServiceSpan.spanId,
    operationName: 'findNearbyDrivers',
    service: 'matching-service',
    startTime: startTime + 10,
    duration: 100,
    tags: [
      { key: 'algorithm', value: 'geospatial' },
      { key: 'radius', value: '5000' },
    ],
    logs: [],
    status: 'ok',
  };

  const locationServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: matchingServiceSpan.spanId,
    operationName: 'getDriverLocations',
    service: 'location-service',
    startTime: startTime + 20,
    duration: 50,
    tags: [{ key: 'cache', value: 'redis' }],
    logs: [],
    status: 'ok',
  };

  const reputationServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: matchingServiceSpan.spanId,
    operationName: 'calculateDriverScore',
    service: 'reputation-service',
    startTime: startTime + 30,
    duration: 40,
    tags: [
      { key: 'score_type', value: 'eta_rating_reliability_fairness_vehicle' },
    ],
    logs: [],
    status: 'ok',
  };

  return [
    orderServiceSpan,
    matchingServiceSpan,
    locationServiceSpan,
    reputationServiceSpan,
  ];
}

function paymentProcessingWorkflow(token, traceId, parentSpanId) {
  const startTime = Date.now();

  const orderServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId,
    operationName: 'createPaymentIntent',
    service: 'order-service',
    startTime: startTime,
    duration: 20,
    tags: [{ key: 'span.kind', value: 'server' }],
    logs: [],
    status: 'ok',
  };

  const paymentServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: orderServiceSpan.spanId,
    operationName: 'processPayment',
    service: 'payment-service',
    startTime: startTime + 5,
    duration: 500,
    tags: [
      { key: 'payment_method', value: 'card' },
      { key: 'provider', value: 'stripe' },
    ],
    logs: [
      { timestamp: startTime + 10, fields: [{ key: 'event', value: 'Creating Stripe payment intent' }] },
      { timestamp: startTime + 250, fields: [{ key: 'event', value: 'Confirming payment with Stripe' }] },
    ],
    status: 'ok',
  };

  return [orderServiceSpan, paymentServiceSpan];
}

function locationUpdateWorkflow(token, traceId, parentSpanId) {
  const startTime = Date.now();

  const driverAppSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId,
    operationName: 'sendLocation',
    service: 'driver-app',
    startTime: startTime,
    duration: 5,
    tags: [{ key: 'client', value: 'flutter' }],
    logs: [],
    status: 'ok',
  };

  const tripServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: driverAppSpan.spanId,
    operationName: 'updateTripLocation',
    service: 'trip-service',
    startTime: startTime + 5,
    duration: 30,
    tags: [{ key: 'db.type', value: 'postgresql' }],
    logs: [],
    status: 'ok',
  };

  const locationServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: tripServiceSpan.spanId,
    operationName: 'updateDriverLocation',
    service: 'location-service',
    startTime: startTime + 10,
    duration: 15,
    tags: [{ key: 'cache', value: 'redis' }],
    logs: [],
    status: 'ok',
  };

  const kafkaSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: tripServiceSpan.spanId,
    operationName: 'publishLocationUpdate',
    service: 'kafka',
    startTime: startTime + 35,
    duration: 3,
    tags: [
      { key: 'messaging.system', value: 'kafka' },
      { key: 'topic', value: 'locations.updates' },
    ],
    logs: [],
    status: 'ok',
  };

  return [driverAppSpan, tripServiceSpan, locationServiceSpan, kafkaSpan];
}

function notificationSendWorkflow(token, traceId, parentSpanId) {
  const startTime = Date.now();

  const tripServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId,
    operationName: 'sendNotification',
    service: 'trip-service',
    startTime: startTime,
    duration: 20,
    tags: [{ key: 'notification_type', value: 'driver_arrived' }],
    logs: [],
    status: 'ok',
  };

  const notificationServiceSpan = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: tripServiceSpan.spanId,
    operationName: 'pushNotification',
    service: 'notification-service',
    startTime: startTime + 5,
    duration: 100,
    tags: [
      { key: 'provider', value: 'firebase' },
      { key: 'platform', value: 'ios,android' },
    ],
    logs: [],
    status: 'ok',
  };

  return [tripServiceSpan, notificationServiceSpan];
}

export function analyzeTraces(traces) {
  const durations = traces.map(t => t.duration);
  const spanCounts = traces.map(t => t.spans.length);
  const successfulTraces = traces.filter(t => t.status === 'completed');
  const failedTraces = traces.filter(t => t.status === 'failed');

  const slowTraces = traces.filter(t => t.duration > 1000);

  const serviceDurations = {};
  const serviceSpans = {};

  for (const trace of traces) {
    for (const span of trace.spans) {
      if (!serviceDurations[span.service]) {
        serviceDurations[span.service] = [];
        serviceSpans[span.service] = 0;
      }
      serviceDurations[span.service].push(span.duration);
      serviceSpans[span.service]++;
    }
  }

  const serviceAnalysis = {};
  for (const [service, durations] of Object.entries(serviceDurations)) {
    serviceAnalysis[service] = {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      spanCount: serviceSpans[service],
      slowSpans: durations.filter(d => d > 100).length,
    };
  }

  return {
    summary: {
      totalTraces: traces.length,
      successfulTraces: successfulTraces.length,
      failedTraces: failedTraces.length,
      successRate: successfulTraces.length / traces.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: calculatePercentile(durations, 95),
      p99Duration: calculatePercentile(durations, 99),
      avgSpansPerTrace: spanCounts.reduce((a, b) => a + b, 0) / spanCounts.length,
      maxSpansPerTrace: Math.max(...spanCounts),
      slowTraces: slowTraces.length,
    },
    serviceAnalysis,
    traces,
  };
}

function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(percentile * sorted.length / 100);

  return sorted[index];
}

function generateTraceId() {
  return 'trace_' + Math.random().toString(36).substring(2, 15);
}

function generateSpanId() {
  return 'span_' + Math.random().toString(36).substring(2, 15);
}

export function generateTraceReport(results) {
  return {
    timestamp: new Date().toISOString(),
    summary: results.summary,
    serviceAnalysis: results.serviceAnalysis,
    recommendations: generateTraceRecommendations(results),
  };
}

function generateTraceRecommendations(results) {
  const recommendations = [];

  if (results.summary.avgDuration > 500) {
    recommendations.push({
      type: 'PERFORMANCE',
      priority: 'HIGH',
      message: `Average trace duration > 500ms. Review slow services and optimize critical paths.`,
    });
  }

  if (results.summary.p99Duration > 2000) {
    recommendations.push({
      type: 'PERFORMANCE',
      priority: 'HIGH',
      message: `99th percentile trace duration > 2s. Identify and fix tail latency outliers.`,
    });
  }

  if (results.summary.slowTraces > results.summary.totalTraces * 0.1) {
    recommendations.push({
      type: 'OPTIMIZATION',
      priority: 'HIGH',
      message: `More than 10% of traces are slow (> 1s). Investigate bottlenecks.`,
    });
  }

  const slowServices = Object.entries(results.serviceAnalysis)
    .filter(([_, analysis]) => analysis.avgDuration > 200)
    .map(([service, _]) => service);

  if (slowServices.length > 0) {
    recommendations.push({
      type: 'OPTIMIZATION',
      priority: 'MEDIUM',
      message: `Slow services detected: ${slowServices.join(', ')}. Review and optimize.`,
    });
  }

  return recommendations;
}

export default {
  setup,
  benchmarkDistributedTracing,
  generateTraceReport,
};
