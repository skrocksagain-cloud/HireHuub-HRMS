export type PayrollRunStatus = 'Draft' | 'Calculated' | 'Finalized';

export interface PayrollAttendance {
  present: number;
  late: number;
  halfDay: number;
  leave: number;
  weekOff: number;
  holiday: number;
  absent: number;
  /** Present + Late + half of Half Day + Holiday + Week Off. Leave and Absent are zero. */
  totalWorkingDays: number;
}

export interface EmployeePayrollRecord {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  joiningDate: string;

  // Configuration snapshot
  basicConfig: number;
  hraConfig: number;
  specialAllowanceConfig: number;
  pfApplicable: boolean;
  esicApplicable: boolean;
  ptApplicable: boolean;

  // Attendance & Days
  attendance: PayrollAttendance;
  currentMonthPayableDays: number;
  carryForwardPayableDays: number;
  totalPayableDays: number; // current + carryForward
  daysInMonth: number;
  carryForwardDaysInMonth?: number;

  // Calculated Earnings (Prorated)
  earnedBasic: number;
  earnedHra: number;
  earnedSpecialAllowance: number;
  previousMonthIncentive: number; // Month - 1 arrears
  grossSalary: number;

  // Calculated Deductions
  calculatedPf: number;
  calculatedEsic: number;
  calculatedPt: number;
  totalDeductions: number;

  // Net
  netSalary: number;
}

export interface PayrollRegisterRun {
  id: string; // e.g. "payroll-register-2026-09"
  month: string; // "YYYY-MM"
  status: PayrollRunStatus;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPayable: number;
  records: EmployeePayrollRecord[];
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

export interface AttendanceOverride {
  employeeId: string;
  present: number;
  late: number;
  halfDay: number;
  leave: number;
  weekOff: number;
  holiday: number;
  absent: number;
}
