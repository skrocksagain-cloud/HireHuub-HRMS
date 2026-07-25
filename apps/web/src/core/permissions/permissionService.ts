export type PermissionRole = 'Employee' | 'Team Leader' | 'Manager' | 'HR' | 'Accounts' | 'Admin' | 'Finance' | 'Super Admin' | 'Recruiter';

const normalizeRole = (role: string): PermissionRole => {
  const roles: PermissionRole[] = ['Employee', 'Team Leader', 'Manager', 'HR', 'Accounts', 'Admin', 'Finance', 'Super Admin', 'Recruiter'];
  return roles.includes(role as PermissionRole) ? role as PermissionRole : 'Employee';
};

class PermissionService {
  canViewAttendance(role: string, actorEmployeeId: string, targetEmployeeId: string): boolean {
    const normalizedRole = normalizeRole(role);
    return actorEmployeeId === targetEmployeeId || ['Team Leader', 'Manager', 'HR', 'Admin', 'Finance', 'Super Admin'].includes(normalizedRole);
  }

  canApproveAttendance(role: string): boolean {
    return ['Admin', 'Super Admin'].includes(normalizeRole(role));
  }

  canViewOrganizationAttendance(role: string): boolean {
    return ['Admin', 'Finance', 'Super Admin'].includes(normalizeRole(role));
  }

  canViewLeave(role: string, actorEmployeeId: string, targetEmployeeId: string): boolean {
    return this.canViewAttendance(role, actorEmployeeId, targetEmployeeId);
  }

  canApproveLeave(role: string): boolean {
    return ['Admin', 'Super Admin'].includes(normalizeRole(role));
  }

  canManageLeaveBalances(role: string): boolean {
    return ['Admin', 'Super Admin'].includes(normalizeRole(role));
  }

  canViewFinance(role: string): boolean {
    return ['Finance', 'Super Admin'].includes(normalizeRole(role));
  }
}

export const permissionService = new PermissionService();
