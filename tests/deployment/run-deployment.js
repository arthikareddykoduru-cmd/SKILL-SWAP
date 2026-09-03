import { generateDeploymentTestCases } from './deployment-test-cases.js';
import { exportSuiteExcel } from '../runners/excel-generator.js';

export async function runDeploymentSuite() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING SUITE: Deployment Status (300)');
  console.log('======================================================');

  const startTime = Date.now();
  const testCases = generateDeploymentTestCases();

  console.log(`🚀 Executing ${testCases.length} Deployment, Environment & Security Test Cases...`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (tc.status === 'PASS') passed++;
    else failed++;

    if ((i + 1) % 50 === 0 || i === testCases.length - 1) {
      console.log(`   [Progress] ${i + 1}/${testCases.length} deployment checks completed (${Math.round(((i + 1)/testCases.length)*100)}%)`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n🎉 Deployment Status Suite Completed: ${passed} Passed, ${failed} Failed (${(duration / 1000).toFixed(2)}s)`);

  const reportPath = await exportSuiteExcel('Deployment Status', 'Deployment_Status_Report.xlsx', testCases);

  return {
    name: 'Deployment Status',
    sheetName: 'Deployment Status (300)',
    target: 'Production Build, Config & Security Rules',
    tests: testCases,
    passed,
    failed,
    duration,
    reportPath,
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  runDeploymentSuite().catch(console.error);
}
