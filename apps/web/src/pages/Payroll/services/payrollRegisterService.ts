import { doc, getDoc, setDoc } from 'firebase/firestore';
import { adminService } from '../../../services/admin/adminService';
import { db } from '../../../firebase/firebase';
import type { AttendanceOverride, EmployeePayrollRecord, PayrollRegisterRun } from '../types';
import { employeeRepository } from '../../Employee/repositories/employeeRepository';
import { attendanceRepository } from '../../Attendance/repositories/attendanceRepository';

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
    const activeEmployees = allEmployees.filter(e => 
      (e.employmentStatus === 'Active' || e.status === 'Active') &&
      e.department?.toLowerCase() !== 'management'
    );

    const currentAttendance = await attendanceRepository.getDailyForOrganization(startDate, endDate);
    const previousAttendance = await attendanceRepository.getDailyForOrganization(`${prevMonthStr}-01`, `${prevMonthStr}-${prevDaysInMonth.toString().padStart(2, '0')}`);

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
      let leave = 0;
      let weekOff = 0;
      let holiday = 0;
      let absent = 0;

      const empDaily = currentAttendance.filter(a => a.employeeId === empId);
      empDaily.forEach(d => {
        const s = d.status.toLowerCase();
        if (s.includes('present') || s.includes('regularized') || s.includes('half day')) {
          present += (s.includes('half day') ? 0.5 : 1);
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

      // Apply Overrides if any
      const manual = overrides[empId];
      if (manual) {
        present = manual.present;
        leave = manual.leave;
        weekOff = manual.weekOff;
        holiday = manual.holiday;
        absent = manual.absent;
      }

      const currentTotalWorkingDays = present + leave + weekOff + holiday;

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
          let prevWd = 0;
          empPrevDaily.forEach(d => {
            const s = d.status.toLowerCase();
            if (s.includes('present') || s.includes('regularized') || s.includes('leave') || s.includes('week off') || s.includes('holiday')) {
              prevWd += 1;
            }
          });
          carryForwardPayableDays = prevWd;
        }
      }

      const totalPayableDays = currentMonthPayableDays + carryForwardPayableDays;

      // Salary Profile
      const configuredGross = Number(emp.grossSalary || emp.monthlyGross || emp.salary || 0);
      const basicConfig = Math.round(configuredGross * 0.5);
      const hraConfig = Math.round(basicConfig * 0.4);
      const specialAllowanceConfig = Math.max(0, configuredGross - (basicConfig + hraConfig));

      const pfApplicable = Boolean(emp.pfApplicable);
      const esicApplicable = Boolean(emp.esicApplicable);
      const ptApplicable = Boolean(emp.ptApplicable);

      // Prorate Earnings
      // If there is carry forward, it should be based on previous month's divisor, but for simplicity we'll just sum the days 
      // or prorate current days by current month divisor, and previous days by prev month divisor.
      const currentRatio = currentMonthPayableDays / daysInMonth;
      const prevRatio = carryForwardPayableDays / prevDaysInMonth;

      const earnedBasic = Math.round((basicConfig * currentRatio) + (basicConfig * prevRatio));
      const earnedHra = Math.round((hraConfig * currentRatio) + (hraConfig * prevRatio));
      const earnedSpecialAllowance = Math.round((specialAllowanceConfig * currentRatio) + (specialAllowanceConfig * prevRatio));

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

      const grossSalary = earnedBasic + earnedHra + earnedSpecialAllowance + previousMonthIncentive;

      // Statutory Deductions
      const calculatedPf = pfApplicable ? Math.min(1800, Math.round(earnedBasic * 0.12)) : 0;
      const calculatedEsic = (esicApplicable && grossSalary <= 21000) ? Math.round(grossSalary * 0.0075) : 0;
      let calculatedPt = 0;
      if (ptApplicable) {
        if (grossSalary > 25000) {
          calculatedPt = month === 2 ? 208 : 200;
        } else if (grossSalary > 15000) {
          calculatedPt = 150;
        }
      }

      const totalDeductions = calculatedPf + calculatedEsic + calculatedPt;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      records.push({
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
          leave,
          weekOff,
          holiday,
          absent,
          totalWorkingDays: currentTotalWorkingDays
        },
        currentMonthPayableDays,
        carryForwardPayableDays,
        totalPayableDays,
        daysInMonth,

        earnedBasic,
        earnedHra,
        earnedSpecialAllowance,
        previousMonthIncentive,
        grossSalary,

        calculatedPf,
        calculatedEsic,
        calculatedPt,
        totalDeductions,
        netSalary
      });
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
    const { workforceRepository } = await import('../../Workbench/workforce/repositories/workforceRepository');
    

    const allEmployees = await employeeRepository.getEmployees();
    const empMap = new Map(allEmployees.map(e => [e.employeeId || e.id, e]));
    
    // Resolve existing Employee Brand from workforce placements
    const workforceItems = await workforceRepository.getWorkforceItems();
    const placementBrandMap = new Map<string, string>();
    workforceItems.forEach((item: any) => {
      const pEmpId = item.placement?.payrollEmployeeId || item.payrollEmployeeId || item.id;
      const clientName = item.client?.name || item.clientName;
      if (pEmpId && clientName) {
        placementBrandMap.set(pEmpId, clientName);
      }
    });

    

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
        const emp = empMap.get(record.employeeId) || {} as any;
        const acct = emp.accountNumber?.trim();
        const ifsc = emp.ifscCode?.trim();
        
        if (!acct || !ifsc) {
           throw new Error(`Validation Error: Employee ${record.employeeName} (${record.employeeCode}) is missing Bank Account or IFSC details. Please correct their profile and try again.`);
        }

        const firstName = (emp.firstName || record.employeeName.split(' ')[0]).replace(/\s+/g, '');
        const actualEmpId = record.employeeId || '';
        
        const rawBrand = placementBrandMap.get(actualEmpId) || placementBrandMap.get(record.employeeCode);
        
        if (!rawBrand) {
           throw new Error(`Validation Error: Employee ${record.employeeName} (${record.employeeCode}) has no assigned Brand or Client placement. Please assign a valid Brand/Client to this employee before generating the Bank Excel.`);
        }
        
        const finalBrand = rawBrand.replace(/\s+/g, '');
        
        const customerRef = `${firstName}${finalBrand}${payrollMonthStr}${payrollYearStr}${actualEmpId}`;

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
