import type { AttendanceRole, AttendanceStatus } from '../types/attendance';

export const ATTENDANCE_COLLECTIONS = {
  sessions: 'attendance_sessions',
  daily: 'attendance_daily',
  regularisation: 'attendance_regularization',
  leaveRequests: 'leave_requests',
  approvals: 'attendance_approvals',
  holidays: 'holidays',
  devices: 'devices',
  loginHistory: 'login_history',
  auditLogs: 'audit_logs',
} as const;

export const OFFICE_START_MINUTES = 10 * 60;
export const SATURDAY_START_MINUTES = 10 * 60 + 30;
export const GRACE_PERIOD_MINUTES = 15;
export const MINIMUM_HALF_DAY_WORK_MINUTES = 4 * 60 + 30;
export const MAXIMUM_HALF_DAY_BREAK_MINUTES = 30;
export const REGULARISATION_WINDOW_DAYS = 7;
export const MAX_MANAGER_LATE_APPROVALS = 5;
export const MAX_MANAGER_HALF_DAY_APPROVALS = 3;
export const OFFICE_REFERENCE_ADDRESS = 'Shree Tower-II, Ground Floor, Block-C, RAA/36, Raghunathpur, Kolkata 700059';
export const OFFICE_REFERENCE_LOCATION = { latitude: 22.6105, longitude: 88.4116 };

export const APPROVER_ROLES: Record<'Late' | 'Half Day' | 'Work From Home' | 'Regularisation' | 'Leave' | 'Holiday', 'Manager' | 'Super Admin'> = {
  Late: 'Manager',
  'Half Day': 'Manager',
  'Work From Home': 'Manager',
  Regularisation: 'Manager',
  Leave: 'Manager',
  Holiday: 'Super Admin',
};

export const ATTENDANCE_STATUS_STYLES: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-100 text-emerald-800',
  Late: 'bg-amber-100 text-amber-800',
  'Half Day': 'bg-orange-100 text-orange-800',
  Leave: 'bg-sky-100 text-sky-800',
  Holiday: 'bg-violet-100 text-violet-800',
  'Week Off': 'bg-slate-100 text-slate-700',
  Absent: 'bg-rose-100 text-rose-800',
};

export const MANAGEMENT_ROLES: AttendanceRole[] = ['Manager', 'Super Admin'];
