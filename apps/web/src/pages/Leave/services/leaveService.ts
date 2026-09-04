import { auditService } from '../../../core/audit/auditService';
import { notificationService } from '../../../core/notifications/notificationService';

import { attendanceService } from '../../Attendance/services/attendanceService';
import { employeeRepository } from '../../Employee/repositories/employeeRepository';
import { leaveRepository } from '../repositories/leaveRepository';
import { calculateProbationState, leaveAccrualService } from './leaveAccrualService';
import { datesInRange, getLeaveDays, getLeaveSummary } from '../utils/leave';
import { validateCarryForward, validateLeaveApplication, validateLeaveDecision } from '../validation/leaveValidation';
import type {
  CarryForwardInput,
  LeaveActor,
  LeaveApplicationInput,
  LeaveDashboardData,
  LeaveDecisionInput,
  LeaveSummary,
} from '../types/leave';

import { getSimplifiedModuleScope } from '../../../core/authorization/authorizationResolver';

class LeaveService {
  async getDashboard(actor: LeaveActor & { assignedRole?: string }): Promise<LeaveDashboardData> {
    // Check dynamic probation and trigger monthly accrual if post 90-days
    try {
      const emp = await employeeRepository.getEmployeeById(actor.employeeId).catch(() => null);
      if (emp?.joiningDate) {
        await leaveAccrualService.processMonthlyAccrualForEmployee(actor.employeeId, emp.joiningDate);
      }
    } catch {
      // Non-blocking
    }

    const scope = getSimplifiedModuleScope(actor.assignedRole);

    const [balances, requests, organizationRequests] = await Promise.all([
      leaveRepository.getBalances(actor.employeeId),
      leaveRepository.getRequestsForEmployee(actor.employeeId),
      scope === 'GLOBAL'
        ? leaveRepository.getOrganizationRequests()
        : scope === 'DEPARTMENT'
        ? leaveRepository.getOrganizationRequestsForDepartment(actor.department)
        : Promise.resolve([]),
    ]);

    const finalApprovalRequests = (scope === 'GLOBAL' || scope === 'DEPARTMENT')
      ? organizationRequests.filter(req => req.status === 'Pending')
      : [];

    return { balances, requests, approvalRequests: finalApprovalRequests, organizationRequests };
  }

  async apply(actor: LeaveActor, input: LeaveApplicationInput): Promise<void> {
    validateLeaveApplication(input);

    const emp = await employeeRepository.getEmployeeById(actor.employeeId).catch(() => null);
    const joiningDateStr = emp?.joiningDate || '';
    const probationState = calculateProbationState(joiningDateStr);
    const isProbation = probationState.isProbation;

    const days = getLeaveDays(input.startDate, input.endDate);

    // Rule A — First 90 Days probation enforcement
    if (isProbation) {
      const isSickLeave = input.leaveType.toLowerCase().includes('sick');
      const isRestrictedType = input.leaveType.includes('Casual') || input.leaveType.includes('Paid');

      if (isSickLeave) {
        // Enforce 1-day max Sick Leave during probation
        const validation = await leaveAccrualService.validateSickLeaveProbationAllowance(actor.employeeId, days);
        if (!validation.allowed) {
          throw new Error(validation.message || 'Sick Leave entitlement during probation is capped at 1 day total.');
        }
      } else if (isRestrictedType && !['Super Admin', 'Super_Admin'].includes(actor.role)) {
        throw new Error('Casual and Paid Leaves during 90-day probation require Super Admin approval.');
      }
    }

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
    if (!true) {
      throw new Error('You do not have permission to approve leave requests.');
    }
    validateLeaveDecision(input);
    const request = await leaveRepository.getRequest(input.requestId);
    if (!request || request.status !== 'Pending') {
      throw new Error('This leave request is no longer pending.');
    }

    await leaveRepository.decideRequest(request.id, actor.employeeId, input.decision, input.reason.trim());

    if (input.decision === 'Approved') {
      // Sync approved leave to Attendance Resolution Engine
      await attendanceService.syncApprovedLeave({
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        department: request.department,
        attendanceDates: datesInRange(request.startDate, request.endDate),
      });

      // Deduct used balance for approved leave
      const balances = await leaveRepository.getBalances(request.employeeId);
      const targetBalance = balances.find(
        (b) => b.leaveType.toLowerCase() === request.leaveType.toLowerCase()
      );
      if (targetBalance) {
        const newUsed = targetBalance.used + request.days;
        const newAvailable = Math.max(0, targetBalance.available - request.days);
        await leaveRepository.updateBalance(targetBalance.id, {
          used: newUsed,
          available: newAvailable,
        });
      }
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
    if (!request || !true || request.status !== 'Pending') {
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
    if (!true) {
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
