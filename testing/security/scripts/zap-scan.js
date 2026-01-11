const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ZAP_HOST = process.env.ZAP_HOST || 'localhost';
const ZAP_PORT = parseInt(process.env.ZAP_PORT || '8080');
const ZAP_API_KEY = process.env.ZAP_API_KEY || 'changeme';
const RESULTS_DIR = path.join(__dirname, '../owasp/zap-scan-results');
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:8000';

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function runZAPScan(targetName, targetUrl) {
  console.log(`Starting ZAP scan for: ${targetName}`);
  console.log(`Target URL: ${targetUrl}`);

  const scanId = `${targetName}-${Date.now()}`;

  const zapCmd = [
    'zap-cli',
    '-config', 'api.disablekey=true',
    '-config', 'api.key=' + ZAP_API_KEY,
    '-daemon',
    '-host', ZAP_HOST,
    '-port', ZAP_PORT.toString(),
  ];

  spawnSync('docker-compose', ['up', '-d', 'zap'], { cwd: __dirname, stdio: 'inherit' });

  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('Starting spider...');
  const spiderCmd = [
    'zap-cli',
    '-config', 'api.disablekey=true',
    '-config', 'api.key=' + ZAP_API_KEY,
    '-spider',
    '-u', targetUrl,
  ];

  spawnSync('docker', ['exec', 'owasp-zap', 'zap-cli', 'api.disablekey=true', 'api.key=' + ZAP_API_KEY, 'spider', '-u', targetUrl], { stdio: 'inherit' });

  await new Promise(resolve => setTimeout(resolve, 30000));

  console.log('Starting active scan...');
  const activeScanCmd = [
    'zap-cli',
    '-config', 'api.disablekey=true',
    '-config', 'api.key=' + ZAP_API_KEY,
    '-activeScan',
    '-r',
    scanId,
    '-u', targetUrl,
  ];

  spawnSync('docker', ['exec', 'owasp-zap', 'zap-cli', 'api.disablekey=true', 'api.key=' + ZAP_API_KEY, 'activeScan', '-r', scanId, '-u', targetUrl], { stdio: 'inherit' });

  await new Promise(resolve => setTimeout(resolve, 120000));

  console.log('Starting passive scan...');
  const passiveScanCmd = [
    'zap-cli',
    '-config', 'api.disablekey=true',
    '-config', 'api.key=' + ZAP_API_KEY,
    '-p-scan',
    '-u', targetUrl,
  ];

  spawnSync('docker', ['exec', 'owasp-zap', 'zap-cli', 'api.disablekey=true', 'api.key=' + ZAP_API_KEY, 'p-scan', '-u', targetUrl], { stdio: 'inherit' });

  await new Promise(resolve => setTimeout(resolve, 60000));

  console.log('Generating alert report...');
  const reportCmd = [
    'zap-cli',
    '-config', 'api.disablekey=true',
    '-config', 'api.key=' + ZAP_API_KEY,
    '-alert',
    '-l',
    'medium',
    '-r',
    scanId,
    '-o',
    path.join(RESULTS_DIR, `${targetName}-report.html`),
  ];

  spawnSync('docker', ['exec', 'owasp-zap', ...reportCmd], { stdio: 'inherit' });

  await new Promise(resolve => setTimeout(resolve, 5000));

  const jsonReportCmd = [
    'zap-cli',
    '-config', 'api.disablekey=true',
    '-config', 'api.key=' + ZAP_API_KEY,
    '-jsonreport',
    '-r',
    scanId,
    '-o',
    path.join(RESULTS_DIR, `${targetName}-report.json`),
  ];

  spawnSync('docker', ['exec', 'owasp-zap', ...jsonReportCmd], { stdio: 'inherit' });

  console.log(`ZAP scan complete for: ${targetName}`);
  console.log(`Report saved to: ${RESULTS_DIR}`);
}

async function main() {
  const targets = [
    { name: 'api-gateway', url: 'http://localhost:8000' },
    { name: 'identity-service', url: 'http://localhost:8001' },
    { name: 'order-service', url: 'http://localhost:8003' },
    { name: 'trip-service', url: 'http://localhost:8004' },
    { name: 'matching-service', url: 'http://localhost:8005' },
    { name: 'pricing-service', url: 'http://localhost:8006' },
    { name: 'location-service', url: 'http://localhost:8002' },
  ];

  for (const target of targets) {
    await runZAPScan(target.name, target.url);
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  console.log('\n=== All ZAP scans complete ===');
  console.log('Reports saved to:', RESULTS_DIR);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
