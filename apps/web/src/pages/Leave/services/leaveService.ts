import { auditService } from '../../../core/audit/auditService';
import { notificationService } from '../../../core/notifications/notificationService';

import { attendanceService } from '../../Attendance/services/attendanceService';
import { employeeRepository } from '../../Employee/repositories/employeeRepository';
import { leaveRepository } from '../repositories/leaveRepository';
import { calculateProbationState, leaveAccrualService } from './leaveAccrualService';
import { getLeaveDays, getLeaveSummary } from '../utils/leave';
import { validateCarryForward, validateLeaveApplication, validateLeaveDecision } from '../validation/leaveValidation';
import type {
  CarryForwardInput,
  LeaveActor,
  LeaveApplicationInput,
  LeaveDashboardData,
  LeaveDecisionInput,
  LeaveSummary,
} from '../types/leave';

import { hasApprovalAuthority } from '../../../core/authorization/authorizationResolver';
import { Timestamp } from 'firebase/firestore';
import type { LeaveRequest, LeaveStatus } from '../types/leave';


const normalizeRequest = (value: unknown): LeaveRequest | null => {
  if (typeof value !== 'object' || value === null) return null;
  const data = value as Record<string, unknown>;
  const toTimestamp = (candidate: unknown): Timestamp => {
    if (candidate instanceof Timestamp) return candidate;
    if (candidate instanceof Date) return Timestamp.fromDate(candidate);
    if (typeof candidate === 'string') {
      const date = new Date(candidate);
      if (!Number.isNaN(date.getTime())) return Timestamp.fromDate(date);
    }
    if (typeof candidate === 'object' && candidate !== null && 'seconds' in candidate) {
      const seconds = Number((candidate as { seconds?: unknown }).seconds);
      const nanoseconds = Number((candidate as { nanoseconds?: unknown }).nanoseconds ?? 0);
      if (Number.isFinite(seconds) && Number.isFinite(nanoseconds)) return new Timestamp(seconds, nanoseconds);
    }
    return Timestamp.now();
  };
  return {
    id: String(data.id ?? ''), employeeId: String(data.employeeId ?? ''), employeeName: String(data.employeeName ?? ''),
    department: String(data.department ?? ''), requestType: data.requestType === 'Comp Off' ? 'Comp Off' : 'Leave',
    leaveType: String(data.leaveType ?? ''), startDate: String(data.startDate ?? ''), endDate: String(data.endDate ?? ''),
    days: Number(data.days ?? 0), reason: String(data.reason ?? ''), medicalCertificateReference: String(data.medicalCertificateReference ?? ''),
    status: (data.status as LeaveStatus) || 'Pending', approverEmployeeId: typeof data.approverEmployeeId === 'string' ? data.approverEmployeeId : null,
    decisionReason: String(data.decisionReason ?? ''), isArchived: Boolean(data.isArchived),
    createdAt: toTimestamp(data.createdAt), updatedAt: toTimestamp(data.updatedAt),
  };
};

class LeaveService {
  async getDashboard(actor: LeaveActor & { assignedRole?: string }): Promise<LeaveDashboardData> {
    try {
      const emp = await employeeRepository.getEmployeeById(actor.employeeId).catch(() => null);
      if (emp?.joiningDate) await leaveAccrualService.processMonthlyAccrualForEmployee(actor.employeeId, emp.joiningDate);
    } catch {
      // Non-blocking
    }

    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../../firebase/firebase');
    const callable = httpsCallable(functions, 'getScopedLeaveRequests');
    const result = await callable({});
    const payload = result.data as { ownRequests?: unknown[]; organizationRequests?: unknown[] };
    const balances = await leaveRepository.getBalances(actor.employeeId);
    const requests = (payload.ownRequests || []).map(normalizeRequest).filter((request): request is LeaveRequest => request !== null && !request.isArchived);
    const organizationRequests = (payload.organizationRequests || []).map(normalizeRequest).filter((request): request is LeaveRequest => request !== null && !request.isArchived);
    const approvalRequests = organizationRequests.filter((request) => request.status === 'Pending');
    return { balances, requests, approvalRequests, organizationRequests };
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
      } else if (isRestrictedType && !hasApprovalAuthority(actor.role, 'Super Admin')) {
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
    validateLeaveDecision(input);
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../../firebase/firebase');
    const readCallable = httpsCallable(functions, 'getScopedLeaveRequests');
    const readResult = await readCallable({});
    const payload = readResult.data as { organizationRequests?: unknown[] };
    const request = (payload.organizationRequests || []).map(normalizeRequest).find((item) => item?.id === input.requestId);
    if (!request || request.status !== 'Pending') throw new Error('This leave request is no longer pending.');

    const decideCallable = httpsCallable(functions, 'decideLeaveRequest');
    await decideCallable({ ...input, reason: input.reason.trim() });
    if (input.decision === 'Approved') {
      await attendanceService.syncApprovedLeave({
        leaveRequestId: request.id,
      });
    }

    await auditService.record({
      module: 'Leave', action: input.decision, recordId: request.id, performedBy: actor.employeeId,
      role: actor.role, previousValue: { status: 'Pending' }, newValue: { status: input.decision }, remarks: input.reason.trim(),
    });
    await notificationService.send({
      recipientEmployeeId: request.employeeId, title: 'Leave request ' + input.decision.toLowerCase(),
      message: input.reason.trim(), module: 'Leave', type: input.decision === 'Approved' ? 'success' : 'warning',
    });
  }

  async cancel(actor: LeaveActor, requestId: string): Promise<void> {
    const request = await leaveRepository.getRequest(requestId);
    if (!request || request.status !== 'Pending') {
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
    if (!hasApprovalAuthority(actor.role, 'Master Admin')) {
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
