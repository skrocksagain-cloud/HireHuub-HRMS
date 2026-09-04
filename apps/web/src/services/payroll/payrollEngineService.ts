import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type {
  SalaryComponent,
  BrandSalaryStructure,
  EmployeeSalaryProfile,
  PayrollRunRecord,
  PayrollCalculationResult,
  PayrollValidationItem,
  GeneratedPayslipRecord,
  PayrollSnapshot,
  StatutoryRuleConfig,
} from '../../types/Admin';
import { employeeService } from '../../pages/Employee/services/employeeService';
import { adminService } from '../admin/adminService';
import { attendanceRepository } from '../../pages/Attendance/repositories/attendanceRepository';

const COMPONENT_COLLECTION = 'salaryComponents';
const STRUCTURE_COLLECTION = 'salaryStructures';
const PROFILE_COLLECTION = 'employeeSalaryProfiles';
const PAYROLL_RUN_COLLECTION = 'payrollRuns';
const PAYSLIP_COLLECTION = 'generatedPayslips';

// Default Master Component Catalog
const INITIAL_MASTER_COMPONENTS: SalaryComponent[] = [
  {
    id: 'comp-basic',
    name: 'Basic Pay',
    code: 'BASIC',
    type: 'Earning',
    calcType: 'Percentage',
    formulaString: '50% Monthly CTC',
    displayOrder: 1,
    isActive: true,
    isTaxable: true,
    isPfApplicable: true,
    isEsicApplicable: true,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-hra',
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    type: 'Earning',
    calcType: 'Percentage',
    formulaString: '40% Basic Pay',
    displayOrder: 2,
    isActive: true,
    isTaxable: true,
    isPfApplicable: false,
    isEsicApplicable: true,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-conveyance',
    name: 'Conveyance Allowance',
    code: 'CONV',
    type: 'Earning',
    calcType: 'Fixed',
    formulaString: 'Fixed ₹1,600 / month',
    displayOrder: 3,
    isActive: true,
    isTaxable: false,
    isPfApplicable: false,
    isEsicApplicable: false,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-special',
    name: 'Special Allowance',
    code: 'SPECIAL',
    type: 'Earning',
    calcType: 'Fixed',
    formulaString: 'Balancing Amount',
    displayOrder: 4,
    isActive: true,
    isTaxable: true,
    isPfApplicable: false,
    isEsicApplicable: true,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-att-bonus',
    name: 'Attendance Bonus',
    code: 'ATT_BONUS',
    type: 'Earning',
    calcType: 'Attendance',
    formulaString: '₹1,000 if Present >= 25 Days',
    displayOrder: 5,
    isActive: true,
    isTaxable: true,
    isPfApplicable: false,
    isEsicApplicable: false,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-incentive',
    name: 'Performance Incentive',
    code: 'PERF_INC',
    type: 'Earning',
    calcType: 'Performance',
    formulaString: 'Mapped from Performance KPI Score',
    displayOrder: 6,
    isActive: true,
    isTaxable: true,
    isPfApplicable: false,
    isEsicApplicable: false,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-pf-ded',
    name: 'Provident Fund (PF)',
    code: 'PF',
    type: 'Deduction',
    calcType: 'Percentage',
    formulaString: '12% Basic Pay (Capped ₹1,800)',
    displayOrder: 10,
    isActive: true,
    isTaxable: false,
    isPfApplicable: true,
    isEsicApplicable: false,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-esic-ded',
    name: 'ESIC Deduction',
    code: 'ESIC',
    type: 'Deduction',
    calcType: 'Percentage',
    formulaString: '0.75% Gross Earnings',
    displayOrder: 11,
    isActive: true,
    isTaxable: false,
    isPfApplicable: false,
    isEsicApplicable: true,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-pt-ded',
    name: 'Professional Tax (PT)',
    code: 'PT',
    type: 'Deduction',
    calcType: 'Fixed',
    formulaString: '₹200 Statutory Slab',
    displayOrder: 12,
    isActive: true,
    isTaxable: false,
    isPfApplicable: false,
    isEsicApplicable: false,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-lop-ded',
    name: 'Leave Without Pay (LOP)',
    code: 'LOP',
    type: 'Deduction',
    calcType: 'Attendance',
    formulaString: 'Gross ÷ Working Days × LOP Days',
    displayOrder: 13,
    isActive: true,
    isTaxable: false,
    isPfApplicable: false,
    isEsicApplicable: false,
    isVisibleOnPayslip: true,
    effectiveFrom: '2026-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class UniversalPayrollEngineService {
  // 1. Salary Component Master
  async getSalaryComponents(): Promise<SalaryComponent[]> {
    try {
      const snap = await getDocs(collection(db, COMPONENT_COLLECTION));
      if (snap.empty) {
        // Seed default catalog
        for (const comp of INITIAL_MASTER_COMPONENTS) {
          await setDoc(doc(db, COMPONENT_COLLECTION, comp.id), comp);
        }
        return INITIAL_MASTER_COMPONENTS;
      }
      return snap.docs.map((d) => d.data() as SalaryComponent);
    } catch {
      return INITIAL_MASTER_COMPONENTS;
    }
  }

  async saveSalaryComponent(component: SalaryComponent): Promise<void> {
    const compId = component.id || `comp-${Date.now()}`;
    const payload = {
      ...component,
      id: compId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COMPONENT_COLLECTION, compId), payload);
  }

  // 2. Brand Salary Structure Engine
  async getBrandSalaryStructures(brandProfileId?: string): Promise<BrandSalaryStructure[]> {
    if (!brandProfileId) return [];
    try {
      const q = query(collection(db, STRUCTURE_COLLECTION), where('brandProfileId', '==', brandProfileId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as BrandSalaryStructure);
    } catch {
      return [];
    }
  }

  async saveBrandSalaryStructure(structure: BrandSalaryStructure): Promise<void> {
    const structId = structure.id || `struct-${Date.now()}`;
    const payload = {
      ...structure,
      id: structId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, STRUCTURE_COLLECTION, structId), payload);
  }

  // 3. Employee Salary Profile Engine
  async getEmployeeSalaryProfiles(brandProfileId?: string): Promise<EmployeeSalaryProfile[]> {
    if (!brandProfileId) return [];
    try {
      const q = query(collection(db, PROFILE_COLLECTION), where('brandProfileId', '==', brandProfileId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as EmployeeSalaryProfile);
    } catch {
      return [];
    }
  }

  async getEmployeeSalaryProfile(employeeId: string): Promise<EmployeeSalaryProfile | null> {
    try {
      const docRef = doc(db, PROFILE_COLLECTION, employeeId);
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as EmployeeSalaryProfile;
      return null;
    } catch {
      return null;
    }
  }

  async saveEmployeeSalaryProfile(profile: EmployeeSalaryProfile): Promise<void> {
    const payload = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, PROFILE_COLLECTION, profile.employeeId), payload);
  }

  // 4. Statutory Rules Engine
  getStatutoryRules(): StatutoryRuleConfig {
    return {
      pfEmployerPercent: 12.0,
      pfEmployeePercent: 12.0,
      pfCapLimit: 15000,
      esicEmployerPercent: 3.25,
      esicEmployeePercent: 0.75,
      esicCapLimit: 21000,
      ptSlabs: [
        { minGross: 0, maxGross: 15000, ptAmount: 0 },
        { minGross: 15001, maxGross: 25000, ptAmount: 150 },
        { minGross: 25001, maxGross: 999999, ptAmount: 200 },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  // 5. Pre-Approval Validation Engine
  async validatePayrollRun(
    brandProfileId: string,
    results: PayrollCalculationResult[]
  ): Promise<PayrollValidationItem[]> {
    const validationItems: PayrollValidationItem[] = [];
    const profiles = await this.getEmployeeSalaryProfiles(brandProfileId);
    
    // Check for brand-specific or global published payslip template
    const brandTemplates = await adminService.getTemplatesByBrand(brandProfileId, 'Payslip', true);
    const allTemplates = brandTemplates.length > 0 ? brandTemplates : await adminService.getTemplatesByBrand('', 'Payslip', true);

    if (allTemplates.length === 0) {
      validationItems.push({
        type: 'error',
        code: 'MISSING_BRAND_PAYSLIP_TEMPLATE',
        message: `Brand ${brandProfileId} has no Published Payslip Template configured in Administration -> Templates.`,
      });
    }

    for (const res of results) {
      const prof = profiles.find((p) => p.employeeId === res.employeeId);

      if (!prof) {
        validationItems.push({
          type: 'warning',
          code: 'MISSING_SALARY_PROFILE',
          employeeId: res.employeeId,
          employeeName: res.employeeName,
          message: `Employee ${res.employeeName} has no configured Salary Profile (Excluded from run).`,
        });
        continue;
      }

      if (!prof.accountNumber || !prof.ifscCode) {
        validationItems.push({
          type: 'warning',
          code: 'MISSING_BANK_INFO',
          employeeId: res.employeeId,
          employeeName: res.employeeName,
          message: `Employee ${res.employeeName} is missing Bank Account Number or IFSC Code.`,
        });
      }

      if (res.netSalary < 0) {
        validationItems.push({
          type: 'error',
          code: 'NEGATIVE_NET_SALARY',
          employeeId: res.employeeId,
          employeeName: res.employeeName,
          message: `Employee ${res.employeeName} has negative Net Pay (₹${res.netSalary.toLocaleString('en-IN')}).`,
        });
      }
    }

    return validationItems;
  }

  // 6. Bulk Payroll Run Calculation Engine
  async executePayrollRun(
    month: string,
    year: number,
    brandProfileId: string
  ): Promise<PayrollRunRecord> {
    const emps = await employeeService.getEmployees();
    const profiles = await this.getEmployeeSalaryProfiles(brandProfileId);
    const statutory = this.getStatutoryRules();

    const calculationResults: PayrollCalculationResult[] = [];
    const excludedEmployees: Array<{ employeeId: string; employeeCode?: string; employeeName: string; reason: string }> = [];
    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPayable = 0;

    for (const emp of emps) {
      const empRec = emp as unknown as Record<string, unknown>;
      const empId = emp.id || emp.employeeId || `emp-${Math.random()}`;
      const empCode = emp.employeeCode || emp.employeeId || empId;
      const empFullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.fullName || 'Employee';

      const empBankAcc = (emp as any).accountNumber || (emp as any).bankAccount || '';
      const empBankName = (emp as any).bankName || '';
      const empIfsc = (emp as any).ifscCode || (emp as any).ifsc || '';

      const prof = profiles.find((p) => p.employeeId === empId);

      const rawCtc = typeof empRec.ctc === 'number' && empRec.ctc > 0 ? empRec.ctc : (prof?.monthlyCtc ? prof.monthlyCtc * 12 : undefined);
      const rawMonthlyGross = prof?.monthlyCtc || (emp as any).monthlyGross || (emp as any).salary || (rawCtc ? rawCtc / 12 : 0);

      // Exclude employees with no salary structure/profile defined
      if (rawMonthlyGross <= 0) {
        excludedEmployees.push({
          employeeId: empId,
          employeeCode: empCode,
          employeeName: empFullName,
          reason: 'Salary Profile not configured',
        });
        continue;
      }

      const activeProf: EmployeeSalaryProfile = prof || {
        id: `prof-${empId}`,
        employeeId: empId,
        employeeName: empFullName,
        brandProfileId,
        brandName: 'Hire Huub',
        salaryStructureId: 'struct-std',
        salaryStructureName: 'Standard Salary Package',
        structureVersion: 1.0,
        effectiveDate: new Date().toISOString().split('T')[0],
        monthlyCtc: rawMonthlyGross,
        bankName: empBankName,
        accountNumber: empBankAcc,
        ifscCode: empIfsc,
        taxRegime: 'New',
        paymentMode: 'Bank Transfer',
        costCenter: 'Engineering',
        payrollStatus: 'Active',
        updatedAt: new Date().toISOString(),
      };

      const [yStr, mStr] = month.split('-');
      const yearNumVal = parseInt(yStr, 10) || year || new Date().getFullYear();
      const monthNumVal = parseInt(mStr, 10) || 8;
      const daysInMonth = new Date(yearNumVal, monthNumVal, 0).getDate();

      const monthlyGross = activeProf.monthlyCtc;

      // Dynamic Attendance Proration Integration
      const startDate = `${month}-01`;
      const endDate = `${month}-${String(daysInMonth).padStart(2, '0')}`;
      
      let totalWorkingDays = 0;
      let paidHolidayDays = 0;
      let weekOffDays = 0;
      let paidLeaveDays = 0;
      let paidDays = daysInMonth;

      try {
        const attRecords = await attendanceRepository.getDailyForEmployee(empId, startDate, endDate);
        if (attRecords && attRecords.length > 0) {
          totalWorkingDays = attRecords.filter((r) =>
            ['On Time', 'Grace Late', 'Late', 'WFH', 'Present', 'Half Day'].includes(r.status as string)
          ).length;
          paidHolidayDays = attRecords.filter((r) => (r.status as string) === 'Holiday').length;
          weekOffDays = attRecords.filter((r) => (r.status as string) === 'Week Off' || (r.status as string) === 'WeekOff').length;
          paidLeaveDays = attRecords.filter((r) => (r.status as string) === 'Leave').length;
          paidDays = totalWorkingDays + paidHolidayDays + weekOffDays + paidLeaveDays;
        }
      } catch {
        paidDays = daysInMonth;
      }

      // Earned Gross Salary Calculation
      const earnedGross = Math.round((monthlyGross / daysInMonth) * paidDays);
      const basicPay = Math.round(earnedGross * 0.5);
      const hraPay = Math.round(basicPay * 0.4);
      const conveyancePay = Math.min(1600, Math.round((1600 / daysInMonth) * paidDays));
      const specialPay = Math.max(0, earnedGross - (basicPay + hraPay + conveyancePay));

      // Dynamic Performance Incentive Integration using Configurable Slabs Engine
      let performanceScore = 0;
      let performanceIncentive = 0;
      try {
        const { incentiveEngineService } = await import('../../pages/Management/services/incentiveEngineService');
        const snapshot = await incentiveEngineService.calculateIncentiveForEmployee(empId, brandProfileId, month);
        if (snapshot) {
          performanceIncentive = snapshot.totalIncentive;
          performanceScore = Math.min(100, snapshot.achievementPercent);
        }
      } catch {
        performanceIncentive = 0;
      }

      const earningsBreakdown = [
        { componentId: 'comp-basic', name: 'Basic Pay', amount: basicPay },
        { componentId: 'comp-hra', name: 'House Rent Allowance (HRA)', amount: hraPay },
        { componentId: 'comp-conveyance', name: 'Conveyance Allowance', amount: conveyancePay },
        { componentId: 'comp-special', name: 'Special Allowance', amount: specialPay },
      ];

      if (performanceIncentive > 0) {
        earningsBreakdown.push({
          componentId: 'comp-incentive',
          name: 'Performance Incentive',
          amount: performanceIncentive,
        });
      }

      const grossEarnings = earnedGross + performanceIncentive;

      // Statutory Deductions
      const pfAmount = Math.min(1800, Math.round(basicPay * (statutory.pfEmployeePercent / 100)));
      const esicAmount = monthlyGross <= statutory.esicCapLimit ? Math.round(grossEarnings * (statutory.esicEmployeePercent / 100)) : 0;
      const ptAmount = grossEarnings > 25000 ? (monthNumVal === 2 ? 208 : 200) : grossEarnings > 15000 ? 150 : 0;

      const deductionsBreakdown = [
        { componentId: 'comp-pf-ded', name: 'Provident Fund (PF)', amount: pfAmount },
        { componentId: 'comp-esic-ded', name: 'ESIC Deduction', amount: esicAmount },
        { componentId: 'comp-pt-ded', name: 'Professional Tax (PT)', amount: ptAmount },
      ];

      const empDeductions = deductionsBreakdown.reduce((sum, item) => sum + item.amount, 0);
      const netSalary = Math.max(0, grossEarnings - empDeductions);

      totalGrossPay += grossEarnings;
      totalDeductions += empDeductions;
      totalNetPayable += netSalary;

      calculationResults.push({
        employeeId: empId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.employeeCode || emp.employeeId,
        department: emp.department || 'Engineering',
        brandProfileId,
        monthlyCtc: monthlyGross,
        grossEarnings,
        totalDeductions: empDeductions,
        netSalary,
        daysInMonth,
        totalWorkingDays,
        paidHolidayDays,
        weekOffDays,
        paidLeaveDays,
        paidDays,
        monthlyGross,
        earnedGross,
        workingDays: totalWorkingDays,
        presentDays: totalWorkingDays,
        lopDays: Math.max(0, daysInMonth - paidDays),
        performanceScore,
        performanceIncentive,
        earningsBreakdown,
        deductionsBreakdown,
        employerContributions: [
          { name: 'Employer PF (12%)', amount: pfAmount },
          { name: 'Employer ESIC (3.25%)', amount: Math.round(grossEarnings * (statutory.esicEmployerPercent / 100)) },
        ],
        isCalculated: true,
      });
    }

    const validationItems = await this.validatePayrollRun(brandProfileId, calculationResults);
    const hasErrors = validationItems.some((v) => v.type === 'error');

    const totalIncentive = calculationResults.reduce((sum, r) => sum + r.performanceIncentive, 0);

    const runRecord: PayrollRunRecord = {
      id: `prun-${month}-${brandProfileId}`,
      month,
      year,
      brandProfileId,
      brandName: 'Hire Huub',
      status: 'Calculated',
      totalEmployees: calculationResults.length,
      totalGrossPay,
      totalIncentive,
      totalDeductions,
      totalNetPayable,
      totalEmployerCost: Math.round(totalGrossPay * 1.12),
      validationItems,
      hasErrors,
      employeeResults: calculationResults,
      excludedEmployees,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, PAYROLL_RUN_COLLECTION, runRecord.id), runRecord);
    return runRecord;
  }

  // 7. Lock & Finalize Payroll Run Engine
  async updatePayrollRunStatus(
    runId: string,
    status: 'Review' | 'Finalized' | 'Released',
    actorName = 'Super Admin'
  ): Promise<void> {
    const docRef = doc(db, PAYROLL_RUN_COLLECTION, runId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const currentRun = snap.data() as PayrollRunRecord;
      if (currentRun.status === 'Finalized' && status !== 'Released') {
        throw new Error('Finalized payroll is immutable and cannot be modified directly.');
      }
    }

    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'Review') updates.lockedAt = new Date().toISOString();
    if (status === 'Finalized') {
      updates.finalizedAt = new Date().toISOString();
      updates.finalizedBy = actorName;
    }
    if (status === 'Released') {
      updates.releasedAt = new Date().toISOString();
      updates.releasedBy = actorName;
    }

    await updateDoc(docRef, updates);
  }

  // 8. Bank Transfer CSV Generator
  generateBankExportCSV(runRecord: PayrollRunRecord): string {
    let csv = 'Employee ID,Employee Name,Bank Name,Account Number,IFSC Code,Net Payable Amount (INR),Payment Mode\n';
    runRecord.employeeResults.forEach((res) => {
      csv += `"${res.employeeId}","${res.employeeName}","${(res as any).bankName || ''}","${(res as any).accountNumber || ''}","${(res as any).ifscCode || ''}",${res.netSalary},"Bank Transfer"\n`;
    });
    return csv;
  }

  // 9. Immutable Snapshot & Payslip Generation with PDF Generation & Storage Linkage
  async generatePayslipSnapshotsForRun(
    runRecord: PayrollRunRecord,
    actorName = 'Super Admin'
  ): Promise<GeneratedPayslipRecord[]> {
    if (runRecord.status !== 'Finalized' && runRecord.status !== 'Released') {
      throw new Error('Payslips can only be generated from a Finalized payroll run.');
    }

    const payslips: GeneratedPayslipRecord[] = [];
    const companySettings = await adminService.getCompanySettings();
    const activeBrandObj = companySettings?.brandProfilesList?.find((b) => b.id === runRecord.brandProfileId);

    const [yearStr, monthStr] = runRecord.month.split('-');
    const yearNum = parseInt(yearStr, 10) || new Date().getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = (parseInt(monthStr, 10) || 1) - 1;
    const fullMonthName = monthNames[monthIndex] || 'Month';

    const { AutomationService } = await import('../automation/automationService');

    for (const res of runRecord.employeeResults) {
      const empCodeClean = (res.employeeCode || res.employeeId || 'HH0001').replace(/[^a-zA-Z0-9]/g, '');
      const payslipId = `pslip-${runRecord.month}-${empCodeClean}`;
      const snapshotId = `psnap-${Date.now()}-${res.employeeId}`;

      const snapshot: PayrollSnapshot = {
        snapshotId,
        payrollRunId: runRecord.id,
        employeeId: res.employeeId,
        employeeSnapshot: { name: res.employeeName, id: res.employeeId, code: empCodeClean },
        attendanceSnapshot: { workingDays: res.workingDays, presentDays: res.presentDays, lopDays: res.lopDays },
        performanceSnapshot: { score: res.performanceScore, incentive: res.performanceIncentive },
        salaryStructureSnapshot: { monthlyCtc: res.monthlyCtc },
        brandSnapshot: (activeBrandObj as unknown as Record<string, unknown>) || {},
        companySnapshot: { name: companySettings?.companyName || 'Hire Huub ERP' },
        calculationResult: res,
        generatedAt: new Date().toISOString(),
        generatedBy: actorName,
      };

      const basicPay = res.earningsBreakdown?.find((e) => e.componentId === 'comp-basic')?.amount ?? 0;
      const hra = res.earningsBreakdown?.find((e) => e.componentId === 'comp-hra')?.amount ?? 0;
      const conv = res.earningsBreakdown?.find((e) => e.componentId === 'comp-conveyance')?.amount ?? 0;
      const special = res.earningsBreakdown?.find((e) => e.componentId === 'comp-special')?.amount ?? 0;

      const pf = res.deductionsBreakdown?.find((d) => d.componentId === 'comp-pf-ded')?.amount ?? 0;
      const esic = res.deductionsBreakdown?.find((d) => d.componentId === 'comp-esic-ded')?.amount ?? 0;
      const pt = res.deductionsBreakdown?.find((d) => d.componentId === 'comp-pt-ded')?.amount ?? 0;

      // Request Native Document Engine PDF Generation passing CANONICAL payslipId as entityId
      const payslipPayload = {
        brandId: runRecord.brandProfileId,
        documentType: 'PAYSLIP',
        entityId: payslipId,
        data: {
          legalName: companySettings?.companyName || 'Hire Huub People Solution Private Limited',
          brandName: activeBrandObj?.brandName || 'Hire Huub',
          brandAddress: activeBrandObj?.address || companySettings?.address || '',
          brandEmail: activeBrandObj?.email || companySettings?.email || '',
          brandPhone: activeBrandObj?.phone || companySettings?.phone || '',
          brandWebsite: activeBrandObj?.website || companySettings?.website || '',

          salaryMonth: `${fullMonthName} ${yearNum}`,
          employeeName: res.employeeName,
          employeeCode: empCodeClean,
          designation: (res as any).designation || 'Team Member',
          department: res.department || 'Engineering',
          joiningDate: (res as any).joiningDate || '2026-01-01',
          workLocation: (res as any).workLocation || 'Head Office',
          bankName: (res as any).bankName || 'HDFC Bank',
          accountNumber: (res as any).accountNumber || '',
          ifscCode: (res as any).ifscCode || '',
          pan: (res as any).pan || '',
          payslipId,
          generatedOn: new Date().toISOString().split('T')[0],

          basicPay: `₹${basicPay.toLocaleString('en-IN')}`,
          hra: `₹${hra.toLocaleString('en-IN')}`,
          conveyance: `₹${conv.toLocaleString('en-IN')}`,
          specialAllowance: `₹${special.toLocaleString('en-IN')}`,
          grossEarnings: `₹${res.grossEarnings.toLocaleString('en-IN')}`,

          pfDeduction: `₹${pf.toLocaleString('en-IN')}`,
          esicDeduction: `₹${esic.toLocaleString('en-IN')}`,
          ptDeduction: `₹${pt.toLocaleString('en-IN')}`,
          totalDeductions: `₹${res.totalDeductions.toLocaleString('en-IN')}`,
          netPay: `₹${res.netSalary.toLocaleString('en-IN')}`,
          netPayWords: `Rupees ${res.netSalary.toLocaleString('en-IN')} Only`,
        },
      };

      const docRes = await AutomationService.requestDocumentGeneration(payslipPayload);
      const rawFileUrl = docRes?.fileUrl || '';
      const rawFileName = docRes?.fileName || `${payslipId}.pdf`;
      const rawResObj = docRes as unknown as Record<string, unknown>;

      // Helper helper to resolve canonical relative storage path
      let relativeStoragePath = `hr/payslips/${rawFileName}`;
      if (rawResObj?.storagePath && typeof rawResObj.storagePath === 'string' && !rawResObj.storagePath.startsWith('http')) {
        relativeStoragePath = rawResObj.storagePath;
      } else if (rawFileUrl && rawFileUrl.includes('/o/')) {
        try {
          const encodedPath = rawFileUrl.split('/o/')[1].split('?')[0];
          relativeStoragePath = decodeURIComponent(encodedPath);
        } catch {
          relativeStoragePath = `hr/payslips/${rawFileName}`;
        }
      }

      if (!docRes?.success) {
        const errDetail = docRes?.error?.message || 'Storage path missing after document generation.';
        throw new Error(`Payslip PDF generation failed for ${res.employeeName}: ${errDetail}`);
      }

      const payslipRecord: GeneratedPayslipRecord = {
        id: payslipId,
        payslipId,
        payrollRunId: runRecord.id,
        employeeId: res.employeeId,
        employeeCode: empCodeClean,
        employeeName: res.employeeName,
        month: runRecord.month,
        salaryMonth: runRecord.month,
        brandProfileId: runRecord.brandProfileId,
        brandName: runRecord.brandName,
        templateId: 'tmpl-payslip-std',
        templateVersion: 1.0,
        gross: res.grossEarnings,
        incentive: res.performanceIncentive,
        deductions: res.totalDeductions,
        netPay: res.netSalary,
        storagePath: relativeStoragePath,
        downloadUrl: rawFileUrl || undefined,
        fileName: rawFileName,
        documentId: docRes.documentId || undefined,
        snapshotId,
        snapshot,
        status: 'Generated',
        generatedAt: new Date().toISOString(),
        generatedBy: actorName,
      };

      await setDoc(doc(db, PAYSLIP_COLLECTION, payslipRecord.id), payslipRecord);
      payslips.push(payslipRecord);
    }

    return payslips;
  }

  // 10. Release Generated Payslips
  async releasePayslipsForRun(runRecordId: string, actorName = 'Super Admin'): Promise<void> {
    const snap = await getDoc(doc(db, PAYROLL_RUN_COLLECTION, runRecordId));
    if (!snap.exists()) throw new Error('Payroll run not found.');

    const runRecord = snap.data() as PayrollRunRecord;
    if (runRecord.status !== 'Finalized' && runRecord.status !== 'Released') {
      throw new Error('Only Finalized payroll runs can have their payslips released.');
    }

    const payslipsSnap = await getDocs(collection(db, PAYSLIP_COLLECTION));
    const runPayslips = payslipsSnap.docs.filter((d) => d.data()?.payrollRunId === runRecordId);

    if (runPayslips.length === 0) {
      throw new Error('No generated payslips found for this payroll run. Generate payslips first.');
    }

    const releaseTime = new Date().toISOString();
    for (const pDoc of runPayslips) {
      const pData = pDoc.data() as GeneratedPayslipRecord;
      if (!pData.storagePath) {
        throw new Error(`Cannot release payslip for ${pData.employeeName}: PDF Storage Path missing.`);
      }
      await updateDoc(doc(db, PAYSLIP_COLLECTION, pDoc.id), {
        status: 'Released',
        releasedAt: releaseTime,
        releasedBy: actorName,
      });
    }

    await this.updatePayrollRunStatus(runRecordId, 'Released', actorName);
  }
}

export const payrollEngineService = new UniversalPayrollEngineService();
