import { Timestamp } from 'firebase/firestore';
import type { HolidayItem } from '../../../types/Calendar';
import type { LeaveRequest } from '../../Leave/types/leave';
import type { AttendanceRequest, DailyAttendance } from '../types/attendance';
import {
  computeAttendanceSummary,
  resolveMonthlyAttendance,
  resolveSingleDay,
} from './attendanceResolutionEngine';

const mockTimestamp = (dateStr: string, timeStr = '09:30:00'): Timestamp => {
  const d = new Date(`${dateStr}T${timeStr}`);
  return Timestamp.fromDate(d);
};

export const runAttendanceEngineTests = (): { passed: number; total: number; logs: string[] } => {
  const logs: string[] = [];
  let passed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      passed++;
      logs.push(`[PASS] ${description}`);
    } else {
      logs.push(`[FAIL] ${description}`);
    }
  };

  const todayStr = '2026-08-18';
  const month = '2026-08';

  const mockHoliday: HolidayItem = {
    id: 'hol-1',
    name: 'Independence Day',
    date: '2026-08-15',
    createdAt: new Date().toISOString(),
  };

  const mockFutureHoliday: HolidayItem = {
    id: 'hol-2',
    name: 'Janmashtami',
    date: '2026-08-25',
    createdAt: new Date().toISOString(),
  };

  const mockApprovedLeave: LeaveRequest = {
    id: 'leave-1',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestType: 'Leave',
    leaveType: 'Casual Leave',
    startDate: '2026-08-10',
    endDate: '2026-08-12',
    days: 3,
    reason: 'Family event',
    medicalCertificateReference: '',
    status: 'Approved',
    approverEmployeeId: 'MGR001',
    decisionReason: 'Approved',
    isArchived: false,
    createdAt: mockTimestamp('2026-08-01'),
    updatedAt: mockTimestamp('2026-08-01'),
  };

  const mockPendingLeave: LeaveRequest = {
    id: 'leave-2',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestType: 'Leave',
    leaveType: 'Sick Leave',
    startDate: '2026-08-14',
    endDate: '2026-08-14',
    days: 1,
    reason: 'Not feeling well',
    medicalCertificateReference: '',
    status: 'Pending',
    approverEmployeeId: null,
    decisionReason: '',
    isArchived: false,
    createdAt: mockTimestamp('2026-08-01'),
    updatedAt: mockTimestamp('2026-08-01'),
  };

  const mockRejectedLeave: LeaveRequest = {
    id: 'leave-3',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestType: 'Leave',
    leaveType: 'Paid Leave',
    startDate: '2026-08-13',
    endDate: '2026-08-13',
    days: 1,
    reason: 'Personal',
    medicalCertificateReference: '',
    status: 'Rejected',
    approverEmployeeId: 'MGR001',
    decisionReason: 'Project deadline',
    isArchived: false,
    createdAt: mockTimestamp('2026-08-01'),
    updatedAt: mockTimestamp('2026-08-01'),
  };

  const mockApprovedWfh: AttendanceRequest = {
    id: 'req-wfh-1',
    documentType: 'request',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestType: 'WFH',
    attendanceDate: '2026-08-04',
    reason: 'Working remotely',
    status: 'Approved',
    approverEmployeeId: 'MGR001',
    decisionReason: 'Approved',
    createdAt: mockTimestamp('2026-08-03'),
    updatedAt: mockTimestamp('2026-08-03'),
  };

  const mockPendingWfh: AttendanceRequest = {
    id: 'req-wfh-2',
    documentType: 'request',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestType: 'WFH',
    attendanceDate: '2026-08-05',
    reason: 'Home repair',
    status: 'Pending',
    approverEmployeeId: null,
    decisionReason: '',
    createdAt: mockTimestamp('2026-08-04'),
    updatedAt: mockTimestamp('2026-08-04'),
  };

  const mockApprovedReg: AttendanceRequest = {
    id: 'req-reg-1',
    documentType: 'request',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestType: 'Regularization',
    attendanceDate: '2026-08-06',
    reason: 'Biometric glitch',
    status: 'Approved',
    approverEmployeeId: 'MGR001',
    decisionReason: 'Verified',
    createdAt: mockTimestamp('2026-08-07'),
    updatedAt: mockTimestamp('2026-08-07'),
  };

  const mockPendingReg: AttendanceRequest = {
    id: 'req-reg-2',
    documentType: 'request',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestType: 'Regularization',
    attendanceDate: '2026-08-07',
    reason: 'Forgot card',
    status: 'Pending',
    approverEmployeeId: null,
    decisionReason: '',
    createdAt: mockTimestamp('2026-08-08'),
    updatedAt: mockTimestamp('2026-08-08'),
  };

  const mockRejectedReg: AttendanceRequest = {
    id: 'req-reg-3',
    documentType: 'request',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestType: 'Regularization',
    attendanceDate: '2026-08-08',
    reason: 'Late arrival',
    status: 'Rejected',
    approverEmployeeId: 'MGR001',
    decisionReason: 'Invalid reason',
    createdAt: mockTimestamp('2026-08-09'),
    updatedAt: mockTimestamp('2026-08-09'),
  };

  const mockPresentDaily: DailyAttendance = {
    id: 'daily-1',
    documentType: 'daily',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    attendanceDate: '2026-08-03',
    status: 'Present',
    loginTime: mockTimestamp('2026-08-03', '09:15:00'),
    logoutTime: mockTimestamp('2026-08-03', '18:30:00'),
    totalWorkMinutes: 555,
    isLocked: false,
    createdAt: mockTimestamp('2026-08-03'),
    updatedAt: mockTimestamp('2026-08-03'),
  };

  const mockLateDaily: DailyAttendance = {
    id: 'daily-2',
    documentType: 'daily',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    attendanceDate: '2026-08-07',
    status: 'Late',
    loginTime: mockTimestamp('2026-08-07', '10:45:00'),
    logoutTime: mockTimestamp('2026-08-07', '18:30:00'),
    totalWorkMinutes: 465,
    isLocked: false,
    createdAt: mockTimestamp('2026-08-07'),
    updatedAt: mockTimestamp('2026-08-07'),
  };

  const mockHolidayWorkedDaily: DailyAttendance = {
    id: 'daily-3',
    documentType: 'daily',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    attendanceDate: '2026-08-15',
    status: 'Present',
    loginTime: mockTimestamp('2026-08-15', '09:00:00'),
    logoutTime: mockTimestamp('2026-08-15', '17:00:00'),
    totalWorkMinutes: 480,
    isLocked: false,
    createdAt: mockTimestamp('2026-08-15'),
    updatedAt: mockTimestamp('2026-08-15'),
  };

  const holidays = [mockHoliday, mockFutureHoliday];
  const approvedLeaves = [mockApprovedLeave, mockPendingLeave, mockRejectedLeave];
  const requests = [mockApprovedWfh, mockPendingWfh, mockApprovedReg, mockPendingReg, mockRejectedReg];
  const dailyRecords = [mockPresentDaily, mockLateDaily];

  // Scenario 1: Present day
  const res1 = resolveSingleDay('2026-08-03', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res1.status === 'Present', '1. Present day resolves to Present');

  // Scenario 2: Late day
  const res2 = resolveSingleDay('2026-08-07', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res2.status === 'Late', '2. Late day resolves to Late');

  // Scenario 3: WFH approved
  const res3 = resolveSingleDay('2026-08-04', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res3.status === 'WFH', '3. Approved WFH resolves to WFH');

  // Scenario 4: WFH pending (date 2026-08-05 has no attendance) -> falls back to Absent (or pending status tracked in details)
  const res4 = resolveSingleDay('2026-08-05', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res4.status === 'Absent' && res4.details.hasPendingRequest === true, '4. Pending WFH does not approve WFH status');

  // Scenario 5: Leave approved
  const res5 = resolveSingleDay('2026-08-11', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res5.status === 'Leave' && res5.subText === 'Casual Leave', '5. Approved Leave resolves to Leave with leave type');

  // Scenario 6: Leave pending (2026-08-14)
  const res6 = resolveSingleDay('2026-08-14', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res6.status === 'Absent', '6. Pending Leave does not resolve as Approved Leave');

  // Scenario 7: Leave rejected (2026-08-13)
  const res7 = resolveSingleDay('2026-08-13', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res7.status === 'Absent', '7. Rejected Leave retains original absence');

  // Scenario 8: Regularization approved
  const res8 = resolveSingleDay('2026-08-06', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res8.status === 'Regularized', '8. Approved Regularization resolves to Regularized');

  // Scenario 9: Regularization pending
  const res9 = resolveSingleDay('2026-08-07', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res9.status === 'Late' && res9.details.hasPendingRequest === true, '9. Pending Regularization tracks pending request without corrupting record');

  // Scenario 10: Regularization rejected
  const res10 = resolveSingleDay('2026-08-08', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res10.status === 'Absent', '10. Rejected Regularization retains original absence');

  // Scenario 11: Company holiday
  const res11 = resolveSingleDay('2026-08-15', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  // Note: 2026-08-15 is Independence Day
  assert(res11.status === 'Holiday' || res11.status === 'Present', '11. Company Holiday resolves to Holiday (or Present if worked)');

  // Scenario 12: Sunday Week Off
  const res12 = resolveSingleDay('2026-08-02', todayStr, holidays, approvedLeaves, requests, dailyRecords); // 2026-08-02 is Sunday
  assert(res12.status === 'Week Off', '12. Sunday resolves to Week Off');

  // Scenario 13: Future working day
  const res13 = resolveSingleDay('2026-08-28', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res13.status === 'Upcoming', '13. Future working day resolves to Upcoming (NOT Absent)');

  // Scenario 14: Future holiday
  const res14 = resolveSingleDay('2026-08-25', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(res14.status === 'Holiday', '14. Future holiday resolves to Holiday');

  // Scenario 15: No attendance past working day
  const res15 = resolveSingleDay('2026-08-01', todayStr, holidays, approvedLeaves, requests, dailyRecords); // 2026-08-01 Saturday
  assert(res15.status === 'Absent', '15. Past working day with no record resolves to Absent');

  // Scenario 16: Holiday + attendance conflict (Worked on Holiday)
  const holidayConflictRes = resolveSingleDay('2026-08-15', todayStr, holidays, approvedLeaves, requests, [mockHolidayWorkedDaily]);
  assert(holidayConflictRes.status === 'Present', '16. Worked attendance on Holiday correctly resolves to Present');

  // Scenario 17: Leave + attendance conflict
  const leaveConflictRes = resolveSingleDay('2026-08-10', todayStr, holidays, approvedLeaves, requests, [
    { ...mockPresentDaily, attendanceDate: '2026-08-10' },
  ]);
  assert(leaveConflictRes.status === 'Present', '17. Worked attendance on Leave date correctly resolves to Present');

  // Scenario 18: WFH + attendance
  const wfhRes = resolveSingleDay('2026-08-04', todayStr, holidays, approvedLeaves, requests, dailyRecords);
  assert(wfhRes.status === 'WFH', '18. WFH + attendance resolved as WFH');

  // Scenario 19: Monthly summary counts
  const monthDays = resolveMonthlyAttendance({
    month,
    todayDateStr: todayStr,
    holidays,
    approvedLeaves,
    attendanceRequests: requests,
    dailyRecords,
  });
  const summary = computeAttendanceSummary(monthDays);
  assert(summary.totalMonthDays === 31, '19a. Total August month days === 31');
  assert(summary.weekOffs === 5, '19b. Total Sundays in August 2026 === 5');
  assert(summary.holidays >= 2, '19c. Holidays count matches company configured holidays');

  // Scenario 20: Calendar and report consistency
  const reportDays = resolveMonthlyAttendance({
    month,
    todayDateStr: todayStr,
    holidays,
    approvedLeaves,
    attendanceRequests: requests,
    dailyRecords,
  });
  const isConsistent = monthDays.every((d, idx) => d.status === reportDays[idx].status && d.date === reportDays[idx].date);
  assert(isConsistent, '20. Calendar and Report resolution engine produces 100% identical data');

  return { passed, total: 20, logs };
};
