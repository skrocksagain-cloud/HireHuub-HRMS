import type { ApprovalScopeType, RoleItem, ViewScopeType } from '../../types/Admin';
import matrixSource from './full_matrix.json?raw';

type MatrixActions = Record<string, string>;
type AuthorizationMatrix = Record<string, Record<string, Record<string, MatrixActions>>>;

const authorizationMatrix = JSON.parse(matrixSource) as AuthorizationMatrix;
const RESTRICTED_MATRIX_VALUES = new Set(['', 'restricted', 'none', 'no']);

// Matrix matching intentionally permits formatting differences only.  In
// particular, role names are never expanded, inferred, or matched by prefix.
const normalize = (value: string | undefined): string => (value || '').trim().toLowerCase();

const MODULE_KEYS: Record<string, string> = {
  'associate partner': 'associatepartner',
  'campaign hub': 'campaignhub',
  'internal payroll': 'internalpayroll',
  transaction: 'transaction',
  invoice: 'invoice',
  'credit note': 'creditnote',
  'management control': 'managementcontrol',
  'calendar and events': 'calendar',
  announcement: 'announcement',
};

const modulePermissionKey = (moduleName: string): string =>
  MODULE_KEYS[normalize(moduleName)] || normalize(moduleName).replace(/[^a-z0-9]/g, '');

const canonicalModuleKey = (moduleName: string): string => {
  const key = modulePermissionKey(moduleName);
  return ({
    associatepartners: 'associatepartner',
    campaignhubs: 'campaignhub',
    transactions: 'transaction',
    invoices: 'invoice',
    creditnotes: 'creditnote',
    announcements: 'announcement',
  } as Record<string, string>)[key] || key;
};

export interface PermissionValidationResult {
  valid: boolean;
  warnings: string[];
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  module: string;
  iconName?: string;
  badge?: string;
  children?: NavigationItem[];
}

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  category: string;
  minRole?: string;
  requiredPermission?: string;
  requiredModule?: string;
}

class PermissionService {
  private simulatedRole: RoleItem | null = null;
  private evalCache = new Map<string, boolean>();

  /**
   * Clears evaluation cache on role, permission, hierarchy or workflow changes
   */
  invalidateCache(): void {
    this.evalCache.clear();
  }

  /**
   * Enterprise Permission Simulation ("Preview As Role")
   */
  setSimulatedRole(role: RoleItem | null): void {
    this.simulatedRole = role;
    this.invalidateCache();
  }

  getSimulatedRole(): RoleItem | null {
    return this.simulatedRole;
  }

  private static readonly defaultSuperRole: RoleItem = {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: '',
    permissions: ['*'],
    modules: ['dashboard', 'employees', 'recruitment', 'finance', 'marketing', 'documents', 'management'],
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

  private roleCache = new Map<string, RoleItem>();

  setMasterRoles(_roles: RoleItem[]): void {
    // Authorization is sourced solely from the embedded workbook matrix.
    this.invalidateCache();
  }

  private findMatrixDepartment(department?: string): string | undefined {
    const normalizedDepartment = normalize(department);
    return Object.keys(authorizationMatrix).find((name) => normalize(name) === normalizedDepartment);
  }

  private findMatrixRole(department: string, assignedRole: string): string | undefined {
    const roles = authorizationMatrix[department];
    return Object.keys(roles).find((role) => normalize(role) === normalize(assignedRole));
  }

  private createMatrixRole(department: string, roleName: string): RoleItem {
    const row = authorizationMatrix[department][roleName];
    const permissions: string[] = [];
    const modules: string[] = [];

    for (const [moduleName, actions] of Object.entries(row)) {
      const key = canonicalModuleKey(moduleName);
      if (normalize(roleName) === 'master admin' && key === 'managementcontrol') continue;
      const view = normalize(actions.View);
      if (!RESTRICTED_MATRIX_VALUES.has(view)) {
        modules.push(key);
        permissions.push(`${key}:view`);
      }
      for (const [action, value] of Object.entries(actions)) {
        if (action !== 'View' && !RESTRICTED_MATRIX_VALUES.has(normalize(value))) {
          permissions.push(`${key}:${normalize(action) === 'edit /modify' ? 'edit' : normalize(action)}`);
        }
      }
    }

    // Targeted authorization correction: Staffing Master Admin may view every
    // existing Workbench child without receiving non-Workbench privileges.
    if (normalize(department) === 'staffing' && normalize(roleName) === 'master admin') {
      for (const moduleName of ['client', 'associatepartner', 'openings', 'crm', 'workforce', 'campaignhub']) {
        modules.push(moduleName);
        permissions.push(`${moduleName}:view`);
      }
    }

    const viewValues = Object.values(row).map((actions) => normalize(actions.View));
    const viewScope: ViewScopeType = viewValues.includes('own')
      ? 'Own'
      : viewValues.some((value) => value.includes('team'))
        ? 'Teams'
        : viewValues.includes('department')
          ? 'Departments'
          : 'Organization';

    return {
      id: `matrix-${normalize(department).replace(/\s+/g, '-')}-${normalize(roleName).replace(/\s+/g, '-')}`,
      name: roleName,
      description: '',
      permissions,
      modules: [...new Set(modules)],
      viewScope,
      approvalScope: viewScope === 'Departments' ? 'Departments' : viewScope === 'Teams' ? 'Teams' : viewScope === 'Own' ? 'Own' : 'Organization',
      reportingScope: 'DirectReports',
      departmentIds: [],
      teamIds: [],
      employeeIds: [],
      branchIds: [],
      companyIds: [],
      department,
      isActive: true,
    };
  }

  getEffectiveRole(defaultRole?: RoleItem | string, department?: string): RoleItem {
    if (this.simulatedRole) return this.simulatedRole;
    const roleName = typeof defaultRole === 'object'
      ? defaultRole.roleName || defaultRole.name
      : defaultRole;
    const roleDepartment = department || (typeof defaultRole === 'object' ? defaultRole.department : undefined);

    if (normalize(roleName) === 'super admin') {
      return PermissionService.defaultSuperRole;
    }

    const matrixDepartment = this.findMatrixDepartment(roleDepartment);
    const matrixRole = roleName && matrixDepartment && this.findMatrixRole(matrixDepartment, roleName);
    if (matrixDepartment && matrixRole) {
      const cacheKey = `${matrixDepartment}:${matrixRole}`;
      if (!this.roleCache.has(cacheKey)) {
        this.roleCache.set(cacheKey, this.createMatrixRole(matrixDepartment, matrixRole));
      }
      return this.roleCache.get(cacheKey)!;
    }

    // No exact row means no access.  This prevents a missing department, an
    // unknown role, or Admin from silently inheriting broader permissions.
    return {
      id: 'matrix-no-access',
      name: typeof roleName === 'string' ? roleName : 'No Access',
      description: '',
      permissions: [],
      modules: [],
      viewScope: 'Own',
      approvalScope: 'Own',
      reportingScope: 'DirectReports',
      departmentIds: [],
      teamIds: [],
      employeeIds: [],
      branchIds: [],
      companyIds: [],
      department: roleDepartment,
      isActive: false,
    };
  }

  getMatrixValue(role: RoleItem | string, moduleName: string, action: string): string {
    const activeRole = this.getEffectiveRole(role);
    if (this.isSuperAdmin(activeRole)) return 'All';
    const department = this.findMatrixDepartment(activeRole.department);
    const matrixRole = department && this.findMatrixRole(department, activeRole.name);
    if (!department || !matrixRole) return 'Restricted';

    const row = authorizationMatrix[department][matrixRole];
    const matrixModule = Object.keys(row).find((name) => canonicalModuleKey(name) === canonicalModuleKey(moduleName));
    return matrixModule ? row[matrixModule][action] || 'Restricted' : 'Restricted';
  }

  /**
   * Checks if role has a permission key taking into account inheritance & conflict resolution:
   * Rule Priority: Explicit Deny > Explicit Allow > Inherited Allow > Default Deny
   */
  hasPermission(role?: RoleItem | string, permissionKey?: string): boolean {
    if (!permissionKey) return true;
    const activeRole = this.getEffectiveRole(role);
    if (!activeRole || !activeRole.permissions) return false;

    // Emergency Override Mode check
    if (activeRole.emergencyOverride?.isEnabled) {
      return true;
    }

    const perms = activeRole.permissions;

    // Explicit Deny check (e.g. '!finance:export' or 'deny:finance:export')
    if (perms.includes(`!${permissionKey}`) || perms.includes(`deny:${permissionKey}`)) {
      return false;
    }

    // Explicit Allow check
    if (perms.includes('*') || perms.includes('super_admin') || perms.includes(permissionKey)) {
      return true;
    }

    // Module wildcard check (e.g. 'finance:*')
    const [rawModule, action] = permissionKey.split(':');
    const canonicalPermission = action ? `${canonicalModuleKey(rawModule)}:${action}` : canonicalModuleKey(rawModule);
    if (perms.includes(canonicalPermission)) {
      return true;
    }

    const modulePrefix = canonicalModuleKey(rawModule);
    if (modulePrefix && perms.includes(`${modulePrefix}:*`)) {
      return true;
    }

    return false;
  }

  isSuperAdmin(role?: RoleItem | string): boolean {
    const active = this.getEffectiveRole(role);
    if (active.emergencyOverride?.isEnabled) return true;
    return active.permissions.includes('*') || active.permissions.includes('super_admin') || active.name === 'Super Admin';
  }

  /**
   * Feature Flag Engine
   */
  isFeatureEnabled(featureKey: string, role?: RoleItem | string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    if (active.featureFlags && active.featureFlags[featureKey] !== undefined) {
      return active.featureFlags[featureKey];
    }
    // Default enabled core features
    const coreFeatures = ['PEOPLE', 'RECRUITMENT', 'FINANCE', 'MARKETING', 'DOCUMENTS', 'WORKFLOWS'];
    return coreFeatures.includes(featureKey.toUpperCase());
  }

  /**
   * 1. Module Access Engine
   */
  canAccessModule(role: RoleItem | string, moduleKey: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;

    const normKey = canonicalModuleKey(moduleKey);

    // Check explicit module array if configured
    if (active.modules && active.modules.length > 0) {
      if (active.modules.includes(normKey) || active.modules.includes('*')) {
        return true;
      }
    }

    // Feature flags apply only when the matrix did not explicitly grant the module.
    if (!this.isFeatureEnabled(moduleKey.toUpperCase(), active)) {
      return false;
    }

    // Fallback permission check
    return this.hasPermission(active, `${normKey}:view`) || this.hasPermission(active, `${normKey}:read`) || this.hasPermission(active, normKey);
  }

  canAccessPage(role: RoleItem | string, pageKey: string): boolean {
    return this.hasPermission(role, pageKey) || this.hasPermission(role, `${pageKey}:view`);
  }

  canAccessRoute(role: RoleItem | string, path: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;

    const cleanPath = path.toLowerCase().trim();

    if (cleanPath === '/' || cleanPath === '/dashboard') return this.canAccessModule(active, 'dashboard');
    if (cleanPath.startsWith('/workbench') || cleanPath.startsWith('/employees') || cleanPath.startsWith('/people')) return this.canAccessModule(active, 'employees');
    if (cleanPath.startsWith('/staffing') || cleanPath.startsWith('/recruitment') || cleanPath.startsWith('/campaigns')) return this.canAccessModule(active, 'recruitment');
    if (cleanPath.startsWith('/finance') || cleanPath.startsWith('/invoices') || cleanPath.startsWith('/transactions')) return this.canAccessModule(active, 'finance');
    if (cleanPath.startsWith('/document') || cleanPath.startsWith('/templates')) return this.canAccessModule(active, 'documents');
    if (cleanPath.startsWith('/management') || cleanPath.startsWith('/settings') || cleanPath.startsWith('/admin')) return this.canAccessModule(active, 'management');

    return true;
  }

  getVisibleModules(role: RoleItem | string): string[] {
    const active = this.getEffectiveRole(role);
    const allModules = ['dashboard', 'employees', 'recruitment', 'finance', 'marketing', 'documents', 'management'];
    return allModules.filter((m) => this.canAccessModule(active, m));
  }

  getVisibleNavigation(role: RoleItem | string): NavigationItem[] {
    const active = this.getEffectiveRole(role);
    const navItems: NavigationItem[] = [
      { id: 'nav-dashboard', title: 'Dashboard', path: '/dashboard', module: 'dashboard', iconName: 'LayoutDashboard' },
      { id: 'nav-people', title: 'People', path: '/workbench/workforce', module: 'employees', iconName: 'Users' },
      { id: 'nav-staffing', title: 'Staffing Hub', path: '/workbench/staffing-hub', module: 'recruitment', iconName: 'Briefcase' },
      { id: 'nav-finance', title: 'Finance', path: '/finance/transactions', module: 'finance', iconName: 'DollarSign' },
      { id: 'nav-documents', title: 'Document Center', path: '/documents', module: 'documents', iconName: 'FileText' },
      { id: 'nav-management', title: 'Administration', path: '/management', module: 'management', iconName: 'Building2' },
    ];

    return navItems.filter((item) => this.canAccessModule(active, item.module));
  }

  getLandingModule(role: RoleItem | string): string {
    const visible = this.getVisibleModules(role);
    if (visible.includes('dashboard')) return '/dashboard';
    if (visible.length > 0) {
      const first = visible[0];
      if (first === 'employees') return '/workbench/workforce';
      if (first === 'recruitment') return '/workbench/staffing-hub';
      if (first === 'finance') return '/finance/transactions';
      if (first === 'documents') return '/documents';
      if (first === 'management') return '/management';
    }
    return '/dashboard';
  }

  /**
   * 2. Dashboard Scope Engine
   */
  getDashboardWidgets(role: RoleItem | string): string[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) {
      return [
        'org_kpis',
        'finance_summary',
        'recruitment_pipeline',
        'recruiter_score',
        'interviews',
        'staffing_calendar',
        'team_attendance',
        'invoice_status',
        'payroll_summary',
        'campaigns',
        'leads',
        'recent_audit',
        'pending_approvals',
      ];
    }

    const widgets: string[] = ['org_kpis', 'pending_approvals'];

    if (this.canAccessModule(active, 'recruitment')) {
      widgets.push('recruitment_pipeline', 'recruiter_score', 'interviews', 'staffing_calendar');
    }
    if (this.canAccessModule(active, 'finance')) {
      widgets.push('finance_summary', 'invoice_status', 'payroll_summary');
    }
    if (this.canAccessModule(active, 'employees')) {
      widgets.push('team_attendance');
    }

    return widgets;
  }

  getDashboardLayout(role: RoleItem | string): { columns: number; widgetOrder: string[] } {
    const widgets = this.getDashboardWidgets(role);
    return {
      columns: 3,
      widgetOrder: widgets,
    };
  }

  getPinnedWidgets(role: RoleItem | string): string[] {
    return this.getDashboardWidgets(role).slice(0, 4);
  }

  getDefaultDashboard(role: RoleItem | string): string {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return 'Executive Overview';
    if (this.canAccessModule(active, 'recruitment')) return 'Recruitment Command Center';
    if (this.canAccessModule(active, 'finance')) return 'Financial Dashboard';
    return 'General Operations';
  }

  /**
   * 3. Record-Level & Action Authorization Engine
   */
  canView(role: RoleItem | string, moduleKey: string, recordDeptId?: string, recordOwnerId?: string, currentUserId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;

    if (!this.hasPermission(active, `${moduleKey}:view`) && !this.hasPermission(active, `${moduleKey}:read`)) {
      return false;
    }

    const viewScope: ViewScopeType = active.viewScope || 'Organization';
    if (viewScope === 'Organization') return true;

    if (viewScope === 'Departments' && recordDeptId) {
      const depts = active.departmentScope || active.departmentIds || [];
      return depts.length === 0 || depts.includes(recordDeptId);
    }

    if (viewScope === 'Own' && recordOwnerId && currentUserId) {
      return recordOwnerId === currentUserId;
    }

    return true;
  }

  canCreate(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:create`) || this.hasPermission(role, `${moduleKey}:add`) || this.isSuperAdmin(role);
  }

  canEdit(role: RoleItem | string, moduleKey: string, recordDeptId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;

    if (!this.hasPermission(active, `${moduleKey}:edit`) && !this.hasPermission(active, `${moduleKey}:update`)) {
      return false;
    }

    const editScope = active.editScope || active.viewScope || 'Organization';
    if (editScope === 'Organization') return true;
    if (editScope === 'Departments' && recordDeptId) {
      const depts = active.departmentScope || active.departmentIds || [];
      return depts.length === 0 || depts.includes(recordDeptId);
    }
    return true;
  }

  canDelete(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:delete`) || this.isSuperAdmin(role);
  }

  canApprove(role: RoleItem | string, moduleKey: string, targetDeptId?: string, targetEmployeeId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;

    if (!this.hasPermission(active, `${moduleKey}:approve`)) {
      return false;
    }

    const approvalScope: ApprovalScopeType = active.approvalScope || 'Organization';
    if (approvalScope === 'Organization') return true;

    if (approvalScope === 'Departments' && targetDeptId) {
      const depts = active.departmentScope || active.departmentIds || [];
      return depts.length === 0 || depts.includes(targetDeptId);
    }

    if (approvalScope === 'Selected' && targetEmployeeId) {
      const emps = active.employeeScope || active.employeeIds || [];
      return emps.length === 0 || emps.includes(targetEmployeeId);
    }

    return true;
  }

  canReject(role: RoleItem | string, moduleKey: string): boolean {
    return this.canApprove(role, moduleKey);
  }

  canExport(role: RoleItem | string, moduleKey: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;

    if (active.exportScope === 'None') return false;
    return this.hasPermission(active, `${moduleKey}:export`) || this.hasPermission(active, 'export:all');
  }

  canGenerateDocument(role: RoleItem | string, documentType?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;

    if (!documentType) return this.hasPermission(active, 'documents:create') || this.hasPermission(active, 'documents:generate');

    const docName = documentType.toLowerCase();
    if (docName.includes('invoice') || docName.includes('credit')) {
      return this.canAccessModule(active, 'finance') || this.hasPermission(active, 'finance:generate');
    }
    if (docName.includes('payslip') || docName.includes('salary')) {
      return this.hasPermission(active, 'payroll:generate') || this.isSuperAdmin(active);
    }
    if (docName.includes('offer') || docName.includes('appointment')) {
      return this.canAccessModule(active, 'recruitment') || this.hasPermission(active, 'recruitment:generate');
    }

    return this.hasPermission(active, 'documents:create') || this.hasPermission(active, 'documents:generate');
  }

  canManage(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:manage`) || this.isSuperAdmin(role);
  }

  canAssign(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:assign`) || this.isSuperAdmin(role);
  }

  canTransfer(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:transfer`) || this.isSuperAdmin(role);
  }

  canRestore(role: RoleItem | string, moduleKey: string): boolean {
    return this.hasPermission(role, `${moduleKey}:restore`) || this.isSuperAdmin(role);
  }

  /**
   * 4. Central Data Filtering APIs
   */
  getVisibleEmployees<T extends { departmentId?: string; id?: string; employeeId?: string }>(
    role: RoleItem | string,
    employees: T[],
    currentUserId?: string
  ): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.viewScope === 'Organization') {
      return employees;
    }

    const depts = active.departmentScope || active.departmentIds || [];
    if (active.viewScope === 'Departments' && depts.length > 0) {
      return employees.filter((e) => e.departmentId && depts.includes(e.departmentId));
    }

    if (active.viewScope === 'Own' && currentUserId) {
      return employees.filter((e) => e.id === currentUserId || e.employeeId === currentUserId);
    }

    const selectedEmps = active.employeeScope || active.employeeIds || [];
    if (selectedEmps.length > 0) {
      return employees.filter((e) => (e.id && selectedEmps.includes(e.id)) || (e.employeeId && selectedEmps.includes(e.employeeId)));
    }

    return employees;
  }

  getVisibleCandidates<T extends { departmentId?: string; assignedRecruiterId?: string }>(
    role: RoleItem | string,
    candidates: T[],
    currentUserId?: string
  ): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.viewScope === 'Organization' || active.candidateScope === 'Organization') {
      return candidates;
    }

    const depts = active.departmentScope || active.departmentIds || [];
    if ((active.viewScope === 'Departments' || active.candidateScope === 'Departments') && depts.length > 0) {
      return candidates.filter((c) => c.departmentId && depts.includes(c.departmentId));
    }

    if ((active.viewScope === 'Assigned' || active.candidateScope === 'Assigned') && currentUserId) {
      return candidates.filter((c) => c.assignedRecruiterId === currentUserId);
    }

    return candidates;
  }

  getVisibleClients<T extends { id?: string; clientId?: string }>(role: RoleItem | string, clients: T[]): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.viewScope === 'Organization') {
      return clients;
    }
    return clients;
  }

  getVisibleDepartments<T extends { id: string }>(role: RoleItem | string, departments: T[]): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.viewScope === 'Organization') {
      return departments;
    }
    const depts = active.departmentScope || active.departmentIds || [];
    if (depts.length > 0) {
      return departments.filter((d) => depts.includes(d.id));
    }
    return departments;
  }

  getVisibleDocuments<T extends { category?: string; createdBy?: string }>(role: RoleItem | string, documents: T[], currentUserId?: string): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.documentScope === 'Organization') {
      return documents;
    }
    if (active.documentScope === 'Own' && currentUserId) {
      return documents.filter((d) => d.createdBy === currentUserId);
    }
    return documents;
  }

  getVisibleInvoices<T extends { id?: string; clientId?: string }>(role: RoleItem | string, invoices: T[]): T[] {
    const active = this.getEffectiveRole(role);
    if (!this.canAccessModule(active, 'finance')) return [];
    return invoices;
  }

  getVisibleAttendance<T extends { employeeId?: string; departmentId?: string }>(role: RoleItem | string, attendance: T[], currentUserId?: string): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.attendanceScope === 'Organization') {
      return attendance;
    }
    if (active.attendanceScope === 'Own' && currentUserId) {
      return attendance.filter((a) => a.employeeId === currentUserId);
    }
    return attendance;
  }

  getVisibleLeaves<T extends { employeeId?: string; departmentId?: string }>(role: RoleItem | string, leaves: T[], currentUserId?: string): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.leaveScope === 'Organization') {
      return leaves;
    }
    if (active.leaveScope === 'Own' && currentUserId) {
      return leaves.filter((l) => l.employeeId === currentUserId);
    }
    return leaves;
  }

  getVisiblePerformance<T extends { employeeId?: string }>(role: RoleItem | string, reviews: T[], currentUserId?: string): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.performanceScope === 'Organization') {
      return reviews;
    }
    if (active.performanceScope === 'Own' && currentUserId) {
      return reviews.filter((r) => r.employeeId === currentUserId);
    }
    return reviews;
  }

  getVisibleRecruitment<T extends { assignedRecruiterId?: string }>(role: RoleItem | string, items: T[], currentUserId?: string): T[] {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active) || active.recruitmentScope === 'Organization') {
      return items;
    }
    if (active.recruitmentScope === 'Assigned' && currentUserId) {
      return items.filter((i) => i.assignedRecruiterId === currentUserId);
    }
    return items;
  }

  /**
   * 13. Calendar Authorization Foundation
   */
  canAccessCalendar(role: RoleItem | string): boolean {
    const active = this.getEffectiveRole(role);
    return this.hasPermission(active, 'calendar:view') || this.isSuperAdmin(active);
  }

  canManageCalendar(role: RoleItem | string): boolean {
    const active = this.getEffectiveRole(role);
    return this.hasPermission(active, 'calendar:manage') || this.isSuperAdmin(active);
  }

  // Domain specific helpers for backward compatibility
  canAccessFinance(role?: RoleItem | string): boolean {
    return this.canAccessModule(role || 'current', 'finance');
  }

  canWriteFinance(role?: RoleItem | string): boolean {
    return this.canCreate(role || 'current', 'finance') || this.canEdit(role || 'current', 'finance');
  }

  canReadFinanceReports(role?: RoleItem | string): boolean {
    return this.canExport(role || 'current', 'finance');
  }

  canApproveAttendance(role?: RoleItem | string): boolean {
    return this.canApprove(role || 'current', 'attendance');
  }

  canViewOrganizationAttendance(role?: RoleItem | string): boolean {
    return this.canView(role || 'current', 'attendance');
  }

  canApproveLeave(role?: RoleItem | string): boolean {
    return this.canApprove(role || 'current', 'leave');
  }

  canViewLeave(role?: RoleItem | string): boolean {
    return this.canView(role || 'current', 'leave');
  }

  canManageLeaveBalances(role?: RoleItem | string): boolean {
    return this.canApprove(role || 'current', 'leave');
  }

  canUploadDocument(role?: RoleItem | string): boolean {
    return this.canCreate(role || 'current', 'documents');
  }

  canArchiveDocument(role?: RoleItem | string): boolean {
    return this.canDelete(role || 'current', 'documents');
  }

  canDeleteDocument(role?: RoleItem | string): boolean {
    return this.canDelete(role || 'current', 'documents');
  }

  canManageCampaignHub(role?: RoleItem | string): boolean {
    return this.canManage(role || 'current', 'recruitment');
  }

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

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }
}

export const permissionService = new PermissionService();

