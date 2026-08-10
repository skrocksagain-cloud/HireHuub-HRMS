import { adminAuditLogRepository } from './repositories/adminAuditLogRepository';
import { authRepository } from './repositories/authRepository';
import { authLogService } from './authLogService';

export class UnlockWorkflowService {
  async submitUnlockRequest(
    requesterId: string,
    requesterName: string,
    targetEmployeeId: string,
    targetEmployeeName: string,
    reason: string
  ): Promise<string> {
    const logId = await adminAuditLogRepository.createAdminAuditLog({
      actorId: requesterId,
      actorName: requesterName,
      action: 'UNLOCK_REQUEST',
      targetEmployeeId,
      targetEmployeeName,
      reason,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    });

    return logId;
  }

  async approveUnlockByDeptAdmin(
    deptAdminId: string,
    deptAdminName: string,
    targetEmployeeId: string,
    targetEmployeeName: string,
    requiresSuperAdminApproval = true
  ): Promise<void> {
    const status = requiresSuperAdminApproval ? 'PENDING' : 'APPROVED';

    await adminAuditLogRepository.createAdminAuditLog({
      actorId: deptAdminId,
      actorName: deptAdminName,
      action: 'UNLOCK_APPROVE',
      targetEmployeeId,
      targetEmployeeName,
      reason: 'Department Admin approved unlock request after reviewing attendance records.',
      status,
      timestamp: new Date().toISOString(),
      metadata: { role: 'Department Admin', requiresSuperAdminApproval },
    });

    if (!requiresSuperAdminApproval) {
      const emp = await authRepository.getEmployeeByIdOrMobile(targetEmployeeId);
      if (emp) {
        await authRepository.unlockAccountStatus(emp.id);
        await authLogService.logEvent(targetEmployeeId, 'Account Unlocked', 'success', {
          unlockedBy: deptAdminName,
          unlockedById: deptAdminId,
        });
      }
    }
  }

  async approveUnlockBySuperAdmin(
    superAdminId: string,
    superAdminName: string,
    targetEmployeeId: string,
    targetEmployeeName: string,
    reason?: string
  ): Promise<void> {
    const emp = await authRepository.getEmployeeByIdOrMobile(targetEmployeeId);
    if (!emp) {
      throw new Error(`Target employee ${targetEmployeeId} not found.`);
    }

    await authRepository.unlockAccountStatus(emp.id);

    await adminAuditLogRepository.createAdminAuditLog({
      actorId: superAdminId,
      actorName: superAdminName,
      action: 'UNLOCK_OVERRIDE',
      targetEmployeeId,
      targetEmployeeName,
      reason: reason || 'Super Admin direct manual unlock override.',
      status: 'EXECUTED',
      timestamp: new Date().toISOString(),
      metadata: { role: 'Super Admin' },
    });

    await authLogService.logEvent(targetEmployeeId, 'Account Unlocked', 'success', {
      unlockedBy: superAdminName,
      unlockedById: superAdminId,
      override: true,
    });
  }

  async rejectUnlockRequest(
    reviewerId: string,
    reviewerName: string,
    targetEmployeeId: string,
    targetEmployeeName: string,
    rejectionReason: string
  ): Promise<void> {
    await adminAuditLogRepository.createAdminAuditLog({
      actorId: reviewerId,
      actorName: reviewerName,
      action: 'UNLOCK_REJECT',
      targetEmployeeId,
      targetEmployeeName,
      reason: rejectionReason,
      status: 'REJECTED',
      timestamp: new Date().toISOString(),
    });
  }
}

export const unlockWorkflowService = new UnlockWorkflowService();
