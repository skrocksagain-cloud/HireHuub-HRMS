import type { AttendanceStatus } from '../types/attendance';

export const ATTENDANCE_COLLECTION = 'attendance';
export const HOLIDAYS_COLLECTION = 'holidays';
export const LEAVE_REQUESTS_COLLECTION = 'leaveRequests';
export const OFFICE_START_MINUTES = 10 * 60;
export const SATURDAY_START_MINUTES = 10 * 60 + 30;
export const GRACE_PERIOD_MINUTES = 15;
export const MINIMUM_HALF_DAY_WORK_MINUTES = 4 * 60 + 30;
export const REGULARIZATION_WINDOW_DAYS = 7;

export const ATTENDANCE_STATUS_STYLES: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-100 text-emerald-800',
  Late: 'bg-amber-100 text-amber-800',
  'Half Day': 'bg-orange-100 text-orange-800',
  Leave: 'bg-sky-100 text-sky-800',
  Holiday: 'bg-violet-100 text-violet-800',
  'Week Off': 'bg-slate-100 text-slate-700',
  Absent: 'bg-rose-100 text-rose-800',
  WFH: 'bg-cyan-100 text-cyan-800',
  'Regularization Pending': 'bg-yellow-100 text-yellow-800',
};
