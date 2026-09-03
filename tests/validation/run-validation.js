import { generateValidationTestCases } from './validation-test-cases.js';
import { exportSuiteExcel } from '../runners/excel-generator.js';

export async function runValidationSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING SUITE: Validation Tests (300)');
  console.log('======================================================');

  const startTime = Date.now();
  const testCases = generateValidationTestCases();

  console.log(`🚀 Executing ${testCases.length} Validation & Security Test Cases...`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (tc.status === 'PASS') passed++;
    else failed++;

    if ((i + 1) % 50 === 0 || i === testCases.length - 1) {
      console.log(`   [Progress] ${i + 1}/${testCases.length} validation tests completed (${Math.round(((i + 1)/testCases.length)*100)}%)`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n🎉 Validation Suite Completed: ${passed} Passed, ${failed} Failed (${(duration / 1000).toFixed(2)}s)`);

  const reportPath = await exportSuiteExcel('Validation Tests', 'Validation_Test_Report.xlsx', testCases);

  return {
    name: 'Validation Tests',
    sheetName: 'Validation (300)',
    target: 'Input Sanitization, Schema & Edge Cases',
    tests: testCases,
    passed,
    failed,
    duration,
    reportPath,
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  runValidationSuite().catch(console.error);
}
