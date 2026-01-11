const { spawnSync } = require('child_process');
const path = require('path');

const { runZAPScan, runSnykScan } = require('./zap-scan');
const { spawnSync } = require('child_process');

const RESULTS_DIR = path.join(__dirname, '../reports');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function runAllSecurityTests() {
  console.log('='.repeat(60));
  console.log('  Tripo04OS Security Testing Suite');
  console.log('='.repeat(60));
  console.log('\nStarting comprehensive security testing...\n');

  const startTime = Date.now();

  const results = {
    timestamp: new Date().toISOString(),
    zapScans: [],
    dependencyScans: [],
    securityTests: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      mediumVulnerabilities: 0,
      lowVulnerabilities: 0,
    },
  };

  console.log('\n=== OWASP ZAP Scanning ===');
  const zapTargets = [
    'api-gateway',
    'identity-service',
    'order-service',
    'trip-service',
    'matching-service',
    'pricing-service',
    'location-service',
  ];

  for (const target of zapTargets) {
    console.log(`Running ZAP scan for: ${target}`);
    const zapResult = await runZAPScan(target, `http://localhost:8000`);
    results.zapScans.push(zapResult);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n=== Dependency Scanning ===');
  const depTargets = [
    'api-gateway',
    'identity-service',
    'order-service',
    'trip-service',
    'matching-service',
    'pricing-service',
    'location-service',
  ];

  const { scanAllServices } = require('./snyk-scan');
  const dependencyResults = await scanAllServices();
  results.dependencyScans = dependencyResults;

  console.log('\n=== Security Test Suites ===');
  console.log('Running security test suites...\n');

  const testSuites = [
    'sql-injection',
    'xss',
    'csrf',
    'auth-bypass',
  ];

  for (const suite of testSuites) {
    console.log(`Running test suite: ${suite}`);

    const testResult = await runCypressTest(suite);
    results.securityTests.push(testResult);

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  results.summary = {
    totalScans: results.zapScans.length,
    totalDependencyScans: results.dependencyScans.length,
    totalSecurityTests: results.securityTests.length,
    totalTests: results.securityTests.reduce((acc, r) => acc + (r.tests?.total || r.testsPassed + r.testsFailed), 0),
    passedTests: results.securityTests.reduce((acc, r) => acc + (r.testsPassed || 0), 0),
    failedTests: results.securityTests.reduce((acc, r) => acc + (r.testsFailed || 0), 0),
    totalVulnerabilities: results.zapScans.reduce((acc, r) => acc + (r.summary?.total || 0), 0) +
      results.dependencyScans.reduce((acc, r) => acc + (r.summary?.total || 0), 0),
    criticalVulnerabilities: results.zapScans.reduce((acc, r) => acc + (r.summary?.critical || 0), 0) +
      results.dependencyScans.reduce((acc, r) => acc + (r.summary?.critical || 0), 0),
    highVulnerabilities: results.zapScans.reduce((acc, r) => acc + (r.summary?.high || 0), 0) +
      results.dependencyScans.reduce((acc, r) => acc + (r.summary?.high || 0), 0),
    mediumVulnerabilities: results.zapScans.reduce((acc, r) => acc + (r.summary?.medium || 0), 0) +
      results.dependencyScans.reduce((acc, r) => acc + (r.summary?.medium || 0), 0),
    lowVulnerabilities: results.zapScans.reduce((acc, r) => acc + (r.summary?.low || 0), 0) +
      results.dependencyScans.reduce((acc, r) => acc + (r.summary?.low || 0), 0),
    duration: `${duration.toFixed(2)}s`,
  };

  const reportFile = path.join(RESULTS_DIR, `security-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('  Security Testing Complete');
  console.log('='.repeat(60));
  console.log(`\nTotal Duration: ${duration}s`);
  console.log(`Report saved to: ${reportFile}`);
  console.log('\n=== Summary ===');
  console.log(`Total Scans: ${results.summary.totalScans}`);
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed: ${results.summary.passedTests}`);
  console.log(`Failed: ${results.summary.failedTests}`);
  console.log(`Critical Vulnerabilities: ${results.summary.criticalVulnerabilities}`);
  console.log(`High Vulnerabilities: ${results.summary.highVulnerabilities}`);
  console.log(`Medium Vulnerabilities: ${results.summary.mediumVulnerabilities}`);
  console.log(`Low Vulnerabilities: ${results.summary.lowVulnerabilities}`);

  return results;
}

async function runCypressTest(suite) {
  return new Promise((resolve, reject) => {
    const cypressCmd = 'npx cypress run --config-file testing/cypress.config.js';

    try {
      const output = spawnSync('npx', [
        'cypress',
        'run',
        '--config-file',
        'testing/cypress.config.js',
        '--spec',
        `testing/security/suites/${suite}.cy.js`,
      ], {
        encoding: 'utf-8',
        timeout: 120000,
      });

      const lines = output.stdout.split('\n');
      let passed = 0;
      let failed = 0;
      let total = 0;

      for (const line of lines) {
        if (line.includes('passing') || line.includes('PASSED')) {
          passed++;
        } else if (line.includes('failing') || line.includes('FAILED')) {
          failed++;
        }
      }

      total = passed + failed;

      resolve({
        suite,
        tests: {
          total,
          passed,
          failed,
        },
        testsPassed: passed,
        testsFailed: failed,
        output: lines.join('\n'),
      });
    } catch (error) {
      console.error(`Error running ${suite}:`, error.message);
      resolve({
        suite,
        tests: { total: 0, passed: 0, failed: 0 },
        testsPassed: 0,
        testsFailed: 0,
        error: error.message,
        output: error.toString(),
      });
    }
  });
}

async function main() {
  try {
    const results = await runAllSecurityTests();

    console.log('\n=== Security Testing Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
