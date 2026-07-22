import { GRACE_PERIOD_MINUTES, OFFICE_START_MINUTES, SATURDAY_START_MINUTES } from '../constants/attendance';
import type { AttendanceSummary, AttendanceStatus, DailyAttendance, DeviceDetails } from '../types/attendance';

export const getLocalAttendanceDate = (date: Date = new Date()): string => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
};

export const getMonthBounds = (month: string = getLocalAttendanceDate().slice(0, 7)): { start: string; end: string } => {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` };
};

export const getAttendanceStatusForLogin = (loginTime: Date): AttendanceStatus => {
  if (loginTime.getDay() === 0) return 'Week Off';
  const startTime = loginTime.getDay() === 6 ? SATURDAY_START_MINUTES : OFFICE_START_MINUTES;
  return loginTime.getHours() * 60 + loginTime.getMinutes() > startTime + GRACE_PERIOD_MINUTES ? 'Late' : 'Present';
};

export const getNonWorkingStatus = (date: Date, isHoliday: boolean, hasLeave: boolean): AttendanceStatus | null => {
  if (isHoliday) return 'Holiday';
  if (date.getDay() === 0) return 'Week Off';
  return hasLeave ? 'Leave' : null;
};

export const formatDuration = (minutes: number): string => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export const getAttendanceSummary = (records: DailyAttendance[]): AttendanceSummary => ({
  workingDays: records.filter(({ status }) => !['Holiday', 'Week Off'].includes(status)).length,
  lopDays: records.filter(({ status }) => status === 'Absent').length,
  lateCount: records.filter(({ status }) => status === 'Late').length,
  halfDayCount: records.filter(({ status }) => status === 'Half Day').length,
  presentCount: records.filter(({ status }) => ['Present', 'Late'].includes(status)).length,
  wfhCount: records.filter(({ status }) => status === 'WFH').length,
});

export const detectDevice = (): DeviceDetails => {
  const userAgent = navigator.userAgent;
  return { deviceType: /Android|iPhone|iPad|iPod/i.test(userAgent) ? 'Mobile' : 'Web', browser: /Edg\//.test(userAgent) ? 'Edge' : /Chrome\//.test(userAgent) ? 'Chrome' : /Firefox\//.test(userAgent) ? 'Firefox' : /Safari\//.test(userAgent) ? 'Safari' : 'Unknown', operatingSystem: /Windows/i.test(userAgent) ? 'Windows' : /Mac OS/i.test(userAgent) ? 'macOS' : /Android/i.test(userAgent) ? 'Android' : /iPhone|iPad/i.test(userAgent) ? 'iOS' : 'Unknown', ipAddress: '', latitude: null, longitude: null, address: '' };
};

export const getCurrentLocation = async (): Promise<Pick<DeviceDetails, 'latitude' | 'longitude' | 'address'>> => new Promise((resolve) => {
  if (!navigator.geolocation) return resolve({ latitude: null, longitude: null, address: '' });
  navigator.geolocation.getCurrentPosition(({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, address: '' }), () => resolve({ latitude: null, longitude: null, address: '' }), { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 });
});
