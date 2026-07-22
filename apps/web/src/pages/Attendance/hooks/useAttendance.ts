import { useCallback, useEffect, useState } from 'react';

import { attendanceService } from '../services/attendanceService';
import { detectDevice, getCurrentLocation } from '../utils/attendance';
import type { AttendanceDashboardData, AttendanceEmployee, AttendanceRequestType } from '../types/attendance';

const emptyDashboard: AttendanceDashboardData = { today: null, openSession: null, monthlyDays: [], pendingRequests: [] };

export const useAttendance = (employee: AttendanceEmployee | null) => {
  const [data, setData] = useState<AttendanceDashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(Boolean(employee));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    if (!employee) { setData(emptyDashboard); setIsLoading(false); return; }
    setIsLoading(true); setError('');
    try { setData(await attendanceService.getDashboard(employee.employeeId)); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load attendance.'); } finally { setIsLoading(false); }
  }, [employee]);

  useEffect(() => { void refresh(); }, [refresh]);
  const run = async (operation: () => Promise<void>, message: string) => { setIsSaving(true); setError(''); setSuccess(''); try { await operation(); setSuccess(message); await refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update attendance.'); } finally { setIsSaving(false); } };
  const start = () => { if (employee) void run(async () => attendanceService.startSession(employee, { ...detectDevice(), ...await getCurrentLocation() }), 'Attendance session started.'); };
  const end = () => { if (employee) void run(() => attendanceService.endSession(employee.employeeId), 'Attendance session ended.'); };
  const request = (type: AttendanceRequestType, date: string, reason: string) => { if (employee) void run(() => attendanceService.request(employee, type, date, reason), 'Request submitted for approval.'); };
  return { data, isLoading, isSaving, error, success, start, end, request };
};
