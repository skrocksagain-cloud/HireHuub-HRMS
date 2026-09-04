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
   */
  static canAccessWorkforce(userRole: string): boolean {
    // We allow Finance temporarily for backwards compatibility/uploads if needed, but per requirements we focus on the main 4.
    // The requirement says: "Marketing and other unauthorized users must not gain Workforce access."
    const restrictedRoles = ['Marketing', 'HR'];
    return !restrictedRoles.includes(userRole);
  }

  /**
   * Filters workforce list by user role and assignment bounds.
   * EMPLOYEE: Own candidates only
   * ADMIN: Own candidates + candidates assigned to them
   * MASTER ADMIN: Candidates belonging to their department
   * SUPER ADMIN: All candidates
   */
  static filterWorkforceByRole(
    items: WorkforceItem[],
    userRole: string,
    userSession: { id: string; name: string; teamId?: string; departmentId?: string }
  ): WorkforceItem[] {
    const role = userRole || 'Employee';

    if (role === 'Super Admin' || role === 'Finance') {
      return items;
    }

    if (role === 'Master Admin') {
      return items.filter(
        (item) => userSession.departmentId && item.departmentId === userSession.departmentId
      );
    }

    if (role === 'Admin') {
      return items.filter(
        (item) =>
          item.recruiterId === userSession.id ||
          item.teamLeadId === userSession.id ||
          (userSession.teamId && item.teamId === userSession.teamId)
      );
    }

    // Default to EMPLOYEE
    return items.filter((item) => item.recruiterId === userSession.id);
  }
}
