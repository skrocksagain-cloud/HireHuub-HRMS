import { useCallback, useEffect, useMemo, useState } from 'react';

import { attendanceService } from '../services/attendanceService';
import { calendarService } from '../../../services/calendar/calendarService';
import { leaveRepository } from '../../Leave/repositories/leaveRepository';
import { employeeRepository } from '../../Employee/repositories/employeeRepository';
import { detectDevice, getCurrentLocation, getLocalAttendanceDate } from '../utils/attendance';
import {
  computeAttendanceSummary,
  resolveMonthlyAttendance,
  type AttendanceMonthSummary,
  type ResolvedAttendanceDay,
} from '../utils/attendanceResolutionEngine';
import type {
  AttendanceActor,
  AttendanceApprovalInput,
  AttendanceDashboardData,
  AttendanceFilters,
  AttendanceRequestType,
  DailyAttendance,
} from '../types/attendance';
import type { HolidayItem } from '../../../types/Calendar';
import type { LeaveRequest } from '../../Leave/types/leave';
import type { Employee } from '../../Employee/types/Employee';

const emptyDashboard: AttendanceDashboardData = {
  today: null,
  monthRecords: [],
  requests: [],
  organizationRecords: [],
};

const defaultFilters: AttendanceFilters = {
  search: '',
  department: '',
  status: '',
  month: getLocalAttendanceDate().slice(0, 7),
  dateFrom: '',
  dateTo: '',
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to update attendance.';

export const useAttendance = (actor: AttendanceActor | null) => {
  const [data, setData] = useState<AttendanceDashboardData>(emptyDashboard);
  const [filters, setFilters] = useState<AttendanceFilters>(defaultFilters);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(actor?.employeeId || '');
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [holidaysList, setHolidaysList] = useState<HolidayItem[]>([]);
  const [approvedLeaves, setApprovedLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(actor));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (actor?.employeeId && !selectedEmployeeId) {
      setSelectedEmployeeId(actor.employeeId);
    }
  }, [actor, selectedEmployeeId]);

  // Load employee selector list and company holidays once
  useEffect(() => {
    void (async () => {
      try {
        const [emps, hols] = await Promise.all([
          employeeRepository.getEmployees().catch(() => []),
          calendarService.getHolidays().catch(() => []),
        ]);
        const activeEmps = emps.filter(
          (e) => (e.employmentStatus === 'Active' || e.status === 'Active') && e.employmentStatus !== 'Terminated'
        );
        setEmployeesList(activeEmps);
        setHolidaysList(hols);
      } catch {
        // Safe fallback
      }
    })();
  }, []);

  const currentTargetEmployeeId = selectedEmployeeId || actor?.employeeId || '';

  const refresh = useCallback(async (): Promise<void> => {
    if (!actor || !currentTargetEmployeeId) {
      setData(emptyDashboard);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const targetActor: AttendanceActor = {
        ...actor,
        employeeId: currentTargetEmployeeId,
      };

      const [dashData, leaves] = await Promise.all([
        attendanceService.getDashboard(targetActor, filters.month),
        leaveRepository.getRequestsForEmployee(currentTargetEmployeeId).catch(() => []),
      ]);

      setData(dashData);
      setApprovedLeaves(leaves.filter((l) => l.status === 'Approved'));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [actor, currentTargetEmployeeId, filters.month]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void refresh();
    });
    return () => window.clearTimeout(refreshTimer);
  }, [refresh]);

  const run = useCallback(
    async (operation: () => Promise<void>, message: string): Promise<void> => {
      try {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        await operation();
        setSuccess(message);
        await refresh();
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const login = (): void => {
    if (actor)
      void run(
        async () => attendanceService.login(actor, { ...detectDevice(), ...(await getCurrentLocation()) }),
        'Attendance started successfully.'
      );
  };
  const logout = (): void => {
    if (actor) void run(() => attendanceService.logout(actor), 'Attendance completed successfully.');
  };
  const submitRequest = (type: AttendanceRequestType, date: string, reason: string): void => {
    if (actor)
      void run(
        () => attendanceService.submitRequest(actor, type, date, reason),
        'Attendance request submitted for approval.'
      );
  };
  const decideRequest = (input: AttendanceApprovalInput): void => {
    if (actor)
      void run(
        () => attendanceService.decideRequest(actor, input),
        `Request ${input.decision.toLowerCase()}.`
      );
  };

  // Compute resolved days deterministically for selected month
  const resolvedDays = useMemo<ResolvedAttendanceDay[]>(() => {
    const todayDateStr = getLocalAttendanceDate();
    return resolveMonthlyAttendance({
      month: filters.month,
      todayDateStr,
      holidays: holidaysList,
      approvedLeaves,
      attendanceRequests: data.requests,
      dailyRecords: data.monthRecords,
    });
  }, [filters.month, holidaysList, approvedLeaves, data.requests, data.monthRecords]);

  // Compute monthly summary counts
  const summaryMetrics = useMemo<AttendanceMonthSummary>(() => {
    return computeAttendanceSummary(resolvedDays);
  }, [resolvedDays]);

  // Unified history table records matching resolved days
  const records = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return resolvedDays
      .filter((day) => {
        if (!filters.status) return true;
        return day.status === filters.status;
      })
      .map(
        (day): DailyAttendance => ({
          id: day.rawDailyRecord?.id || `res-${day.date}`,
          documentType: 'daily',
          employeeId: currentTargetEmployeeId,
          employeeName: actor?.name || 'Employee',
          department: actor?.department || 'General',
          attendanceDate: day.date,
          status: day.status as any,
          loginTime: day.rawDailyRecord?.loginTime || null,
          logoutTime: day.rawDailyRecord?.logoutTime || null,
          totalWorkMinutes: day.details.totalWorkMinutes || 0,
          isLocked: day.rawDailyRecord?.isLocked || false,
          createdAt: day.rawDailyRecord?.createdAt || ({} as any),
          updatedAt: day.rawDailyRecord?.updatedAt || ({} as any),
        })
      )
      .filter((record) => {
        if (!keyword) return true;
        return (
          record.employeeId.toLowerCase().includes(keyword) ||
          record.employeeName.toLowerCase().includes(keyword) ||
          record.attendanceDate.includes(keyword) ||
          record.status.toLowerCase().includes(keyword)
        );
      });
  }, [resolvedDays, filters.search, filters.status, currentTargetEmployeeId, actor]);

  return {
    data,
    filters,
    setFilters,
    selectedEmployeeId,
    setSelectedEmployeeId,
    employeesList,
    resolvedDays,
    summaryMetrics,
    records,
    isLoading,
    isSaving,
    error,
    success,
    refresh,
    login,
    logout,
    submitRequest,
    decideRequest,
  };
};
