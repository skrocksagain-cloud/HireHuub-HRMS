import { doc, getDoc, setDoc } from 'firebase/firestore';
import { adminService } from '../../../services/admin/adminService';
import { db } from '../../../firebase/firebase';
import type { AttendanceOverride, EmployeePayrollRecord, PayrollRegisterRun } from '../types';
import { employeeRepository } from '../../Employee/repositories/employeeRepository';
import { attendanceRepository } from '../../Attendance/repositories/attendanceRepository';
import { calendarService } from '../../../services/calendar/calendarService';
import { calculateWorkingDays, recalculatePayrollRecord } from './internalPayrollCalculator';

const PAYROLL_REGISTER_COLLECTION = 'payroll_register_runs';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export const payrollRegisterService = {
  async getPayrollRun(monthStr: string): Promise<PayrollRegisterRun | null> {
    const runId = `register-${monthStr}`;
    const snap = await getDoc(doc(db, PAYROLL_REGISTER_COLLECTION, runId));
    if (snap.exists()) {
      return snap.data() as PayrollRegisterRun;
    }
    return null;
  },

  async calculatePayroll(monthStr: string, overrides: Record<string, AttendanceOverride> = {}): Promise<PayrollRegisterRun> {
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month);

    const startDate = `${monthStr}-01`;
    const endDate = `${monthStr}-${daysInMonth.toString().padStart(2, '0')}`;

    // Get previous month for arrears
    const prevMonthDate = new Date(year, month - 2, 1);
    const prevYearStr = prevMonthDate.getFullYear();
    const prevMonthNumStr = (prevMonthDate.getMonth() + 1).toString().padStart(2, '0');
    const prevMonthStr = `${prevYearStr}-${prevMonthNumStr}`;
    const prevDaysInMonth = getDaysInMonth(prevYearStr, prevMonthDate.getMonth() + 1);

    // Fetch data
    const allEmployees = await employeeRepository.getEmployees();
    // Internal Payroll is only for provisioned Hire Huub employees. Workforce,
    // candidates, client staff and other external records do not have a Firebase UID.
    const activeEmployees = allEmployees.filter(e => 
      (e.employmentStatus === 'Active' || e.status === 'Active') &&
      Boolean(e.firebaseUid)
    );

    const currentAttendance = await attendanceRepository.getDailyForOrganization(startDate, endDate);
    const previousAttendance = await attendanceRepository.getDailyForOrganization(`${prevMonthStr}-01`, `${prevMonthStr}-${prevDaysInMonth.toString().padStart(2, '0')}`);
    const holidays = await calendarService.getHolidays().catch(() => []);
    const holidayDates = new Set(holidays.filter((holiday) => holiday.date >= startDate && holiday.date <= endDate).map((holiday) => holiday.date));

    // Fetch incentives
    let incentiveService: any = null;
    try {
      const module = await import('../../Management/services/incentiveEngineService');
      incentiveService = module.incentiveEngineService;
    } catch {
      // ignore if missing
    }

    const records: EmployeePayrollRecord[] = [];

    for (const emp of activeEmployees) {
      const empId = emp.employeeId || emp.id || '';
      
      // Calculate Attendance for current month
      let present = 0;
      let late = 0;
      let halfDay = 0;
      let leave = 0;
      let weekOff = 0;
      let holiday = 0;
      let absent = 0;

      const empDaily = currentAttendance.filter(a => a.employeeId === empId);
      const recordedDates = new Set(empDaily.map((daily) => daily.attendanceDate));
      empDaily.forEach(d => {
        const s = d.status.toLowerCase();
        if (s.includes('half day')) {
          halfDay += 1;
        } else if (s === 'late') {
          late += 1;
        } else if (s.includes('present') || s.includes('regularized') || s === 'wfh') {
          present += 1;
        } else if (s.includes('leave')) {
          leave += 1;
        } else if (s.includes('week off')) {
          weekOff += 1;
        } else if (s.includes('holiday')) {
          holiday += 1;
        } else if (s.includes('absent')) {
          absent += 1;
        }
      });

      // Attendance calendar resolves non-recorded calendar days as Holiday, then Sunday Week Off.
      // Mirror that canonical precedence for payroll so Sundays are never silently lost.
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = `${monthStr}-${String(day).padStart(2, '0')}`;
        if (recordedDates.has(date)) continue;
        if (holidayDates.has(date)) holiday += 1;
        else if (new Date(year, month - 1, day).getDay() === 0) weekOff += 1;
      }

      // Apply Overrides if any
      const manual = overrides[empId];
      if (manual) {
        present = manual.present;
        late = manual.late;
        halfDay = manual.halfDay;
        leave = manual.leave;
        weekOff = manual.weekOff;
        holiday = manual.holiday;
        absent = manual.absent;
      }

      // Half Day is weighted at 0.5; WFH, Late, Present, Holiday, and Week Off count as full days.
      const currentTotalWorkingDays = calculateWorkingDays({ present, late, halfDay, leave, weekOff, holiday, absent });

      // Carry forward logic
      let currentMonthPayableDays = currentTotalWorkingDays;
      let carryForwardPayableDays = 0;

      if (emp.joiningDate) {
        const joiningDateObj = new Date(emp.joiningDate);
        const joiningYear = joiningDateObj.getFullYear();
        const joiningMonth = joiningDateObj.getMonth() + 1;
        const joiningDay = joiningDateObj.getDate();

        const joiningMonthStr = `${joiningYear}-${joiningMonth.toString().padStart(2, '0')}`;

        if (joiningMonthStr === monthStr && joiningDay >= 21) {
          // Joined this month >= 21, carry forward to next month
          currentMonthPayableDays = 0;
        } else if (joiningMonthStr === prevMonthStr && joiningDay >= 21) {
          // Joined last month >= 21, bring those days here
          const empPrevDaily = previousAttendance.filter(a => a.employeeId === empId && a.attendanceDate >= emp.joiningDate);
          const previousMonthAttendance = {
            present: 0,
            late: 0,
            halfDay: 0,
            leave: 0,
            weekOff: 0,
            holiday: 0,
            absent: 0,
          };
          empPrevDaily.forEach((daily) => {
            const status = daily.status.toLowerCase();
            if (status.includes('half day')) previousMonthAttendance.halfDay += 1;
            else if (status === 'late') previousMonthAttendance.late += 1;
            else if (status.includes('present') || status.includes('regularized') || status === 'wfh') previousMonthAttendance.present += 1;
            else if (status.includes('leave')) previousMonthAttendance.leave += 1;
            else if (status.includes('week off')) previousMonthAttendance.weekOff += 1;
            else if (status.includes('holiday')) previousMonthAttendance.holiday += 1;
            else if (status.includes('absent')) previousMonthAttendance.absent += 1;
          });
          carryForwardPayableDays = calculateWorkingDays(previousMonthAttendance);
        }
      }

      // Salary Profile
      const configuredGross = Number(emp.grossSalary || emp.monthlyGross || emp.salary || 0);
      const basicConfig = Math.round(configuredGross * 0.5);
      const hraConfig = Math.round(basicConfig * 0.4);
      const specialAllowanceConfig = Math.max(0, configuredGross - (basicConfig + hraConfig));

      const pfApplicable = Boolean(emp.pfApplicable);
      const esicApplicable = Boolean(emp.esicApplicable);
      const ptApplicable = Boolean(emp.ptApplicable);

      // Incentive Arrears (Previous Month)
      let previousMonthIncentive = 0;
      if (incentiveService) {
        try {
          const snap = await incentiveService.calculateIncentiveForEmployee(empId, '', prevMonthStr);
          if (snap) {
            previousMonthIncentive = snap.totalIncentive || 0;
          }
        } catch {
          // ignore
        }
      }

      const baseRecord: EmployeePayrollRecord = {
        employeeId: empId,
        employeeCode: emp.employeeCode || empId,
        employeeName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
        joiningDate: emp.joiningDate,

        basicConfig,
        hraConfig,
        specialAllowanceConfig,
        pfApplicable,
        esicApplicable,
        ptApplicable,

        attendance: {
          present,
          late,
          halfDay,
          leave,
          weekOff,
          holiday,
          absent,
          totalWorkingDays: currentTotalWorkingDays
        },
        currentMonthPayableDays,
        carryForwardPayableDays,
        totalPayableDays: 0,
        daysInMonth,
        carryForwardDaysInMonth: prevDaysInMonth,

        earnedBasic: 0,
        earnedHra: 0,
        earnedSpecialAllowance: 0,
        previousMonthIncentive,
        grossSalary: 0,

        calculatedPf: 0,
        calculatedEsic: 0,
        calculatedPt: 0,
        totalDeductions: 0,
        netSalary: 0
      };
      // One pure calculator is used for initial aggregation and manual recalculation.
      records.push(recalculatePayrollRecord(baseRecord, baseRecord.attendance, month, monthStr));
    }

    const runId = `register-${monthStr}`;
    const run: PayrollRegisterRun = {
      id: runId,
      month: monthStr,
      status: 'Draft',
      totalEmployees: records.length,
      totalGrossPay: records.reduce((sum, r) => sum + r.grossSalary, 0),
      totalDeductions: records.reduce((sum, r) => sum + r.totalDeductions, 0),
      totalNetPayable: records.reduce((sum, r) => sum + r.netSalary, 0),
      records,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return run;
  },

  async saveRun(run: PayrollRegisterRun): Promise<void> {
    await setDoc(doc(db, PAYROLL_REGISTER_COLLECTION, run.id), {
      ...run,
      updatedAt: new Date().toISOString()
    });
  },

  async finalizeRun(runId: string): Promise<void> {
    const run = await this.getPayrollRun(runId.replace('register-', ''));
    if (!run) throw new Error('Run not found');
    
    run.status = 'Finalized';
    run.finalizedAt = new Date().toISOString();
    run.updatedAt = new Date().toISOString();
    
    await setDoc(doc(db, PAYROLL_REGISTER_COLLECTION, run.id), run);
  },

  async generatePayslips(runRecord: PayrollRegisterRun): Promise<void> {
    if (runRecord.status !== 'Finalized') {
      throw new Error('Can only generate payslips for Finalized payroll.');
    }
    
    // Import adminService and AutomationService
    
    const { AutomationService } = await import('../../../services/automation/automationService');
    
    const companySettings = await adminService.getCompanySettings();
    const [yearStr, monthStr] = runRecord.month.split('-');
    const yearNum = parseInt(yearStr, 10);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const fullMonthName = monthNames[parseInt(monthStr, 10) - 1];

    for (const record of runRecord.records) {
      const payslipId = `pslip-${runRecord.month}-${record.employeeCode}`;
      const snapshotId = `psnap-${Date.now()}-${record.employeeId}`;
      
      const payslipPayload: any = {
        documentType: 'PAYSLIP',
        entityId: payslipId,
        data: {
          legalName: companySettings?.companyName || 'Company',
          salaryMonth: `${fullMonthName} ${yearNum}`,
          employeeName: record.employeeName,
          employeeCode: record.employeeCode,
          joiningDate: record.joiningDate,
          generatedOn: new Date().toISOString().split('T')[0],
          
          basicPay: `${record.earnedBasic.toLocaleString('en-IN')}`,
          hra: `${record.earnedHra.toLocaleString('en-IN')}`,
          specialAllowance: `${record.earnedSpecialAllowance.toLocaleString('en-IN')}`,
          grossEarnings: `${record.grossSalary.toLocaleString('en-IN')}`,
          totalDeductions: `${record.totalDeductions.toLocaleString('en-IN')}`,
          netPay: `${record.netSalary.toLocaleString('en-IN')}`,
          netPayWords: `Rupees ${record.netSalary.toLocaleString('en-IN')} Only`,
        }
      };
      
      if (record.previousMonthIncentive > 0) {
        payslipPayload.data.performanceIncentive = `${record.previousMonthIncentive.toLocaleString('en-IN')}`;
      }
      if (record.calculatedPf > 0) {
        payslipPayload.data.pfDeduction = `${record.calculatedPf.toLocaleString('en-IN')}`;
      }
      if (record.calculatedEsic > 0) {
        payslipPayload.data.esicDeduction = `${record.calculatedEsic.toLocaleString('en-IN')}`;
      }
      if (record.calculatedPt > 0) {
        payslipPayload.data.ptDeduction = `${record.calculatedPt.toLocaleString('en-IN')}`;
      }
      
      const docRes = await AutomationService.requestDocumentGeneration(payslipPayload);
      
      let relativeStoragePath = `hr/payslips/${docRes?.fileName || payslipId + '.pdf'}`;
      if ((docRes as any)?.storagePath && !(docRes as any)?.storagePath.startsWith('http')) {
        relativeStoragePath = (docRes as any)?.storagePath;
      }
      
      const payslipRecord: any = {
        id: payslipId,
        payslipId,
        payrollRunId: runRecord.id,
        employeeId: record.employeeId,
        employeeCode: record.employeeCode,
        employeeName: record.employeeName,
        month: runRecord.month,
        gross: record.grossSalary,
        deductions: record.totalDeductions,
        netPay: record.netSalary,
        storagePath: relativeStoragePath,
        fileName: docRes?.fileName || `${payslipId}.pdf`,
        documentId: docRes?.documentId,
        snapshotId,
        status: 'Generated',
        generatedAt: new Date().toISOString()
      };
      
      if (docRes?.fileUrl) {
         payslipRecord.downloadUrl = docRes.fileUrl;
      }
      
      await setDoc(doc(db, 'generated_payslips', payslipId), payslipRecord);
      
      // Also register the generated payslip as a Document linked to the canonical employeeId
      // This seamlessly integrates it into the People -> Employee Profile -> Documents section
      const { documentService } = await import('../../../services/document/documentService');
      const docRecord = {
        documentId: payslipId,
        companyId: companySettings?.id || 'HireHuub',
        branchId: '',
        category: 'Payroll',
        module: 'Payroll',
        documentType: 'Payslip',
        referenceId: record.employeeId,
        title: `Payslip - ${runRecord.month}`,
        fileName: payslipRecord.fileName,
        version: 1,
        status: 'Generated',
        storagePath: relativeStoragePath,
        downloadUrl: docRes?.fileUrl || '',
        fileUrl: docRes?.fileUrl || '',
        fileSize: 0,
        mimeType: 'application/pdf',
        requiresSignature: false,
        isSigned: false,
        signedBy: '',
        qrCodeUrl: '',
        isLocked: true,
        generatedBy: 'System',
        generatedAt: payslipRecord.generatedAt,
        emailed: false,
        emailedTo: '',
        downloadCount: 0,
        archived: false,
        targetType: 'Employee',
        remarks: 'Automatically generated by Payroll Register',
        createdBy: 'System',
        updatedBy: 'System'
      };
      
      try {
        await documentService.create(docRecord as any);
      } catch (err) {
        console.warn('Failed to register Document reference for payslip:', err);
      }

    }
  },

  async generateBankProcess(runRecord: PayrollRegisterRun, debitAccountNumber: string): Promise<void> {
    if (runRecord.status !== 'Finalized') {
      throw new Error('Can only generate bank process for Finalized payroll.');
    }
    if (!debitAccountNumber) {
      throw new Error('Please select a valid Debit Account Number before generating the Bank Excel.');
    }

    const { employeeRepository } = await import('../../Employee/repositories/employeeRepository');

    const allEmployees = await employeeRepository.getEmployees();
    const empMap = new Map(allEmployees.map(e => [e.employeeId || e.id, e]));
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const [yearStr, monthNumStr] = runRecord.month.split('-');
    const payrollMonthStr = monthNames[parseInt(monthNumStr, 10) - 1];
    const payrollYearStr = yearStr;

    // Transaction Date (Actual Date)
    const today = new Date();
    const tDate = String(today.getDate()).padStart(2, '0');
    const tMonth = String(today.getMonth() + 1).padStart(2, '0');
    const tYear = today.getFullYear();
    const transactionDateStr = `${tDate}-${tMonth}-${tYear}`;

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bank Process');
    
    worksheet.columns = [
      { header: 'Debit Account Number', key: 'debit', width: 25 },
      { header: 'Transaction Amount', key: 'amount', width: 20 },
      { header: 'Transaction Currency', key: 'currency', width: 20 },
      { header: 'Beneficiary Name', key: 'name', width: 30 },
      { header: 'Beneficiary Account Number', key: 'account', width: 25 },
      { header: 'Beneficiary IFSC Code', key: 'ifsc', width: 20 },
      { header: 'Transaction Date', key: 'date', width: 20 },
      { header: 'Payment Mode', key: 'mode', width: 20 },
      { header: 'Customer Reference Number', key: 'ref', width: 40 },
    ];
    
    for (const record of runRecord.records) {
      if (record.netSalary > 0) {
        const emp = empMap.get(record.employeeId);
        if (!emp) {
          throw new Error(`Validation Error: Employee ${record.employeeCode} has no Employee Profile.`);
        }
        const acct = emp.accountNumber?.trim();
        const ifsc = emp.ifscCode?.trim();
        
        if (!acct) {
           throw new Error(`Validation Error: Employee ${record.employeeCode} is missing Bank Account Number in the Employee Profile.`);
        }
        if (!ifsc) {
           throw new Error(`Validation Error: Employee ${record.employeeCode} is missing IFSC Code in the Employee Profile.`);
        }

        const firstName = (emp.firstName || record.employeeName.split(' ')[0]).replace(/\s+/g, '');
        const actualEmpId = record.employeeId || '';
        // Internal Payroll is paid by Hire Huub, not by a client. The existing
        // bank-file reference remains deterministic without a placement lookup.
        const customerRef = `${firstName}HireHuub${payrollMonthStr}${payrollYearStr}${actualEmpId}`;

        worksheet.addRow({
          debit: debitAccountNumber,
          amount: record.netSalary,
          currency: 'INR',
          name: record.employeeName,
          account: acct,
          ifsc: ifsc,
          date: transactionDateStr,
          mode: 'IMPS',
          ref: customerRef
        });
      }
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HireHuub_Payroll_Bank_${runRecord.month}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
