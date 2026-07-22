import { useCallback, useEffect, useMemo, useState } from 'react';

import { attendanceService } from '../services/attendanceService';
import { detectDevice, getCurrentLocation, getLocalAttendanceDate } from '../utils/attendance';
import type { AttendanceActor, AttendanceApprovalInput, AttendanceDashboardData, AttendanceFilters, AttendanceRequestType, DailyAttendance } from '../types/attendance';

const emptyDashboard: AttendanceDashboardData = { today: null, monthRecords: [], requests: [], organizationRecords: [] };
const defaultFilters: AttendanceFilters = { search: '', department: '', status: '', month: getLocalAttendanceDate().slice(0, 7), dateFrom: '', dateTo: '' };

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : 'Unable to update attendance.';

export const useAttendance = (actor: AttendanceActor | null) => {
  const [data, setData] = useState<AttendanceDashboardData>(emptyDashboard);
  const [filters, setFilters] = useState<AttendanceFilters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(Boolean(actor));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!actor) { setData(emptyDashboard); setIsLoading(false); return; }
    try { setIsLoading(true); setError(null); setData(await attendanceService.getDashboard(actor, filters.month)); } catch (caught) { setError(getErrorMessage(caught)); } finally { setIsLoading(false); }
  }, [actor, filters.month]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => { void refresh(); });
    return () => window.clearTimeout(refreshTimer);
  }, [refresh]);

  const run = useCallback(async (operation: () => Promise<void>, message: string): Promise<void> => {
    try { setIsSaving(true); setError(null); setSuccess(null); await operation(); setSuccess(message); await refresh(); } catch (caught) { setError(getErrorMessage(caught)); } finally { setIsSaving(false); }
  }, [refresh]);

  const login = (): void => { if (actor) void run(async () => attendanceService.login(actor, { ...detectDevice(), ...await getCurrentLocation() }), 'Attendance started successfully.'); };
  const logout = (): void => { if (actor) void run(() => attendanceService.logout(actor), 'Attendance completed successfully.'); };
  const submitRequest = (type: AttendanceRequestType, date: string, reason: string): void => { if (actor) void run(() => attendanceService.submitRequest(actor, type, date, reason), 'Attendance request submitted for approval.'); };
  const decideRequest = (input: AttendanceApprovalInput): void => { if (actor) void run(() => attendanceService.decideRequest(actor, input), `Request ${input.decision.toLowerCase()}.`); };

  const records = useMemo(() => {
    const source = data.organizationRecords.length > 0 ? data.organizationRecords : data.monthRecords;
    const keyword = filters.search.trim().toLowerCase();
    return source.filter((record: DailyAttendance) => (!keyword || [record.employeeId, record.employeeName, record.department, record.attendanceDate].some((value) => value.toLowerCase().includes(keyword))) && (!filters.department || record.department === filters.department) && (!filters.status || record.status === filters.status) && (!filters.dateFrom || record.attendanceDate >= filters.dateFrom) && (!filters.dateTo || record.attendanceDate <= filters.dateTo));
  }, [data.monthRecords, data.organizationRecords, filters]);

  return { data, filters, setFilters, records, isLoading, isSaving, error, success, refresh, login, logout, submitRequest, decideRequest };
};
