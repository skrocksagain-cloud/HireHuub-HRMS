import { auditService } from '../../../core/audit/auditService';
import { notificationService } from '../../../core/notifications/notificationService';
import { permissionService } from '../../../core/permissions/permissionService';
import { MINIMUM_HALF_DAY_WORK_MINUTES } from '../constants/attendance';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { getAttendanceStatusForLogin, getLocalAttendanceDate, getMonthBounds } from '../utils/attendance';
import { validateAttendanceDecision, validateAttendanceRequest } from '../validation/attendanceValidation';
import type { AttendanceActor, AttendanceApprovalInput, AttendanceDashboardData, AttendanceRequestType, DeviceDetails } from '../types/attendance';

export interface ApprovedLeaveAttendanceInput { employeeId: string; employeeName: string; department: string; attendanceDates: string[]; }

class AttendanceService {
  async getDashboard(actor: AttendanceActor, month: string): Promise<AttendanceDashboardData> {
    const bounds = getMonthBounds(month);
    const [today, monthRecords, requests, organizationRecords] = await Promise.all([
      attendanceRepository.getDaily(actor.employeeId, getLocalAttendanceDate()),
      attendanceRepository.getDailyForEmployee(actor.employeeId, bounds.start, bounds.end),
      permissionService.canApproveAttendance(actor.role) ? attendanceRepository.getPendingRequests() : attendanceRepository.getRequestsForEmployee(actor.employeeId),
      permissionService.canViewOrganizationAttendance(actor.role) ? attendanceRepository.getDailyForOrganization(bounds.start, bounds.end) : Promise.resolve([]),
    ]);
    return { today, monthRecords, requests, organizationRecords };
  }

  async login(actor: AttendanceActor, device: DeviceDetails): Promise<void> {
    const now = new Date();
    const attendanceDate = getLocalAttendanceDate(now);
    const existing = await attendanceRepository.getDaily(actor.employeeId, attendanceDate);
    if (existing?.loginTime) throw new Error('Attendance has already been started for today.');
    if (existing?.isLocked) throw new Error('Attendance for this date is locked.');
    await attendanceRepository.createDaily({ documentType: 'daily', employeeId: actor.employeeId, employeeName: actor.name, department: actor.department, attendanceDate, status: getAttendanceStatusForLogin(now), loginTime: null, logoutTime: null, totalWorkMinutes: 0, isLocked: false, ...device });
    await auditService.record({ module: 'Attendance', action: 'Login', recordId: `${actor.employeeId}:${attendanceDate}`, performedBy: actor.employeeId, role: actor.role, remarks: 'Attendance session started.' });
    await notificationService.send({ recipientEmployeeId: actor.employeeId, title: 'Attendance started', message: 'Your attendance login was recorded successfully.', module: 'Attendance', type: 'success' });
  }

  async logout(actor: AttendanceActor): Promise<void> {
    const attendanceDate = getLocalAttendanceDate();
    const daily = await attendanceRepository.getDaily(actor.employeeId, attendanceDate);
    if (!daily?.loginTime) throw new Error('Start attendance before logging out.');
    if (daily.logoutTime || daily.isLocked) throw new Error('Attendance for today is already closed.');
    const workMinutes = Math.max(0, Math.floor((Date.now() - daily.loginTime.toMillis()) / 60_000));
    const status = daily.status === 'Late' ? 'Late' : workMinutes < MINIMUM_HALF_DAY_WORK_MINUTES ? 'Half Day' : daily.status;
    await attendanceRepository.closeDaily(daily.id, status, workMinutes);
    await auditService.record({ module: 'Attendance', action: 'Logout', recordId: daily.id, performedBy: actor.employeeId, role: actor.role, previousValue: { status: daily.status }, newValue: { status, totalWorkMinutes: workMinutes }, remarks: 'Attendance session closed.' });
    await notificationService.send({ recipientEmployeeId: actor.employeeId, title: 'Attendance completed', message: 'Your attendance logout was recorded successfully.', module: 'Attendance', type: 'success' });
  }

  async submitRequest(actor: AttendanceActor, requestType: AttendanceRequestType, attendanceDate: string, reason: string): Promise<void> {
    validateAttendanceRequest(requestType, attendanceDate, reason);
    await attendanceRepository.createRequest({ employeeId: actor.employeeId, employeeName: actor.name, department: actor.department, requestType, attendanceDate, reason: reason.trim() });
    await auditService.record({ module: 'Attendance', action: requestType === 'WFH' ? 'WFH Request' : 'Regularization Request', recordId: `${actor.employeeId}:${attendanceDate}`, performedBy: actor.employeeId, role: actor.role, remarks: reason.trim() });
  }

  async decideRequest(actor: AttendanceActor, input: AttendanceApprovalInput): Promise<void> {
    if (!permissionService.canApproveAttendance(actor.role)) throw new Error('You do not have permission to approve attendance requests.');
    validateAttendanceDecision(input);
    const request = (await attendanceRepository.getPendingRequests()).find(({ id }) => id === input.requestId);
    if (!request) throw new Error('This attendance request is no longer pending.');
    await attendanceRepository.decideRequest(input.requestId, actor.employeeId, input.decision, input.reason.trim());
    if (input.decision === 'Approved' && request.requestType === 'WFH') {
      const daily = await attendanceRepository.getDaily(request.employeeId, request.attendanceDate);
      if (daily) await attendanceRepository.updateDaily(daily.id, { status: 'WFH' });
      else await attendanceRepository.createStatusDaily({ documentType: 'daily', employeeId: request.employeeId, employeeName: request.employeeName, department: request.department, attendanceDate: request.attendanceDate, status: 'WFH', isLocked: false });
    }
    await auditService.record({ module: 'Attendance', action: input.decision, recordId: request.id, performedBy: actor.employeeId, role: actor.role, previousValue: { status: 'Pending' }, newValue: { status: input.decision }, remarks: input.reason.trim() });
    await notificationService.send({ recipientEmployeeId: request.employeeId, title: `${request.requestType} request ${input.decision.toLowerCase()}`, message: input.reason.trim(), module: 'Attendance', type: input.decision === 'Approved' ? 'success' : 'warning' });
  }

  async syncApprovedLeave(input: ApprovedLeaveAttendanceInput): Promise<void> {
    await Promise.all(input.attendanceDates.map(async (attendanceDate) => {
      const daily = await attendanceRepository.getDaily(input.employeeId, attendanceDate);
      if (daily) await attendanceRepository.updateDaily(daily.id, { status: 'Leave' });
      else await attendanceRepository.createStatusDaily({ documentType: 'daily', employeeId: input.employeeId, employeeName: input.employeeName, department: input.department, attendanceDate, status: 'Leave', isLocked: false });
    }));
  }
}

export const attendanceService = new AttendanceService();
