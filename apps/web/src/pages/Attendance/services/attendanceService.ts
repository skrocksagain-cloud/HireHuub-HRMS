import { auditService } from '../../../core/audit/auditService';
import { notificationService } from '../../../core/notifications/notificationService';
import { permissionService } from '../../../core/permissions/permissionService';
import { calendarService } from '../../../services/calendar/calendarService';
import { MINIMUM_HALF_DAY_WORK_MINUTES } from '../constants/attendance';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { compOffService } from './compOffService';
import { getAttendanceStatusForLogin, getLocalAttendanceDate, getMonthBounds } from '../utils/attendance';
import { validateAttendanceDecision, validateAttendanceRequest } from '../validation/attendanceValidation';
import type {
  AttendanceActor,
  AttendanceApprovalInput,
  AttendanceDashboardData,
  AttendanceRequestType,
  DeviceDetails,
} from '../types/attendance';

import { getSimplifiedModuleScope } from '../../../core/authorization/authorizationResolver';

export interface ApprovedLeaveAttendanceInput {
  employeeId: string;
  employeeName: string;
  department: string;
  attendanceDates: string[];
}

class AttendanceService {
  async getDashboard(actor: AttendanceActor & { assignedRole?: string }, month: string): Promise<AttendanceDashboardData> {
    const bounds = getMonthBounds(month);
    const scope = getSimplifiedModuleScope(actor.assignedRole);

    const requestsPromise = scope === 'GLOBAL' 
      ? attendanceRepository.getPendingRequests() 
      : scope === 'DEPARTMENT' 
      ? attendanceRepository.getPendingRequestsForDepartment(actor.department)
      : attendanceRepository.getRequestsForEmployee(actor.employeeId);

    const organizationRecordsPromise = scope === 'GLOBAL'
      ? attendanceRepository.getDailyForOrganization(bounds.start, bounds.end)
      : scope === 'DEPARTMENT'
      ? attendanceRepository.getDailyForDepartment(bounds.start, bounds.end, actor.department)
      : Promise.resolve([]);

    const [today, monthRecords, requests, organizationRecords] = await Promise.all([
      attendanceRepository.getDaily(actor.employeeId, getLocalAttendanceDate()),
      attendanceRepository.getDailyForEmployee(actor.employeeId, bounds.start, bounds.end),
      requestsPromise,
      organizationRecordsPromise,
    ]);
    return { today, monthRecords, requests, organizationRecords };
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
      status: getAttendanceStatusForLogin(now),
      loginTime: null,
      logoutTime: null,
      totalWorkMinutes: 0,
      isLocked: false,
      ...device,
    });

    // Evaluate Comp Off if worked on Holiday / Sunday
    void this.evaluateCompOff(actor, attendanceDate);

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
    const status =
      daily.status === 'Late'
        ? 'Late'
        : workMinutes < MINIMUM_HALF_DAY_WORK_MINUTES
        ? 'Half Day'
        : daily.status;

    await attendanceRepository.closeDaily(daily.id, status, workMinutes);

    // Evaluate Comp Off if worked on Holiday / Sunday
    void this.evaluateCompOff(actor, attendanceDate);

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

  private async evaluateCompOff(actor: AttendanceActor, attendanceDate: string): Promise<void> {
    try {
      const [year, monthNum, dayNum] = attendanceDate.split('-').map(Number);
      const dObj = new Date(year, monthNum - 1, dayNum);
      const isSunday = dObj.getDay() === 0;

      const holidays = await calendarService.getHolidays().catch(() => []);
      const matchedHoliday = holidays.find((h) => h.date === attendanceDate);
      const isHoliday = Boolean(matchedHoliday);

      if (isSunday || isHoliday) {
        await compOffService.grantCompOffIfWorked({
          employeeId: actor.employeeId,
          employeeName: actor.name,
          department: actor.department,
          attendanceDate,
          isHoliday,
          isSunday,
          holidayName: matchedHoliday?.name,
        });
      }
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
    if (!permissionService.canApproveAttendance(actor.role)) {
      throw new Error('You do not have permission to approve attendance requests.');
    }
    validateAttendanceDecision(input);

    const requests = await attendanceRepository.getPendingRequests();
    const request = requests.find(({ id }) => id === input.requestId);
    if (!request) throw new Error('This attendance request is no longer pending.');

    const isManagerRole =
      actor.role.toLowerCase().includes('manager') || actor.role.toLowerCase().includes('lead');
    const isAdminRole =
      actor.role.toLowerCase().includes('admin') || permissionService.isSuperAdmin(actor.role);

    if (input.decision === 'Rejected') {
      // Rejection at any stage
      await attendanceRepository.updateRequestStage(input.requestId, {
        status: 'Rejected',
        approvalStage: 'Rejected',
        approverEmployeeId: actor.employeeId,
        decisionReason: input.reason.trim(),
      });

      await auditService.record({
        module: 'Attendance',
        action: 'Rejected',
        recordId: request.id,
        performedBy: actor.employeeId,
        role: actor.role,
        previousValue: { status: request.status, stage: request.approvalStage },
        newValue: { status: 'Rejected', stage: 'Rejected' },
        remarks: input.reason.trim(),
      });
      return;
    }

    // Decision === 'Approved'
    let finalStatus: 'Pending' | 'Approved' = 'Pending';
    let newStage: 'Approved by Manager' | 'Fully Approved' = 'Approved by Manager';

    if (isAdminRole) {
      // Admin / Super Admin provides final stage approval
      finalStatus = 'Approved';
      newStage = 'Fully Approved';
      await attendanceRepository.updateRequestStage(input.requestId, {
        status: 'Approved',
        approvalStage: 'Fully Approved',
        adminApproved: true,
        adminApproverId: actor.employeeId,
        approverEmployeeId: actor.employeeId,
        decisionReason: input.reason.trim(),
      });
    } else if (isManagerRole) {
      // Stage 1: Reporting Manager Approval
      finalStatus = 'Pending';
      newStage = 'Approved by Manager';
      await attendanceRepository.updateRequestStage(input.requestId, {
        status: 'Pending',
        approvalStage: 'Approved by Manager',
        managerApproved: true,
        managerApproverId: actor.employeeId,
        decisionReason: input.reason.trim(),
      });
    } else {
      // General approver (Admin override)
      finalStatus = 'Approved';
      newStage = 'Fully Approved';
      await attendanceRepository.updateRequestStage(input.requestId, {
        status: 'Approved',
        approvalStage: 'Fully Approved',
        adminApproved: true,
        adminApproverId: actor.employeeId,
        approverEmployeeId: actor.employeeId,
        decisionReason: input.reason.trim(),
      });
    }

    // Apply Authoritative Attendance Correction ONLY IF FULLY APPROVED
    if (finalStatus === 'Approved' && newStage === 'Fully Approved') {
      const targetStatus = request.requestType === 'WFH' ? 'WFH' : 'Present';
      const daily = await attendanceRepository.getDaily(request.employeeId, request.attendanceDate);

      if (daily) {
        await attendanceRepository.updateDaily(daily.id, { status: targetStatus });
      } else {
        await attendanceRepository.createStatusDaily({
          documentType: 'daily',
          employeeId: request.employeeId,
          employeeName: request.employeeName,
          department: request.department,
          attendanceDate: request.attendanceDate,
          status: targetStatus,
          isLocked: false,
        });
      }

      // Check Comp Off if regularized date is a Holiday or Sunday
      void this.evaluateCompOff(
        {
          employeeId: request.employeeId,
          name: request.employeeName,
          role: 'Employee',
          department: request.department,
        },
        request.attendanceDate
      );
    }

    await auditService.record({
      module: 'Attendance',
      action: input.decision,
      recordId: request.id,
      performedBy: actor.employeeId,
      role: actor.role,
      previousValue: { status: request.status, stage: request.approvalStage },
      newValue: { status: finalStatus, stage: newStage },
      remarks: input.reason.trim(),
    });

    await notificationService.send({
      recipientEmployeeId: request.employeeId,
      title: `${request.requestType} request ${newStage.toLowerCase()}`,
      message: input.reason.trim(),
      module: 'Attendance',
      type: finalStatus === 'Approved' ? 'success' : 'info',
    });
  }

  async syncApprovedLeave(input: ApprovedLeaveAttendanceInput): Promise<void> {
    await Promise.all(
      input.attendanceDates.map(async (attendanceDate) => {
        const daily = await attendanceRepository.getDaily(input.employeeId, attendanceDate);
        if (daily) await attendanceRepository.updateDaily(daily.id, { status: 'Leave' });
        else
          await attendanceRepository.createStatusDaily({
            documentType: 'daily',
            employeeId: input.employeeId,
            employeeName: input.employeeName,
            department: input.department,
            attendanceDate,
            status: 'Leave',
            isLocked: false,
          });
      })
    );
  }
}

export const attendanceService = new AttendanceService();
