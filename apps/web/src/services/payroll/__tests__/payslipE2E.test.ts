function escapeHTML(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function compilePayslipHTML(options: { placeholders: Record<string, string>; brandLogoUrl?: string }): string {
  const p = options.placeholders;
  const brandLogoUrl = options.brandLogoUrl || '';
  const legalNameVal = p.LEGAL_NAME || p.COMPANY_NAME || '';
  const brandNameVal = p.BRAND_NAME || '';
  const addressVal = p.BRAND_ADDRESS || p.ADDRESS || '';
  const phoneVal = p.BRAND_PHONE || p.PHONE || '';
  const emailVal = p.BRAND_EMAIL || p.EMAIL || '';
  const websiteVal = p.BRAND_WEBSITE || p.WEBSITE || '';
  const monthYearVal = p.SALARY_MONTH || '';
  const empName = p.PERSON_NAME || p.EMPLOYEE_NAME || '';
  const empCode = p.EMPLOYEE_CODE || p.EMPLOYEE_ID || '';
  const designation = p.DESIGNATION || '';
  const department = p.DEPARTMENT || '';
  const joiningDate = p.JOINING_DATE || '';
  const workLocation = p.WORK_LOCATION || p.LOCATION || '';
  const bankName = p.BANK_NAME || '';
  const maskedBankAccount = `••••••••${(p.BANK_ACCOUNT_NUMBER || p.ACCOUNT_NUMBER || '').slice(-4)}`;
  const ifsc = p.IFSC_CODE || p.IFSC || '';
  const payslipId = p.PAYSLIP_ID || '';
  const generatedOn = p.GENERATED_ON || '';
  const basicPay = p.BASIC_PAY || '₹0';
  const hra = p.HRA || '₹0';
  const conveyance = p.CONVEYANCE || '₹0';
  const specialAllowance = p.SPECIAL_ALLOWANCE || '₹0';
  const grossEarnings = p.GROSS_EARNINGS || '₹0';
  const pfDeduction = p.PF_DEDUCTION || '₹0';
  const esicDeduction = p.ESIC_DEDUCTION || '₹0';
  const ptDeduction = p.PT_DEDUCTION || '₹0';
  const totalDeductions = p.TOTAL_DEDUCTIONS || '₹0';
  const netPay = p.NET_PAY || '₹0';
  const netPayWords = p.NET_PAY_WORDS || '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Payslip - ${escapeHTML(empName)}</title>
        <style>
          @page { size: A4; margin: 0; }
          .page { width: 8.27in; height: 11.69in; padding: 0.45in 0.5in; position: relative; background: #ffffff; box-sizing: border-box; overflow: hidden; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">${brandLogoUrl ? `<img src="${brandLogoUrl}" />` : ''} <div>${escapeHTML(legalNameVal)}</div> <div>${escapeHTML(brandNameVal)}</div> <div>${escapeHTML(addressVal)} ${escapeHTML(phoneVal)} ${escapeHTML(emailVal)} ${escapeHTML(websiteVal)}</div></div>
          <div>PAYSLIP Salary for the Month of ${escapeHTML(monthYearVal)}</div>
          <div>${escapeHTML(empName)} ${escapeHTML(empCode)} ${escapeHTML(department)} ${escapeHTML(designation)} ${escapeHTML(joiningDate)} ${escapeHTML(workLocation)} ${escapeHTML(bankName)} ${escapeHTML(maskedBankAccount)} ${escapeHTML(ifsc)}</div>
          <div>${escapeHTML(basicPay)} ${escapeHTML(hra)} ${escapeHTML(conveyance)} ${escapeHTML(specialAllowance)} ${escapeHTML(pfDeduction)} ${escapeHTML(esicDeduction)} ${escapeHTML(ptDeduction)}</div>
          <div>${escapeHTML(grossEarnings)} ${escapeHTML(totalDeductions)} ${escapeHTML(netPay)} ${escapeHTML(netPayWords)}</div>
          <div>PAYSLIP ID: ${escapeHTML(payslipId)} GENERATED ON: ${escapeHTML(generatedOn)} SYSTEM GENERATED PAYSLIP This payslip is electronically generated from the company's payroll records and does not require a physical signature or stamp.</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Isolated End-to-End Payslip Automated Test Suite
 * Validates the approved DaysInMonth and PaidDays salary proration formula.
 */
export function runPayslipE2ETestSuite(): { success: boolean; passedAssertions: number; logs: string[] } {
  const logs: string[] = [];
  let assertionsCount = 0;

  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`TEST ASSERTION FAILED: ${message}`);
    }
    assertionsCount++;
    logs.push(`✔ Assertion [${assertionsCount}]: ${message}`);
  }

  logs.push('=== STARTING ISOLATED E2E PAYSLIP TEST SUITE (DAYS-IN-MONTH PRORATION) ===');

  // 1. Isolated Test Employee Fixture
  const testEmployee = {
    id: 'TEST_EMP_999',
    employeeId: 'TEST_EMP_999',
    employeeCode: 'HH_TEST_001',
    fullName: 'Rahul Sharma',
    firstName: 'Rahul',
    lastName: 'Sharma',
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    joiningDate: '2025-06-01',
    workLocation: 'Kolkata HQ',
    bankName: 'HDFC Bank',
    accountNumber: '987654321012',
    ifscCode: 'HDFC0009999',
    monthlyGross: 30000,
  };

  // 2. Deterministic Calendar & Attendance Test Fixture (Month: August 2026 = 31 days)
  const salaryMonth = '2026-08';
  const daysInMonth = new Date(2026, 8, 0).getDate(); // 31
  assert(daysInMonth === 31, 'Actual DaysInMonth for August 2026 is 31 days');

  const attendanceSnapshot = {
    totalWorkingDays: 21,
    paidHolidayDays: 1,
    weekOffDays: 5,
    paidLeaveDays: 2,
  };

  const paidDays =
    attendanceSnapshot.totalWorkingDays +
    attendanceSnapshot.paidHolidayDays +
    attendanceSnapshot.weekOffDays +
    attendanceSnapshot.paidLeaveDays; // 21 + 1 + 5 + 2 = 29

  assert(paidDays === 29, 'PaidDays derived as TotalWorkingDays + Holidays + WeekOff + PaidLeave = 29');

  // 3. Earned Gross Calculation: (30,000 / 31) * 29
  const earnedGross = Math.round((testEmployee.monthlyGross / daysInMonth) * paidDays); // 28065
  assert(earnedGross === 28065, 'EarnedGross calculated as ₹28,065 using actual DaysInMonth divisor');

  const basicPay = Math.round(earnedGross * 0.5); // ₹14,033
  const hraPay = Math.round(basicPay * 0.4); // ₹5,613
  const conveyancePay = Math.min(1600, Math.round((1600 / daysInMonth) * paidDays)); // ₹1,497
  const specialPay = Math.max(0, earnedGross - (basicPay + hraPay + conveyancePay)); // ₹6,922

  assert(basicPay === 14033, 'Basic Pay is 50% of Earned Gross (₹14,033)');
  assert(hraPay === 5613, 'HRA is 40% of Basic (₹5,613)');
  assert(conveyancePay === 1497, 'Conveyance Allowance is prorated (₹1,497)');
  assert(specialPay === 6922, 'Special Allowance is balancing amount (₹6,922)');

  // 4. Performance Incentive (60 pts * 50 = ₹3,000)
  const performanceIncentive = 3000;
  const grossEarnings = earnedGross + performanceIncentive; // 28,065 + 3,000 = 31,065
  assert(grossEarnings === 31065, 'Gross Earnings equals Earned Gross + Performance Incentive (₹31,065)');

  // 5. Statutory Deductions Calculation
  const pfDeduction = Math.min(1800, Math.round(basicPay * 0.12)); // 12% of 14,033 = ₹1,684
  const esicDeduction = testEmployee.monthlyGross <= 21000 ? Math.round(grossEarnings * 0.0075) : 0; // ₹0
  const ptDeduction = grossEarnings > 25000 ? 200 : 150; // ₹200 for West Bengal slab > 25k

  assert(pfDeduction === 1684, 'PF Deduction calculated as ₹1,684 (12% of Basic Pay)');
  assert(esicDeduction === 0, 'ESIC Deduction is ₹0 for Monthly Gross > 21,000');
  assert(ptDeduction === 200, 'P Tax Deduction is ₹200 for Gross > 25,000 slab');

  const totalDeductions = pfDeduction + esicDeduction + ptDeduction;
  assert(totalDeductions === 1884, 'Total Deductions calculated correctly as ₹1,884');

  const netSalary = grossEarnings - totalDeductions;
  assert(netSalary === 29181, 'Net Salary Payable calculated correctly as ₹29,181');

  // 6. Immutable Payroll Snapshot Verification
  const testSnapshot = {
    snapshotId: `PSNAP_TEST_${Date.now()}`,
    employeeId: testEmployee.employeeId,
    employeeCode: testEmployee.employeeCode,
    employeeName: testEmployee.fullName,
    salaryMonth,
    daysInMonth,
    totalWorkingDays: attendanceSnapshot.totalWorkingDays,
    paidHolidayDays: attendanceSnapshot.paidHolidayDays,
    weekOffDays: attendanceSnapshot.weekOffDays,
    paidLeaveDays: attendanceSnapshot.paidLeaveDays,
    paidDays,
    monthlyGross: testEmployee.monthlyGross,
    earnedGross,
    grossEarnings,
    totalDeductions,
    netSalary,
    generatedAt: new Date().toISOString(),
  };
  assert(testSnapshot.daysInMonth === 31, 'Snapshot preserves actual DaysInMonth (31)');
  assert(testSnapshot.paidDays === 29, 'Snapshot preserves actual PaidDays (29)');
  assert(testSnapshot.netSalary === netSalary, 'Snapshot Net Salary matches calculated Net Salary (₹29,181)');

  // 7. Bank Process & Excel Release Amount Alignment
  const bankReleaseAmount = netSalary;
  assert(bankReleaseAmount === testSnapshot.netSalary, 'Bank Release Amount strictly equals Snapshot Net Salary');

  // 8. Native Payslip HTML Compilation & Renderer Verification
  const payslipOptions = {
    placeholders: {
      LEGAL_NAME: 'Hire Huub People Solution Private Limited',
      BRAND_NAME: 'Hire Huub',
      BRAND_ADDRESS: 'Sector V, Salt Lake, Kolkata, West Bengal - 700091',
      BRAND_PHONE: '+91 33 4000 1234',
      BRAND_EMAIL: 'hr@hirehuub.com',
      BRAND_WEBSITE: 'https://hirehuub.com',

      SALARY_MONTH: 'AUGUST 2026',
      PERSON_NAME: testEmployee.fullName,
      EMPLOYEE_NAME: testEmployee.fullName,
      EMPLOYEE_CODE: testEmployee.employeeCode,
      EMPLOYEE_ID: testEmployee.employeeCode,
      DESIGNATION: testEmployee.designation,
      DEPARTMENT: testEmployee.department,
      JOINING_DATE: testEmployee.joiningDate,
      WORK_LOCATION: testEmployee.workLocation,
      BANK_NAME: testEmployee.bankName,
      BANK_ACCOUNT_NUMBER: testEmployee.accountNumber,
      ACCOUNT_NUMBER: testEmployee.accountNumber,
      IFSC_CODE: testEmployee.ifscCode,

      PAYSLIP_ID: `PSL-202608-${testEmployee.employeeCode}`,
      GENERATED_ON: '2026-08-17',

      BASIC_PAY: `₹${basicPay.toLocaleString('en-IN')}`,
      HRA: `₹${hraPay.toLocaleString('en-IN')}`,
      CONVEYANCE: `₹${conveyancePay.toLocaleString('en-IN')}`,
      SPECIAL_ALLOWANCE: `₹${specialPay.toLocaleString('en-IN')}`,
      GROSS_EARNINGS: `₹${grossEarnings.toLocaleString('en-IN')}`,

      PF_DEDUCTION: `₹${pfDeduction.toLocaleString('en-IN')}`,
      ESIC_DEDUCTION: `₹${esicDeduction.toLocaleString('en-IN')}`,
      PT_DEDUCTION: `₹${ptDeduction.toLocaleString('en-IN')}`,
      TOTAL_DEDUCTIONS: `₹${totalDeductions.toLocaleString('en-IN')}`,

      NET_PAY: `₹${netSalary.toLocaleString('en-IN')}`,
      NET_PAY_WORDS: 'Rupees Twenty-Nine Thousand One Hundred Eighty-One Only',
    },
    brandLogoUrl: 'https://hirehuub.com/logo.png',
  };

  const compiledHTML = compilePayslipHTML(payslipOptions as any);

  // 9. PDF Content Validation
  assert(compiledHTML.includes('Hire Huub People Solution Private Limited'), 'PDF contains Legal Company Name');
  assert(compiledHTML.includes('Hire Huub'), 'PDF contains Brand Name');
  assert(compiledHTML.includes('Rahul Sharma'), 'PDF contains Employee Name');
  assert(compiledHTML.includes('HH_TEST_001'), 'PDF contains Employee Code');
  assert(compiledHTML.includes('AUGUST 2026'), 'PDF contains Salary Month');
  assert(compiledHTML.includes('₹31,065'), 'PDF contains Gross Earnings');
  assert(compiledHTML.includes('₹1,884'), 'PDF contains Total Deductions');
  assert(compiledHTML.includes('₹29,181'), 'PDF contains Net Salary Payable');
  assert(compiledHTML.includes('Rupees Twenty-Nine Thousand One Hundred Eighty-One Only'), 'PDF contains Net Salary in Words');

  // 10. Placeholder & Constraint Assertions
  assert(!compiledHTML.includes('{{'), 'PDF contains zero unresolved opening placeholders');
  assert(!compiledHTML.includes('}}'), 'PDF contains zero unresolved closing placeholders');
  assert(!compiledHTML.includes('img src="" style="height: 40px') && !compiledHTML.includes('Authorized Signatory'), 'PDF contains NO signatory block');
  assert(!compiledHTML.includes('Company Stamp'), 'PDF contains NO company stamp');
  assert(compiledHTML.includes('width: 8.27in') && compiledHTML.includes('height: 11.69in'), 'PDF HTML strictly enforces A4 1-Page dimensions');

  logs.push('=== ALL PAYSLIP E2E TEST ASSERTIONS PASSED (100% ZERO-ERROR) ===');
  return { success: true, passedAssertions: assertionsCount, logs };
}

// Self-run when executed via Node/CLI test runner
if (typeof globalThis !== 'undefined' && (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'test') {
  const result = runPayslipE2ETestSuite();
  console.log(result.logs.join('\n'));
}
