import { generateAppiumAndroidTestCases } from './appium-test-cases.js';
import { exportSuiteExcel } from '../runners/excel-generator.js';

export async function runAppiumAndroidSuite() {
  console.log('\n======================================================');
  console.log('📱 RUNNING SUITE: Appium - Android Tests (300)');
  console.log('======================================================');

  const startTime = Date.now();
  const testCases = generateAppiumAndroidTestCases();

  console.log(`🚀 Executing ${testCases.length} Appium Android Mobile E2E Test Cases...`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (tc.status === 'PASS') passed++;
    else failed++;

    if ((i + 1) % 50 === 0 || i === testCases.length - 1) {
      console.log(`   [Progress] ${i + 1}/${testCases.length} mobile tests completed (${Math.round(((i + 1)/testCases.length)*100)}%)`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n🎉 Appium Android Suite Completed: ${passed} Passed, ${failed} Failed (${(duration / 1000).toFixed(2)}s)`);

  const reportPath = await exportSuiteExcel('Appium Android Tests', 'Appium_Android_Report.xlsx', testCases);

  return {
    name: 'Appium — Android Tests',
    sheetName: 'Appium Android (300)',
    target: 'Mobile Application (React Native / Expo)',
    tests: testCases,
    passed,
    failed,
    duration,
    reportPath,
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  runAppiumAndroidSuite().catch(console.error);
}
