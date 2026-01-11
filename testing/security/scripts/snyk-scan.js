const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const Snyk_API_KEY = process.env.SNYK_API_KEY || 'your-snyk-api-key';
const RESULTS_DIR = path.join(__dirname, '../dependency/snyk-results');
const SERVICES_DIR = path.join(__dirname, '../../../backend_services');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function runSnykScan(servicePath, serviceName) {
  console.log(`Scanning ${serviceName} with Snyk...`);

  try {
    const scanResult = execSync('snyk test', {
      cwd: servicePath,
      encoding: 'utf-8',
      env: {
        ...process.env,
        SNYK_API_KEY,
      },
      timeout: 300000,
    });

    const outputFile = path.join(RESULTS_DIR, `${serviceName}-snyk-report.json`);
    fs.writeFileSync(outputFile, scanResult);

    console.log(`Snyk scan complete for: ${serviceName}`);
    console.log(`Report saved to: ${outputFile}`);

    const vulnerabilities = JSON.parse(scanResult);

    return {
      serviceName,
      vulnerabilities: vulnerabilities.results?.[0]?.vulnerabilities || [],
      summary: {
        total: vulnerabilities.results?.[0]?.vulnerabilities?.length || 0,
        critical: vulnerabilities.results?.[0]?.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
        high: vulnerabilities.results?.[0]?.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
        medium: vulnerabilities.results?.[0]?.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
        low: vulnerabilities.results?.[0]?.vulnerabilities?.filter(v => v.severity === 'low').length || 0,
      },
    };
  } catch (error) {
    console.error(`Error scanning ${serviceName}:`, error.message);

    return {
      serviceName,
      vulnerabilities: [],
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      error: error.message,
    };
  }
}

async function scanAllServices() {
  const services = [
    { path: `${SERVICES_DIR}/api_gateway/`, name: 'api-gateway' },
    { path: `${SERVICES_DIR}/identity_service/`, name: 'identity-service' },
    { path: `${SERVICES_DIR}/order_service/`, name: 'order-service' },
    { path: `${SERVICES_DIR}/trip_service/`, name: 'trip-service' },
    { path: `${SERVICES_DIR}/matching_service/`, name: 'matching-service' },
    { path: `${SERVICES_DIR}/pricing_service/`, name: 'pricing-service' },
    { path: `${SERVICES_DIR}/location_service/`, name: 'location-service' },
  ];

  const results = [];

  for (const service of services) {
    const result = await runSnykScan(service.path, service.name);
    results.push(result);

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const summaryFile = path.join(RESULTS_DIR, 'snyk-summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    totalVulnerabilities: results.reduce((acc, r) => acc + r.summary.total, 0),
    criticalVulnerabilities: results.reduce((acc, r) => acc + r.summary.critical, 0),
    highVulnerabilities: results.reduce((acc, r) => acc + r.summary.high, 0),
    mediumVulnerabilities: results.reduce((acc, r) => acc + r.summary.medium, 0),
    lowVulnerabilities: results.reduce((acc, r) => acc + r.summary.low, 0),
    services: results.map(r => ({
      serviceName: r.serviceName,
      total: r.summary.total,
      critical: r.summary.critical,
      high: r.summary.high,
      medium: r.summary.medium,
      low: r.summary.low,
      error: r.error || null,
    })),
  };

  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log('\n=== Snyk Dependency Scan Summary ===');
  console.log(`Total Vulnerabilities: ${summary.totalVulnerabilities}`);
  console.log(`Critical: ${summary.criticalVulnerabilities}`);
  console.log(`High: ${summary.highVulnerabilities}`);
  console.log(`Medium: ${summary.mediumVulnerabilities}`);
  console.log(`Low: ${summary.lowVulnerabilities}`);
  console.log(`Summary saved to: ${summaryFile}`);
}

async function main() {
  console.log('Starting Snyk dependency scanning...');
  console.log(`Services directory: ${SERVICES_DIR}`);
  console.log(`Results directory: ${RESULTS_DIR}`);

  await scanAllServices();

  console.log('\n=== Dependency scanning complete ===');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
