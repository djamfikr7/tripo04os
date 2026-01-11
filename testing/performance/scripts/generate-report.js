#!/usr/bin/env node

import { generateReport } from './benchmark.js';
import fs from 'fs';
import path from 'path';

const REPORT_DIR = path.join(__dirname, '../../reports');

export async function generatePerformanceReport() {
  console.log('Generating performance report...');
  
  await import('./run-benchmarks.js').then(module => {
    const results = module.exports.runAllBenchmarks();
    const report = generateReport();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, ' ');
    const filename = `performance-report-${timestamp}.json`;
    const filepath = path.join(REPORT_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`Performance report saved to: ${filepath}`);
    
    return filepath;
  }).catch(error => {
    console.error('Error generating performance report:', error.message);
    throw error;
  });
}

if (require.main === module) {
  generatePerformanceReport().then(filepath => {
    console.log(`Report generated: ${filepath}`);
    process.exit(0);
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
