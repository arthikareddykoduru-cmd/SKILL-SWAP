import { generateUnitApiTestCases } from './api-unit-test-cases.js';
import { exportSuiteExcel } from '../runners/excel-generator.js';

export async function runUnitApiSuite() {
  console.log('\n======================================================');
  console.log('🔬 RUNNING SUITE: Unit Tests - API (300)');
  console.log('======================================================');

  const startTime = Date.now();
  const testCases = generateUnitApiTestCases();

  console.log(`🚀 Executing ${testCases.length} Unit & API Test Cases...`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (tc.status === 'PASS') passed++;
    else failed++;

    if ((i + 1) % 50 === 0 || i === testCases.length - 1) {
      console.log(`   [Progress] ${i + 1}/${testCases.length} unit tests completed (${Math.round(((i + 1)/testCases.length)*100)}%)`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n🎉 Unit Tests API Suite Completed: ${passed} Passed, ${failed} Failed (${(duration / 1000).toFixed(2)}s)`);

  const reportPath = await exportSuiteExcel('Unit & API Tests', 'Unit_API_Report.xlsx', testCases);

  return {
    name: 'Unit Tests — API',
    sheetName: 'Unit & API Tests (300)',
    target: 'Core Services & API Client Engine',
    tests: testCases,
    passed,
    failed,
    duration,
    reportPath,
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  runUnitApiSuite().catch(console.error);
}
