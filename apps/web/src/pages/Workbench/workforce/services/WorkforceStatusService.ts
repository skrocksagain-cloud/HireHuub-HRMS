import type { ClientPayoutImportRecord, WorkingStatus, WorkforceItem } from '../types/workforce';

export class WorkforceStatusService {
  /**
   * Resolves Working Status strictly from Client Payout Import records.
   * Working Status MUST NEVER BE MANUALLY EDITABLE.
   * Candidate present in any payout import for specified active month -> Working = 'Working'.
   * Otherwise -> Working = 'Not Working'.
   */
  static resolveWorkingStatus(
    employeeId: string,
    activeMonth: string,
    imports: ClientPayoutImportRecord[]
  ): WorkingStatus {
    if (!employeeId || !imports || imports.length === 0) {
      return 'Not Working';
    }

    const relevantImports = imports.filter(
      (imp) => imp.month === activeMonth && imp.isApproved
    );

    for (const imp of relevantImports) {
      const match = imp.rows.find(
        (r) => r.employeeId.trim().toLowerCase() === employeeId.trim().toLowerCase() && r.matched
      );
      if (match) {
        return 'Working';
      }
    }

    return 'Not Working';
  }

  /**
   * Enforces role-based permission access check for Workforce workspace.
   * Marketing and HR roles have NO ACCESS.
   */
  static canAccessWorkforce(userRole: string): boolean {
    const restrictedRoles = ['Marketing', 'HR'];
    return !restrictedRoles.includes(userRole);
  }

  /**
   * Filters workforce list by user role and assignment bounds.
   * - Recruiter: Own workforce only (assignedRecruiterId === userId or currentAssignee === userName)
   * - Team Lead: Reporting team only
   * - Staffing Admin / Finance / Super Admin: All workforce
   */
  static filterWorkforceByRole(
    items: WorkforceItem[],
    userRole: string,
    userSession: { id: string; name: string }
  ): WorkforceItem[] {
    if (userRole === 'Recruiter') {
      return items.filter(
        (item) =>
          item.recruiterId === userSession.id ||
          item.currentAssignee.toLowerCase() === userSession.name.toLowerCase()
      );
    }

    if (userRole === 'Team Lead') {
      return items.filter(
        (item) =>
          item.teamLeadId === userSession.id ||
          item.reportingTeamLead.toLowerCase() === userSession.name.toLowerCase()
      );
    }

    // Staffing Admin, Finance, Super Admin have access to all workforce records
    return items;
  }
}
