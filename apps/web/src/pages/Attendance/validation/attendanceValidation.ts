import { REGULARISATION_WINDOW_DAYS } from '../constants/attendance';
import { getLocalAttendanceDate } from '../utils/attendance';
import type { AttendanceRequestType } from '../types/attendance';

export const validateAttendanceRequest = (type: AttendanceRequestType, attendanceDate: string, reason: string): void => {
  if (!attendanceDate) throw new Error('Select the attendance date.');
  if (!reason.trim()) throw new Error('A reason is required.');
  if (type !== 'Regularisation') return;
  const age = Math.floor((new Date(`${getLocalAttendanceDate()}T00:00:00`).getTime() - new Date(`${attendanceDate}T00:00:00`).getTime()) / 86_400_000);
  if (age > REGULARISATION_WINDOW_DAYS) throw new Error('Regularisation requests older than 7 days require Super Admin action.');
};
