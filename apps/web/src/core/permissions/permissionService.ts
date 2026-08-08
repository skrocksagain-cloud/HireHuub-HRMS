import type { ApprovalScopeType, RoleItem, ViewScopeType } from '../../types/Admin';

export interface PermissionValidationResult {
  valid: boolean;
  warnings: string[];
}

class PermissionService {
  private simulatedRole: RoleItem | null = null;

  /**
   * Enterprise Permission Simulation ("Preview As Role")
   */
  setSimulatedRole(role: RoleItem | null): void {
    this.simulatedRole = role;
  }

  getSimulatedRole(): RoleItem | null {
    return this.simulatedRole;
  }

  getEffectiveRole(defaultRole?: RoleItem | string): RoleItem {
    if (this.simulatedRole) return this.simulatedRole;
    if (typeof defaultRole === 'object' && defaultRole) return defaultRole;

    // Fallback default role object if string or undefined
    return {
      id: 'role-current',
      name: typeof defaultRole === 'string' ? defaultRole : 'Current Role',
      description: '',
      permissions: typeof defaultRole === 'string' ? [defaultRole] : ['*'],
      viewScope: 'Organization',
      approvalScope: 'Organization',
      reportingScope: 'DirectReports',
      departmentIds: [],
      teamIds: [],
      employeeIds: [],
      branchIds: [],
      companyIds: [],
      isActive: true,
    };
  }

  /**
   * Dependency Validation for Role Permissions
   */
  validatePermissionDependencies(permissions: string[]): PermissionValidationResult {
    const warnings: string[] = [];
    const set = new Set(permissions);

    if (set.has('*') || set.has('super_admin')) {
      return { valid: true, warnings: [] };
    }

    if (set.has('leave:approve') && !set.has('leave:view')) {
      warnings.push("Permission Warning: 'Approve Leave' should be paired with 'View Leave'.");
    }
    if (set.has('payroll:generate') && !set.has('payroll:view')) {
      warnings.push("Permission Warning: 'Generate Payslips' requires 'View Payroll'.");
    }
    if (set.has('finance:create') && !set.has('finance:view')) {
      warnings.push("Permission Warning: 'Create Invoice/Finance' requires 'View Finance'.");
    }
    if (set.has('employees:delete') && !set.has('employees:view')) {
      warnings.push("Permission Warning: 'Delete Employee' requires 'View Employees'.");
    }
    if (set.has('recruitment:approve') && !set.has('recruitment:view')) {
      warnings.push("Permission Warning: 'Approve Recruitment' requires 'View Recruitment'.");
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Checks if role has permission key
   */
  hasPermission(role?: RoleItem | string, permissionKey?: string): boolean {
    if (!permissionKey) return true;
    const activeRole = this.getEffectiveRole(role);
    if (!activeRole || !activeRole.permissions) return false;

    if (activeRole.permissions.includes('*') || activeRole.permissions.includes('super_admin')) {
      return true;
    }

    return activeRole.permissions.includes(permissionKey);
  }

  isSuperAdmin(role?: RoleItem | string): boolean {
    const active = this.getEffectiveRole(role);
    return active.permissions.includes('*') || active.permissions.includes('super_admin') || active.name === 'Super Admin';
  }

  // Domain specific helpers for backward compatibility
  canAccessFinance(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'finance:view') || this.isSuperAdmin(role);
  }

  canWriteFinance(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'finance:create') || this.hasPermission(role, 'finance:edit') || this.isSuperAdmin(role);
  }

  canReadFinanceReports(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'finance:export') || this.isSuperAdmin(role);
  }

  canApproveAttendance(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'attendance:approve') || this.isSuperAdmin(role);
  }

  canViewOrganizationAttendance(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'attendance:view') || this.isSuperAdmin(role);
  }

  canApproveLeave(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'leave:approve') || this.isSuperAdmin(role);
  }

  canViewLeave(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'leave:view') || this.isSuperAdmin(role);
  }

  canManageLeaveBalances(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'leave:approve') || this.isSuperAdmin(role);
  }

  canUploadDocument(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'documents:upload') || this.isSuperAdmin(role);
  }

  canArchiveDocument(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'documents:delete') || this.isSuperAdmin(role);
  }

  canDeleteDocument(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'documents:delete') || this.isSuperAdmin(role);
  }

  canManageCampaignHub(role?: RoleItem | string): boolean {
    return this.hasPermission(role, 'recruitment:create') || this.isSuperAdmin(role);
  }

  /**
   * Helper action checks
   */
  canView(role: RoleItem | string, moduleKey: string, recordDeptId?: string, recordOwnerId?: string, currentUserId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (!this.hasPermission(active, `${moduleKey}:view`) && !this.hasPermission(active, `${moduleKey}:read`)) {
      return false;
    }

    if (active.permissions.includes('*')) return true;

    const viewScope: ViewScopeType = active.viewScope || 'Organization';
    if (viewScope === 'Organization') return true;

    if (viewScope === 'Departments') {
      if (!recordDeptId) return true;
      return active.departmentIds.length === 0 || active.departmentIds.includes(recordDeptId);
    }

    if (viewScope === 'Own') {
      if (!recordOwnerId || !currentUserId) return true;
      return recordOwnerId === currentUserId;
    }

    return true;
  }

  canApprove(role: RoleItem | string, moduleKey: string, targetDeptId?: string, targetEmployeeId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (!this.hasPermission(active, `${moduleKey}:approve`)) {
      return false;
    }

    if (active.permissions.includes('*')) return true;

    const approvalScope: ApprovalScopeType = active.approvalScope || 'Organization';
    if (approvalScope === 'Organization') return true;

    if (approvalScope === 'Departments') {
      if (!targetDeptId) return true;
      return active.departmentIds.length === 0 || active.departmentIds.includes(targetDeptId);
    }

    if (approvalScope === 'Selected') {
      if (!targetEmployeeId) return true;
      return active.employeeIds.length === 0 || active.employeeIds.includes(targetEmployeeId);
    }

    return true;
  }

  canCreate(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:create`) || this.hasPermission(role, `${moduleKey}:add`);
  }

  canEdit(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:edit`) || this.hasPermission(role, `${moduleKey}:update`);
  }

  canDelete(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:delete`);
  }

  canExport(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:export`);
  }

  canManage(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:manage`) || this.hasPermission(role, '*');
  }

  getApprovalScope(role: RoleItem | string): ApprovalScopeType {
    return this.getEffectiveRole(role).approvalScope || 'Organization';
  }

  getDepartmentScope(role: RoleItem | string): string[] {
    return this.getEffectiveRole(role).departmentIds || [];
  }

  /**
   * Filter list of employees based on Role Data Access Scope
   */
  getVisibleEmployees<T extends { departmentId?: string; id?: string; employeeId?: string }>(
    role: RoleItem | string,
    employees: T[],
    currentUserId?: string
  ): T[] {
    const active = this.getEffectiveRole(role);
    if (active.permissions.includes('*') || active.viewScope === 'Organization') {
      return employees;
    }

    if (active.viewScope === 'Departments' && active.departmentIds.length > 0) {
      return employees.filter((e) => e.departmentId && active.departmentIds.includes(e.departmentId));
    }

    if (active.viewScope === 'Own' && currentUserId) {
      return employees.filter((e) => e.id === currentUserId || e.employeeId === currentUserId);
    }

    return employees;
  }

  /**
   * Filter list of candidates based on Role Data Access Scope
   */
  getVisibleCandidates<T extends { departmentId?: string; assignedRecruiterId?: string }>(
    role: RoleItem | string,
    candidates: T[],
    currentUserId?: string
  ): T[] {
    const active = this.getEffectiveRole(role);
    if (active.permissions.includes('*') || active.viewScope === 'Organization') {
      return candidates;
    }

    if (active.viewScope === 'Departments' && active.departmentIds.length > 0) {
      return candidates.filter((c) => c.departmentId && active.departmentIds.includes(c.departmentId));
    }

    if (active.viewScope === 'Assigned' && currentUserId) {
      return candidates.filter((c) => c.assignedRecruiterId === currentUserId);
    }

    return candidates;
  }
}

export const permissionService = new PermissionService();
