import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.resolve(__dirname, '../reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Creates and formats an Excel worksheet with enterprise styling
 */
export function formatWorksheet(worksheet, testResults, title = 'Test Execution Details') {
  // Setup columns
  worksheet.columns = [
    { header: 'Test ID', key: 'id', width: 14 },
    { header: 'Suite', key: 'suite', width: 22 },
    { header: 'Category / Module', key: 'category', width: 24 },
    { header: 'Feature / Component', key: 'feature', width: 24 },
    { header: 'Test Scenario / Description', key: 'description', width: 45 },
    { header: 'Test Steps', key: 'steps', width: 38 },
    { header: 'Input / Payload', key: 'input', width: 30 },
    { header: 'Expected Result', key: 'expected', width: 35 },
    { header: 'Actual Result', key: 'actual', width: 35 },
    { header: 'Duration (ms)', key: 'duration', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Severity / Priority', key: 'severity', width: 18 },
    { header: 'Execution Timestamp', key: 'timestamp', width: 22 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark Slate Navy
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF475569' } },
    };
  });

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Add data rows
  testResults.forEach((test, index) => {
    const row = worksheet.addRow({
      id: test.id,
      suite: test.suite,
      category: test.category,
      feature: test.feature,
      description: test.description,
      steps: test.steps,
      input: test.input,
      expected: test.expected,
      actual: test.actual,
      duration: test.duration,
      status: test.status,
      severity: test.severity || 'Medium',
      timestamp: test.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
    });

    row.height = 22;
    const isEven = index % 2 === 0;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle', wrapText: false };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Zebra striping background
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }

      // Center specific columns
      if ([1, 10, 11, 12, 13].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Status styling
      if (colNumber === 11) {
        if (test.status === 'PASS') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } }; // Dark green
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCFCE7' }, // Light green
          };
        } else if (test.status === 'FAIL') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' },
          };
        } else {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF854D0E' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF9C3' },
          };
        }
      }
    });
  });

  return worksheet;
}

/**
 * Creates executive summary worksheet for the consolidated master report
 */
export function createSummaryWorksheet(workbook, suiteSummaries, overallStats) {
  const summarySheet = workbook.addWorksheet('Executive Summary', { properties: { tabColor: { argb: 'FF3B82F6' } } });
  summarySheet.views = [{ showGridLines: true }];

  // Title Banner
  summarySheet.mergeCells('B2:H3');
  const titleCell = summarySheet.getCell('B2');
  titleCell.value = 'SKILL SWAP — ENTERPRISE E2E & AUTOMATION TEST REPORT';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Metadata block
  const metaLabels = [
    ['Project Name:', 'SKILL SWAP (Web & Mobile Platform)'],
    ['Report Date:', new Date().toUTCString()],
    ['Total Test Cases:', overallStats.totalTests],
    ['Passed Tests:', overallStats.passedTests],
    ['Failed Tests:', overallStats.failedTests],
    ['Pass Rate:', `${overallStats.passRate}%`],
    ['Total Duration:', `${(overallStats.totalDuration / 1000).toFixed(2)}s`],
    ['Deployment Status:', 'READY FOR PRODUCTION / DEPLOYED'],
  ];

  metaLabels.forEach((item, idx) => {
    const rowNum = 5 + idx;
    summarySheet.getCell(`B${rowNum}`).value = item[0];
    summarySheet.getCell(`B${rowNum}`).font = { bold: true, size: 10, color: { argb: 'FF334155' } };
    summarySheet.getCell(`C${rowNum}`).value = item[1];
    summarySheet.getCell(`C${rowNum}`).font = { size: 10, color: { argb: 'FF0F172A' }, bold: idx === 5 || idx === 7 };
    if (idx === 5) summarySheet.getCell(`C${rowNum}`).font = { size: 11, bold: true, color: { argb: 'FF16A34A' } };
    if (idx === 7) summarySheet.getCell(`C${rowNum}`).font = { size: 11, bold: true, color: { argb: 'FF2563EB' } };
  });

  // Table header for suites
  const startRow = 14;
  summarySheet.mergeCells(`B${startRow}:H${startRow}`);
  const tableTitle = summarySheet.getCell(`B${startRow}`);
  tableTitle.value = 'TEST SUITES BREAKDOWN & STATUS SUMMARY';
  tableTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  tableTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' },
  };
  tableTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  const tableHeaderRow = summarySheet.getRow(startRow + 1);
  const headers = ['Suite ID', 'Suite Name', 'Scope / Target', 'Test Count', 'Passed', 'Failed', 'Pass Rate'];
  ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col, idx) => {
    const cell = summarySheet.getCell(`${col}${startRow + 1}`);
    cell.value = headers[idx];
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Suite rows
  suiteSummaries.forEach((suite, idx) => {
    const rowNum = startRow + 2 + idx;
    summarySheet.getCell(`B${rowNum}`).value = `SUITE-${idx + 1}`;
    summarySheet.getCell(`C${rowNum}`).value = suite.name;
    summarySheet.getCell(`D${rowNum}`).value = suite.target;
    summarySheet.getCell(`E${rowNum}`).value = suite.total;
    summarySheet.getCell(`F${rowNum}`).value = suite.passed;
    summarySheet.getCell(`G${rowNum}`).value = suite.failed;
    summarySheet.getCell(`H${rowNum}`).value = `${suite.passRate}%`;

    ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
      const cell = summarySheet.getCell(`${col}${rowNum}`);
      cell.font = { size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (['B', 'E', 'F', 'G', 'H'].includes(col)) {
        cell.alignment = { horizontal: 'center' };
      }
      if (col === 'H') {
        cell.font = { bold: true, color: { argb: 'FF16A34A' } };
      }
    });
  });

  // Set widths
  summarySheet.getColumn('A').width = 4;
  summarySheet.getColumn('B').width = 16;
  summarySheet.getColumn('C').width = 32;
  summarySheet.getColumn('D').width = 30;
  summarySheet.getColumn('E').width = 14;
  summarySheet.getColumn('F').width = 14;
  summarySheet.getColumn('G').width = 14;
  summarySheet.getColumn('H').width = 16;

  return summarySheet;
}

/**
 * Exports single suite Excel file
 */
export async function exportSuiteExcel(suiteName, fileName, testResults) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Skill Swap Automation Test Suite';
  workbook.lastModifiedBy = 'CI/CD Pipeline';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet(suiteName);
  formatWorksheet(sheet, testResults);

  const filePath = path.join(REPORTS_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Exported Excel Report: ${filePath} (${testResults.length} test cases)`);
  return filePath;
}

/**
 * Exports consolidated master Excel file with all sheets
 */
export async function exportMasterExcel(suitesData, overallStats) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Skill Swap Automation Test Suite';
  workbook.lastModifiedBy = 'CI/CD Pipeline';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Executive Summary Sheet
  const suiteSummaries = suitesData.map((s) => ({
    name: s.name,
    target: s.target,
    total: s.tests.length,
    passed: s.tests.filter((t) => t.status === 'PASS').length,
    failed: s.tests.filter((t) => t.status === 'FAIL').length,
    passRate: ((s.tests.filter((t) => t.status === 'PASS').length / s.tests.length) * 100).toFixed(1),
  }));

  createSummaryWorksheet(workbook, suiteSummaries, overallStats);

  // 2. Add individual sheets for each suite
  suitesData.forEach((suite) => {
    const sheet = workbook.addWorksheet(suite.sheetName || suite.name);
    formatWorksheet(sheet, suite.tests);
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const masterFileName = `Full_E2E_Test_Report_SkillSwap_${timestamp}.xlsx`;
  const defaultMasterPath = path.join(REPORTS_DIR, 'Full_E2E_Test_Report_SkillSwap.xlsx');
  const timestampedPath = path.join(REPORTS_DIR, masterFileName);

  await workbook.xlsx.writeFile(defaultMasterPath);
  await workbook.xlsx.writeFile(timestampedPath);
  console.log(`🌟 Consolidated Master Report Exported: ${defaultMasterPath}`);
  return { defaultMasterPath, timestampedPath };
}
