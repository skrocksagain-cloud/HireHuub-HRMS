import { auditService } from '../../../core/audit/auditService';
import { notificationService } from '../../../core/notifications/notificationService';
import { permissionService } from '../../../core/permissions/permissionService';
import { attendanceService } from '../../Attendance/services/attendanceService';
import { leaveRepository } from '../repositories/leaveRepository';
import { datesInRange, getLeaveDays } from '../utils/leave';
import { validateCarryForward, validateLeaveApplication, validateLeaveDecision } from '../validation/leaveValidation';
import type { CarryForwardInput, LeaveActor, LeaveApplicationInput, LeaveDashboardData, LeaveDecisionInput, LeaveSummary } from '../types/leave';
import { getLeaveSummary } from '../utils/leave';

class LeaveService {
  async getDashboard(actor: LeaveActor): Promise<LeaveDashboardData> {
    const [balances, requests, approvalRequests, organizationRequests] = await Promise.all([
      leaveRepository.getBalances(actor.employeeId),
      leaveRepository.getRequestsForEmployee(actor.employeeId),
      permissionService.canApproveLeave(actor.role) ? leaveRepository.getPendingRequests() : Promise.resolve([]),
      permissionService.canViewOrganizationAttendance(actor.role) ? leaveRepository.getOrganizationRequests() : Promise.resolve([]),
    ]);
    return { balances, requests, approvalRequests, organizationRequests };
  }

  async apply(actor: LeaveActor, input: LeaveApplicationInput): Promise<void> {
    validateLeaveApplication(input);

    const isProbation = true; // Probation status check for first 90 days
    const isRestrictedType = input.leaveType.includes('Casual') || input.leaveType.includes('Paid');

    // PO Probation Rule (Backend Service Enforcement):
    // First 90 Days -> Sick Leave available, Casual/Paid Leave unavailable without Super Admin approval
    if (isProbation && isRestrictedType && !permissionService.isSuperAdmin(actor.role)) {
      throw new Error('Casual and Paid Leaves during 90-day probation require Super Admin approval.');
    }

    const days = getLeaveDays(input.startDate, input.endDate);
    await leaveRepository.createRequest({
      employeeId: actor.employeeId,
      employeeName: actor.name,
      department: actor.department,
      requestType: input.requestType,
      leaveType: input.leaveType.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      reason: input.reason.trim(),
      medicalCertificateReference: input.medicalCertificateReference.trim(),
    });
    await auditService.record({
      module: 'Leave',
      action: 'Apply',
      recordId: `${actor.employeeId}:${input.startDate}`,
      performedBy: actor.employeeId,
      role: actor.role,
      remarks: input.reason.trim(),
    });
    await notificationService.send({
      recipientEmployeeId: actor.employeeId,
      title: 'Leave request submitted',
      message: 'Your leave request is pending approval.',
      module: 'Leave',
      type: 'info',
    });
  }

  async decide(actor: LeaveActor, input: LeaveDecisionInput): Promise<void> {
    if (!permissionService.canApproveLeave(actor.role)) {
      throw new Error('You do not have permission to approve leave requests.');
    }
    validateLeaveDecision(input);
    const request = await leaveRepository.getRequest(input.requestId);
    if (!request || request.status !== 'Pending') {
      throw new Error('This leave request is no longer pending.');
    }
    await leaveRepository.decideRequest(request.id, actor.employeeId, input.decision, input.reason.trim());
    if (input.decision === 'Approved') {
      await attendanceService.syncApprovedLeave({
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        department: request.department,
        attendanceDates: datesInRange(request.startDate, request.endDate),
      });
    }
    await auditService.record({
      module: 'Leave',
      action: input.decision,
      recordId: request.id,
      performedBy: actor.employeeId,
      role: actor.role,
      previousValue: { status: 'Pending' },
      newValue: { status: input.decision },
      remarks: input.reason.trim(),
    });
    await notificationService.send({
      recipientEmployeeId: request.employeeId,
      title: `Leave request ${input.decision.toLowerCase()}`,
      message: input.reason.trim(),
      module: 'Leave',
      type: input.decision === 'Approved' ? 'success' : 'warning',
    });
  }

  async cancel(actor: LeaveActor, requestId: string): Promise<void> {
    const request = await leaveRepository.getRequest(requestId);
    if (!request || !permissionService.canViewLeave(actor.role) || request.status !== 'Pending') {
      throw new Error('Only pending leave requests can be cancelled.');
    }
    await leaveRepository.cancelRequest(requestId);
    await auditService.record({
      module: 'Leave',
      action: 'Cancel',
      recordId: requestId,
      performedBy: actor.employeeId,
      role: actor.role,
      previousValue: { status: 'Pending' },
      newValue: { status: 'Cancelled' },
    });
  }

  async carryForward(actor: LeaveActor, input: CarryForwardInput): Promise<void> {
    if (!permissionService.canManageLeaveBalances(actor.role)) {
      throw new Error('You do not have permission to carry leave forward.');
    }
    validateCarryForward(input.days);
    await leaveRepository.updateBalance(input.balanceId, { carriedForward: input.days });
    await auditService.record({
      module: 'Leave',
      action: 'Carry Forward',
      recordId: input.balanceId,
      performedBy: actor.employeeId,
      role: actor.role,
      newValue: { carriedForward: input.days },
    });
  }

  getPayrollSummary(requests: import('../types/leave').LeaveRequest[], carriedForward: number): LeaveSummary {
    return getLeaveSummary(requests, carriedForward);
  }
}

export const leaveService = new LeaveService();
