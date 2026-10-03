import type { AttendanceOverride, EmployeePayrollRecord, PayrollAttendance, PayrollRegisterRun } from '../types';

export type PayrollAttendanceInput = Omit<PayrollAttendance, 'totalWorkingDays'>;

/** The sole Internal Payroll work-day rule. Leave and Absent deliberately contribute zero. */
export const calculateWorkingDays = (attendance: PayrollAttendanceInput): number =>
  attendance.present + attendance.late + attendance.halfDay * 0.5 + attendance.holiday + attendance.weekOff;

export const recalculatePayrollRecord = (
  record: EmployeePayrollRecord,
  attendanceInput: PayrollAttendanceInput,
  payrollMonth: number,
  payrollMonthKey?: string,
): EmployeePayrollRecord => {
  const attendance: PayrollAttendance = {
    ...attendanceInput,
    totalWorkingDays: calculateWorkingDays(attendanceInput),
  };
  // Carry-forward is an additional historic entitlement; all current-month amounts
  // are always derived from the same work-day value shown in the register.
  const [joiningYear, joiningMonth, joiningDay] = record.joiningDate.split('-').map(Number);
  const deferredCurrentMonth = Boolean(
    payrollMonthKey &&
    joiningYear &&
    joiningMonth &&
    joiningMonth === payrollMonth &&
    joiningDay >= 21 &&
    `${joiningYear}-${String(joiningMonth).padStart(2, '0')}` === payrollMonthKey
  );
  const currentMonthPayableDays = deferredCurrentMonth ? 0 : attendance.totalWorkingDays;
  const totalPayableDays = currentMonthPayableDays + record.carryForwardPayableDays;
  const currentRatio = currentMonthPayableDays / record.daysInMonth;
  const prevRatio = record.carryForwardPayableDays / (record.carryForwardDaysInMonth || record.daysInMonth);
  const earnedBasic = Math.round(record.basicConfig * (currentRatio + prevRatio));
  const earnedHra = Math.round(record.hraConfig * (currentRatio + prevRatio));
  const earnedSpecialAllowance = Math.round(record.specialAllowanceConfig * (currentRatio + prevRatio));
  const grossSalary = earnedBasic + earnedHra + earnedSpecialAllowance + record.previousMonthIncentive;
  const calculatedPf = record.pfApplicable ? Math.min(1800, Math.round(earnedBasic * 0.12)) : 0;
  const calculatedEsic = record.esicApplicable && grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;
  const calculatedPt = !record.ptApplicable ? 0 : grossSalary > 25000 ? (payrollMonth === 2 ? 208 : 200) : grossSalary > 15000 ? 150 : 0;
  const totalDeductions = calculatedPf + calculatedEsic + calculatedPt;

  return {
    ...record,
    attendance,
    currentMonthPayableDays,
    totalPayableDays,
    earnedBasic,
    earnedHra,
    earnedSpecialAllowance,
    grossSalary,
    calculatedPf,
    calculatedEsic,
    calculatedPt,
    totalDeductions,
    netSalary: Math.max(0, grossSalary - totalDeductions),
  };
};

export const attendanceOverrideFrom = (record: EmployeePayrollRecord): AttendanceOverride => ({
  employeeId: record.employeeId,
  present: record.attendance.present,
  late: record.attendance.late,
  halfDay: record.attendance.halfDay,
  leave: record.attendance.leave,
  weekOff: record.attendance.weekOff,
  holiday: record.attendance.holiday,
  absent: record.attendance.absent,
});

export const recalculatePayrollRun = (
  run: PayrollRegisterRun,
  overrides: Record<string, AttendanceOverride>,
): PayrollRegisterRun => {
  const payrollMonth = Number(run.month.slice(5, 7));
  const records = run.records.map((record) =>
    recalculatePayrollRecord(
      record,
      overrides[record.employeeId] ?? record.attendance,
      payrollMonth,
      run.month,
    ),
  );

  return {
    ...run,
    records,
    totalEmployees: records.length,
    totalGrossPay: records.reduce((total, record) => total + record.grossSalary, 0),
    totalDeductions: records.reduce((total, record) => total + record.totalDeductions, 0),
    totalNetPayable: records.reduce((total, record) => total + record.netSalary, 0),
  };
};
