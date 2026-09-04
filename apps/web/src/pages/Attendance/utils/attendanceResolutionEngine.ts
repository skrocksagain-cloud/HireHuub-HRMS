import type { HolidayItem } from '../../../types/Calendar';
import type { LeaveRequest } from '../../Leave/types/leave';
import type { AttendanceRequest, DailyAttendance } from '../types/attendance';

export type ResolvedStatus =
  | 'Present'
  | 'Late'
  | 'Half Day'
  | 'WFH'
  | 'Leave'
  | 'Holiday'
  | 'Week Off'
  | 'Regularized'
  | 'Absent'
  | 'Upcoming';

export interface ResolvedDayDetails {
  holidayName?: string;
  leaveType?: string;
  leaveReason?: string;
  wfhReason?: string;
  regularizationReason?: string;
  approver?: string;
  loginTimeStr?: string;
  logoutTimeStr?: string;
  totalWorkMinutes?: number;
  deviceType?: string;
  location?: string;
  isToday?: boolean;
  hasPendingRequest?: boolean;
  pendingRequestType?: 'WFH' | 'Regularization';
}

export interface ResolvedAttendanceDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ...
  status: ResolvedStatus;
  badgeLabel: string;
  subText: string;
  isWorkingDay: boolean;
  isPastOrToday: boolean;
  details: ResolvedDayDetails;
  rawDailyRecord?: DailyAttendance;
  rawLeaveRequest?: LeaveRequest;
  rawHoliday?: HolidayItem;
  rawAttendanceRequest?: AttendanceRequest;
}

export interface AttendanceMonthSummary {
  totalMonthDays: number;
  totalWorkingDays: number;
  presentDays: number;
  wfhDays: number;
  leaveDays: number;
  holidays: number;
  weekOffs: number;
  lateDays: number;
  regularizedDays: number;
  absentDays: number;
  upcomingDays: number;
}

export interface ResolveInput {
  month: string; // YYYY-MM
  todayDateStr: string; // YYYY-MM-DD
  holidays: HolidayItem[];
  approvedLeaves: LeaveRequest[];
  attendanceRequests: AttendanceRequest[];
  dailyRecords: DailyAttendance[];
}

const formatTimestampTime = (ts: { toMillis: () => number } | null | undefined): string => {
  if (!ts) return '—';
  const d = new Date(ts.toMillis());
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Deterministic single-day resolution algorithm.
 */
export const resolveSingleDay = (
  dateStr: string,
  todayDateStr: string,
  holidays: HolidayItem[],
  approvedLeaves: LeaveRequest[],
  attendanceRequests: AttendanceRequest[],
  dailyRecords: DailyAttendance[]
): ResolvedAttendanceDay => {
  const [year, monthNum, dayNum] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, monthNum - 1, dayNum);
  const dayOfWeek = dateObj.getDay();
  const isSunday = dayOfWeek === 0;
  const isPastOrToday = dateStr <= todayDateStr;
  const isToday = dateStr === todayDateStr;

  // Find matching records
  const holiday = holidays.find((h) => h.date === dateStr);
  const approvedLeave = approvedLeaves.find(
    (l) => l.status === 'Approved' && l.startDate <= dateStr && l.endDate >= dateStr
  );

  const approvedWfh = attendanceRequests.find(
    (r) => r.attendanceDate === dateStr && r.requestType === 'WFH' && r.status === 'Approved'
  );

  const pendingWfh = attendanceRequests.find(
    (r) => r.attendanceDate === dateStr && r.requestType === 'WFH' && r.status === 'Pending'
  );

  const approvedReg = attendanceRequests.find(
    (r) => r.attendanceDate === dateStr && r.requestType === 'Regularization' && r.status === 'Approved'
  );

  const pendingReg = attendanceRequests.find(
    (r) => r.attendanceDate === dateStr && r.requestType === 'Regularization' && r.status === 'Pending'
  );

  const daily = dailyRecords.find((r) => r.attendanceDate === dateStr);

  const hasActualAttendance = Boolean(
    daily && (daily.loginTime || daily.status === 'Present' || daily.status === 'Late' || daily.status === 'Half Day')
  );

  // CONFLICT & PRECEDENCE RESOLUTION ENGINE

  // 1. Actual worked attendance (or worked WFH) overrides non-working days if present
  if (hasActualAttendance && daily) {
    const isLate = daily.status === 'Late';
    const isHalfDay = daily.status === 'Half Day';
    const status: ResolvedStatus = isHalfDay ? 'Half Day' : isLate ? 'Late' : 'Present';
    return {
      date: dateStr,
      dayNumber: dayNum,
      dayOfWeek,
      status,
      badgeLabel: status.toUpperCase(),
      subText: daily.loginTime
        ? `${formatTimestampTime(daily.loginTime)}${daily.logoutTime ? ` - ${formatTimestampTime(daily.logoutTime)}` : ''}`
        : 'Recorded',
      isWorkingDay: !isSunday && !holiday,
      isPastOrToday,
      details: {
        isToday,
        loginTimeStr: formatTimestampTime(daily.loginTime),
        logoutTimeStr: formatTimestampTime(daily.logoutTime),
        totalWorkMinutes: daily.totalWorkMinutes,
        deviceType: daily.deviceType,
        location: daily.address,
        hasPendingRequest: Boolean(pendingReg || pendingWfh),
        pendingRequestType: pendingReg ? 'Regularization' : pendingWfh ? 'WFH' : undefined,
      },
      rawDailyRecord: daily,
    };
  }

  // 2. Approved WFH
  if (approvedWfh || (daily && daily.status === 'WFH')) {
    return {
      date: dateStr,
      dayNumber: dayNum,
      dayOfWeek,
      status: 'WFH',
      badgeLabel: 'WFH',
      subText: 'Work From Home',
      isWorkingDay: !isSunday && !holiday,
      isPastOrToday,
      details: {
        isToday,
        wfhReason: approvedWfh?.reason || 'Approved WFH',
        approver: approvedWfh?.approverEmployeeId || undefined,
        loginTimeStr: daily ? formatTimestampTime(daily.loginTime) : undefined,
        logoutTimeStr: daily ? formatTimestampTime(daily.logoutTime) : undefined,
        totalWorkMinutes: daily?.totalWorkMinutes,
      },
      rawAttendanceRequest: approvedWfh,
      rawDailyRecord: daily,
    };
  }

  // 3. Approved Regularization
  if (approvedReg) {
    return {
      date: dateStr,
      dayNumber: dayNum,
      dayOfWeek,
      status: 'Regularized',
      badgeLabel: 'REGULARIZED',
      subText: 'Regularized',
      isWorkingDay: !isSunday && !holiday,
      isPastOrToday,
      details: {
        isToday,
        regularizationReason: approvedReg.reason,
        approver: approvedReg.approverEmployeeId || undefined,
      },
      rawAttendanceRequest: approvedReg,
    };
  }

  // 4. Company Holiday
  if (holiday) {
    return {
      date: dateStr,
      dayNumber: dayNum,
      dayOfWeek,
      status: 'Holiday',
      badgeLabel: 'HOLIDAY',
      subText: holiday.name,
      isWorkingDay: false,
      isPastOrToday,
      details: {
        isToday,
        holidayName: holiday.name,
      },
      rawHoliday: holiday,
    };
  }

  // 5. Week Off (Sunday)
  if (isSunday) {
    return {
      date: dateStr,
      dayNumber: dayNum,
      dayOfWeek,
      status: 'Week Off',
      badgeLabel: 'WEEK OFF',
      subText: 'Sunday',
      isWorkingDay: false,
      isPastOrToday,
      details: {
        isToday,
      },
    };
  }

  // 6. Approved Leave
  if (approvedLeave) {
    return {
      date: dateStr,
      dayNumber: dayNum,
      dayOfWeek,
      status: 'Leave',
      badgeLabel: approvedLeave.leaveType.toUpperCase(),
      subText: approvedLeave.leaveType,
      isWorkingDay: false,
      isPastOrToday,
      details: {
        isToday,
        leaveType: approvedLeave.leaveType,
        leaveReason: approvedLeave.reason,
        approver: approvedLeave.approverEmployeeId || undefined,
      },
      rawLeaveRequest: approvedLeave,
    };
  }

  // 7. Past Working Day with No Record -> ABSENT
  if (isPastOrToday) {
    return {
      date: dateStr,
      dayNumber: dayNum,
      dayOfWeek,
      status: 'Absent',
      badgeLabel: 'NO ATTENDANCE',
      subText: 'Absent',
      isWorkingDay: true,
      isPastOrToday,
      details: {
        isToday,
        hasPendingRequest: Boolean(pendingReg || pendingWfh),
        pendingRequestType: pendingReg ? 'Regularization' : pendingWfh ? 'WFH' : undefined,
      },
    };
  }

  // 8. Future Working Day -> UPCOMING / NOT YET MARKED
  return {
    date: dateStr,
    dayNumber: dayNum,
    dayOfWeek,
    status: 'Upcoming',
    badgeLabel: 'UPCOMING',
    subText: 'Scheduled',
    isWorkingDay: true,
    isPastOrToday,
    details: {
      isToday,
    },
  };
};

/**
 * Resolve an entire month of attendance days for an employee.
 */
export const resolveMonthlyAttendance = (input: ResolveInput): ResolvedAttendanceDay[] => {
  const [year, monthNum] = input.month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const resolvedDays: ResolvedAttendanceDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${input.month}-${String(day).padStart(2, '0')}`;
    resolvedDays.push(
      resolveSingleDay(
        dateStr,
        input.todayDateStr,
        input.holidays,
        input.approvedLeaves,
        input.attendanceRequests,
        input.dailyRecords
      )
    );
  }

  return resolvedDays;
};

/**
 * Compute monthly summary metrics from resolved days.
 */
export const computeAttendanceSummary = (resolvedDays: ResolvedAttendanceDay[]): AttendanceMonthSummary => {
  const totalMonthDays = resolvedDays.length;
  const totalWorkingDays = resolvedDays.filter((d) => d.isWorkingDay).length;
  const presentDays = resolvedDays.filter((d) => d.status === 'Present' || d.status === 'Late' || d.status === 'Half Day').length;
  const wfhDays = resolvedDays.filter((d) => d.status === 'WFH').length;
  const leaveDays = resolvedDays.filter((d) => d.status === 'Leave').length;
  const holidays = resolvedDays.filter((d) => d.status === 'Holiday').length;
  const weekOffs = resolvedDays.filter((d) => d.status === 'Week Off').length;
  const lateDays = resolvedDays.filter((d) => d.status === 'Late').length;
  const regularizedDays = resolvedDays.filter((d) => d.status === 'Regularized').length;
  const absentDays = resolvedDays.filter((d) => d.status === 'Absent').length;
  const upcomingDays = resolvedDays.filter((d) => d.status === 'Upcoming').length;

  return {
    totalMonthDays,
    totalWorkingDays,
    presentDays,
    wfhDays,
    leaveDays,
    holidays,
    weekOffs,
    lateDays,
    regularizedDays,
    absentDays,
    upcomingDays,
  };
};
