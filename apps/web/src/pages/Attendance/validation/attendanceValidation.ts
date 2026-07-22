import { REGULARIZATION_WINDOW_DAYS } from '../constants/attendance';
import { getLocalAttendanceDate } from '../utils/attendance';
import type { AttendanceApprovalInput, AttendanceRequestType } from '../types/attendance';

export const validateAttendanceRequest = (type: AttendanceRequestType, attendanceDate: string, reason: string): void => {
  if (!attendanceDate) throw new Error('Select an attendance date.');
  if (!reason.trim()) throw new Error('A reason is required.');
  if (attendanceDate > getLocalAttendanceDate()) throw new Error('Attendance requests cannot be submitted for a future date.');
  if (type === 'Regularization') {
    const requestedAt = new Date(`${attendanceDate}T00:00:00`).getTime();
    const currentDate = new Date(`${getLocalAttendanceDate()}T00:00:00`).getTime();
    if (Math.floor((currentDate - requestedAt) / 86_400_000) > REGULARIZATION_WINDOW_DAYS) throw new Error('Regularization requests older than 7 days require Super Admin action.');
  }
};

export const validateAttendanceDecision = (input: AttendanceApprovalInput): void => {
  if (!input.reason.trim()) throw new Error('A decision reason is required.');
};
