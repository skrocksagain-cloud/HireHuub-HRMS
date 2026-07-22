import { GRACE_PERIOD_MINUTES, OFFICE_START_MINUTES, SATURDAY_START_MINUTES } from '../constants/attendance';
import type { AttendanceStatus, DeviceDetails } from '../types/attendance';

export const getLocalAttendanceDate = (date = new Date()): string => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
};

export const getMinutesSinceMidnight = (date: Date): number => date.getHours() * 60 + date.getMinutes();

export const getAttendanceStatusForLogin = (loginTime: Date): AttendanceStatus => {
  const day = loginTime.getDay();
  if (day === 0) return 'Week Off';
  const officeStart = day === 6 ? SATURDAY_START_MINUTES : OFFICE_START_MINUTES;
  return getMinutesSinceMidnight(loginTime) > officeStart + GRACE_PERIOD_MINUTES ? 'Late' : 'Present';
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const detectDevice = (): DeviceDetails => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
  const browser = /Edg\//.test(userAgent) ? 'Edge' : /Chrome\//.test(userAgent) ? 'Chrome' : /Firefox\//.test(userAgent) ? 'Firefox' : /Safari\//.test(userAgent) ? 'Safari' : 'Unknown';
  const operatingSystem = /Windows/i.test(userAgent) ? 'Windows' : /Mac OS/i.test(userAgent) ? 'macOS' : /Android/i.test(userAgent) ? 'Android' : /iPhone|iPad/i.test(userAgent) ? 'iOS' : 'Unknown';
  return { deviceType: isMobile ? 'Mobile' : 'Web', browser, operatingSystem, ipAddress: '', latitude: null, longitude: null, address: '' };
};

export const getCurrentLocation = async (): Promise<Pick<DeviceDetails, 'latitude' | 'longitude' | 'address'>> => new Promise((resolve) => {
  if (!navigator.geolocation) {
    resolve({ latitude: null, longitude: null, address: '' });
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, address: '' }),
    () => resolve({ latitude: null, longitude: null, address: '' }),
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
  );
});
