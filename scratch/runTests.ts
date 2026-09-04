import { runAttendanceEngineTests } from '../apps/web/src/pages/Attendance/utils/attendanceResolutionEngine.test';
import { runLeaveAccrualTests } from '../apps/web/src/pages/Leave/services/leaveAccrualService.test';
import { runLeaveHistoryTests } from '../apps/web/src/pages/Leave/hooks/useLeave.test';
import { runPerformanceTests } from '../apps/web/src/pages/People/services/performanceService.test';
import { runIncentiveEngineTests } from '../apps/web/src/pages/Management/services/incentiveEngineService.test';
import { runProfileSelfServiceTests } from '../apps/web/src/pages/Employee/services/profileSelfService.test';
import { runGlobalSearchAccessTests } from '../apps/web/src/pages/Employee/services/globalSearchAccess.test';
import { runEmployeeCreationFixTests } from '../apps/web/src/pages/Employee/services/employeeCreationFix.test';
import { runRehireWorkflowTests } from '../apps/web/src/pages/Employee/services/rehireWorkflow.test';
import { runInvoiceBankAccountSelectionTests } from '../apps/web/src/pages/Finance/billing/services/invoiceBankAccountSelection.test';
import { runErpPayslipAccessTests } from '../apps/web/src/services/payroll/__tests__/erpPayslipAccess.test';

const resAtt = runAttendanceEngineTests();
console.log(`\n========================================`);
console.log(`ATTENDANCE RESOLUTION ENGINE TEST RESULTS`);
console.log(`========================================`);
resAtt.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resAtt.passed}/${resAtt.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resLeave = runLeaveAccrualTests();
console.log(`\n========================================`);
console.log(`LEAVE 90-DAY & MONTHLY ACCRUAL TEST RESULTS`);
console.log(`========================================`);
resLeave.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resLeave.passed}/${resLeave.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resHistory = runLeaveHistoryTests();
console.log(`\n========================================`);
console.log(`LEAVE HISTORY DATA LOADING TEST RESULTS`);
console.log(`========================================`);
resHistory.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resHistory.passed}/${resHistory.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resPerf = runPerformanceTests();
console.log(`\n========================================`);
console.log(`PERFORMANCE BRAND-BASED TEST RESULTS`);
console.log(`========================================`);
resPerf.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resPerf.passed}/${resPerf.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resInc = runIncentiveEngineTests();
console.log(`\n========================================`);
console.log(`CONFIGURABLE CUMULATIVE INCENTIVE ENGINE TEST RESULTS`);
console.log(`========================================`);
resInc.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resInc.passed}/${resInc.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resProfile = runProfileSelfServiceTests();
console.log(`\n========================================`);
console.log(`PROFILE SELF-SERVICE TEST RESULTS`);
console.log(`========================================`);
resProfile.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resProfile.passed}/${resProfile.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resSearch = runGlobalSearchAccessTests();
console.log(`\n========================================`);
console.log(`GLOBAL SEARCH EMPLOYEE ACCESS TEST RESULTS`);
console.log(`========================================`);
resSearch.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resSearch.passed}/${resSearch.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resCreate = runEmployeeCreationFixTests();
console.log(`\n========================================`);
console.log(`EMPLOYEE CREATION FIX TEST RESULTS`);
console.log(`========================================`);
resCreate.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resCreate.passed}/${resCreate.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resRehire = runRehireWorkflowTests();
console.log(`\n========================================`);
console.log(`REHIRE WORKFLOW TEST RESULTS`);
console.log(`========================================`);
resRehire.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resRehire.passed}/${resRehire.total} Scenarios Passed.`);
console.log(`========================================\n`);

const resInvBank = runInvoiceBankAccountSelectionTests();
console.log(`\n========================================`);
console.log(`INVOICE BANK ACCOUNT SELECTION & SNAPSHOT TEST RESULTS`);
console.log(`========================================`);
resInvBank.logs.forEach((log) => console.log(log));
console.log(`----------------------------------------`);
console.log(`SUMMARY: ${resInvBank.passed}/${resInvBank.total} Scenarios Passed.`);
console.log(`========================================\n`);

void runErpPayslipAccessTests();
