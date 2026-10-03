import { auditService } from '../../../core/audit/auditService';
import { notificationService } from '../../../core/notifications/notificationService';

import { MINIMUM_HALF_DAY_WORK_MINUTES } from '../constants/attendance';
import { Timestamp } from 'firebase/firestore';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { compOffService } from './compOffService';
import { getAttendanceStatusForLogin, getLocalAttendanceDate } from '../utils/attendance';
import { validateAttendanceDecision, validateAttendanceRequest } from '../validation/attendanceValidation';
import type {
  AttendanceActor,
  AttendanceApprovalInput,
  AttendanceDashboardData,
  AttendanceRequest,
  AttendanceRequestType,
  DailyAttendance,
  DeviceDetails,
} from '../types/attendance';


export interface ApprovedLeaveAttendanceInput {
  leaveRequestId: string;
}

class AttendanceService {
  async getDashboard(actor: AttendanceActor & { assignedRole?: string }, month: string): Promise<AttendanceDashboardData> {
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../../firebase/firebase');
    const callable = httpsCallable(functions, 'getScopedAttendanceDashboard');
    const result = await callable({ month, today: getLocalAttendanceDate(), targetEmployeeId: actor.employeeId });
    const payload = result.data as Record<string, unknown>;
    const toTimestamp = (value: unknown): import('firebase/firestore').Timestamp | null => {
      if (value instanceof Timestamp) return value;
      if (value instanceof Date) return Timestamp.fromDate(value);
      if (typeof value === 'string') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
      }
      if (typeof value === 'object' && value !== null && 'seconds' in value) {
        const seconds = Number((value as { seconds?: unknown }).seconds);
        const nanos = Number((value as { nanoseconds?: unknown }).nanoseconds ?? 0);
        if (Number.isFinite(seconds) && Number.isFinite(nanos)) return new Timestamp(seconds, nanos);
      }
      return null;
    };
    const daily = (value: unknown): DailyAttendance | null => {
      if (typeof value !== 'object' || value === null) return null;
      const record = value as Record<string, unknown>;
      const createdAt = toTimestamp(record.createdAt) || Timestamp.now();
      const updatedAt = toTimestamp(record.updatedAt) || createdAt;
      return {
        id: String(record.id ?? ''), documentType: 'daily', employeeId: String(record.employeeId ?? ''),
        employeeName: String(record.employeeName ?? ''), department: String(record.department ?? ''),
        attendanceDate: String(record.attendanceDate ?? ''), status: record.status as DailyAttendance['status'],
        loginTime: toTimestamp(record.loginTime), logoutTime: toTimestamp(record.logoutTime),
        totalWorkMinutes: Number(record.totalWorkMinutes ?? 0), isLocked: Boolean(record.isLocked),
        createdAt, updatedAt,
      };
    };
    const request = (value: unknown): AttendanceRequest | null => {
      if (typeof value !== 'object' || value === null) return null;
      const record = value as Record<string, unknown>;
      const createdAt = toTimestamp(record.createdAt) || Timestamp.now();
      return {
        id: String(record.id ?? ''), documentType: 'request', employeeId: String(record.employeeId ?? ''),
        employeeName: String(record.employeeName ?? ''), department: String(record.department ?? ''),
        requestType: record.requestType === 'WFH' ? 'WFH' : 'Regularization', attendanceDate: String(record.attendanceDate ?? ''),
        reason: String(record.reason ?? ''), status: (record.status as AttendanceRequest['status']) || 'Pending',
        approvalStage: record.approvalStage as AttendanceRequest['approvalStage'], managerApproved: Boolean(record.managerApproved),
        managerApproverId: typeof record.managerApproverId === 'string' ? record.managerApproverId : null,
        managerApprovedAt: toTimestamp(record.managerApprovedAt), adminApproved: Boolean(record.adminApproved),
        adminApproverId: typeof record.adminApproverId === 'string' ? record.adminApproverId : null,
        adminApprovedAt: toTimestamp(record.adminApprovedAt), approverEmployeeId: typeof record.approverEmployeeId === 'string' ? record.approverEmployeeId : null,
        decisionReason: String(record.decisionReason ?? ''), createdAt, updatedAt: toTimestamp(record.updatedAt) || createdAt,
      };
    };
    const list = (value: unknown, map: (item: unknown) => DailyAttendance | AttendanceRequest | null) =>
      Array.isArray(value) ? value.map(map).filter((item): item is DailyAttendance | AttendanceRequest => item !== null) : [];
    const approvedLeaves = Array.isArray(payload.approvedLeaves) ? payload.approvedLeaves as AttendanceDashboardData['approvedLeaves'] : [];
    const today = daily(payload.today);
    return {
      today,
      monthRecords: list(payload.monthRecords, daily).filter((item): item is DailyAttendance => item.documentType === 'daily'),
      requests: list(payload.requests, request).filter((item): item is AttendanceRequest => item.documentType === 'request'),
      organizationRecords: list(payload.organizationRecords, daily).filter((item): item is DailyAttendance => item.documentType === 'daily'),
      approvedLeaves,
    };
  }

  async login(actor: AttendanceActor, device: DeviceDetails): Promise<void> {
    const now = new Date();
    const attendanceDate = getLocalAttendanceDate(now);
    const existing = await attendanceRepository.getDaily(actor.employeeId, attendanceDate);
    if (existing?.loginTime) throw new Error('Attendance has already been started for today.');
    if (existing?.isLocked) throw new Error('Attendance for this date is locked.');

    await attendanceRepository.createDaily({
      documentType: 'daily',
      employeeId: actor.employeeId,
      employeeName: actor.name,
      department: actor.department,
      attendanceDate,
      status: 'Incomplete',
      loginTime: null,
      logoutTime: null,
      totalWorkMinutes: 0,
      isLocked: false,
      ...device,
    });

    // Evaluate Comp Off if worked on Holiday / Sunday
    void this.evaluateCompOff(attendanceDate);

    await auditService.record({
      module: 'Attendance',
      action: 'Login',
      recordId: `${actor.employeeId}:${attendanceDate}`,
      performedBy: actor.employeeId,
      role: actor.role,
      remarks: 'Attendance session started.',
    });
    await notificationService.send({
      recipientEmployeeId: actor.employeeId,
      title: 'Attendance started',
      message: 'Your attendance login was recorded successfully.',
      module: 'Attendance',
      type: 'success',
    });
  }

  async logout(actor: AttendanceActor): Promise<void> {
    const attendanceDate = getLocalAttendanceDate();
    const daily = await attendanceRepository.getDaily(actor.employeeId, attendanceDate);
    if (!daily?.loginTime) throw new Error('Start attendance before logging out.');
    if (daily.logoutTime || daily.isLocked) throw new Error('Attendance for today is already closed.');

    const workMinutes = Math.max(0, Math.floor((Date.now() - daily.loginTime.toMillis()) / 60_000));

    // Re-evaluate initial status because login now sets status to 'Incomplete'
    const initialStatus = daily.status === 'Incomplete' ? getAttendanceStatusForLogin(daily.loginTime.toDate()) : daily.status;

    const status =
      initialStatus === 'Late'
        ? 'Late'
        : workMinutes < MINIMUM_HALF_DAY_WORK_MINUTES
        ? 'Half Day'
        : initialStatus;

    await attendanceRepository.closeDaily(daily.id, status, workMinutes);

    // Evaluate Comp Off if worked on Holiday / Sunday
    void this.evaluateCompOff(attendanceDate);

    await auditService.record({
      module: 'Attendance',
      action: 'Logout',
      recordId: daily.id,
      performedBy: actor.employeeId,
      role: actor.role,
      previousValue: { status: daily.status },
      newValue: { status, totalWorkMinutes: workMinutes },
      remarks: 'Attendance session closed.',
    });
    await notificationService.send({
      recipientEmployeeId: actor.employeeId,
      title: 'Attendance completed',
      message: 'Your attendance logout was recorded successfully.',
      module: 'Attendance',
      type: 'success',
    });
  }

  private async evaluateCompOff(attendanceDate: string): Promise<void> {
    try {
      await compOffService.grantCompOffIfWorked({ attendanceDate });
    } catch {
      // Safe non-blocking
    }
  }

  async submitRequest(
    actor: AttendanceActor,
    requestType: AttendanceRequestType,
    attendanceDate: string,
    reason: string
  ): Promise<void> {
    validateAttendanceRequest(requestType, attendanceDate, reason);
    await attendanceRepository.createRequest({
      employeeId: actor.employeeId,
      employeeName: actor.name,
      department: actor.department,
      requestType,
      attendanceDate,
      reason: reason.trim(),
    });
    await auditService.record({
      module: 'Attendance',
      action: requestType === 'WFH' ? 'WFH Request' : 'Regularization Request',
      recordId: `${actor.employeeId}:${attendanceDate}`,
      performedBy: actor.employeeId,
      role: actor.role,
      remarks: reason.trim(),
    });
  }

  /**
   * Two-Stage Approval Engine:
   * Stage 1: Reporting Manager Approval -> sets approvalStage: 'Approved by Manager', status: 'Pending'
   * Stage 2: Admin or Super Admin Final Approval -> sets status: 'Approved', approvalStage: 'Fully Approved'
   * Only FULLY APPROVED requests update authoritative attendance in Firestore and feed payroll.
   */
  async decideRequest(actor: AttendanceActor, input: AttendanceApprovalInput): Promise<void> {
    validateAttendanceDecision(input);
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../../firebase/firebase');
    const callable = httpsCallable(functions, 'decideAttendanceRequest');
    const result = await callable({ ...input, reason: input.reason.trim() });
    const decision = result.data as { employeeId: string; employeeName: string; requestType: AttendanceRequestType; status: string; approvalStage: string };
    await auditService.record({
      module: 'Attendance', action: input.decision, recordId: input.requestId, performedBy: actor.employeeId,
      role: actor.role, newValue: { status: decision.status, stage: decision.approvalStage }, remarks: input.reason.trim(),
    });
    await notificationService.send({
      recipientEmployeeId: decision.employeeId,
      title: decision.requestType + ' request ' + decision.approvalStage.toLowerCase(),
      message: input.reason.trim(), module: 'Attendance', type: decision.status === 'Approved' ? 'success' : 'info',
    });
  }

  async syncApprovedLeave(input: ApprovedLeaveAttendanceInput): Promise<void> {
    if (!input.leaveRequestId) return;
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../../firebase/firebase');
    const callable = httpsCallable(functions, 'syncApprovedLeaveAttendance');
    await callable(input);
  }
}

export const attendanceService = new AttendanceService();
