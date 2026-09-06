export type CanonicalRole = 'User' | 'Admin' | 'Master Admin' | 'Super Admin';

export type AuthorizationScope = 'OWN' | 'TEAM' | 'DEPARTMENT' | 'GLOBAL' | 'SELF' | 'DIRECT_REPORTS';
export type SimplifiedModuleScope = 'SELF' | 'DEPARTMENT' | 'GLOBAL' | 'OWN' | 'TEAM';
export type LegacyAuthorizationScope = 'SELF' | 'SELF_AND_DIRECT_REPORTS' | 'DEPARTMENT' | 'GLOBAL';

export type ErpArea = 'People' | 'Workbench' | 'Finance' | 'Administration';

export interface AuthorizationContext {
  employeeId?: string;
  departmentId?: string;
  department?: string;
  assignedRole?: string;
  reportingManagerId?: string;
}

export interface CanonicalAuthorizationIdentity {
  employeeId: string;
  firebaseUid: string;
  departmentId: string | null;
  department: string | null;
  role: CanonicalRole;
  reportingManagerId: string | null;
}

export const AUTHORIZATION_ENABLED = true;

export const ROLE_RANK: Record<CanonicalRole, number> = {
  'User': 1,
  'Admin': 2,
  'Master Admin': 3,
  'Super Admin': 4,
};

export function getCanonicalRole(role?: string): CanonicalRole {
  if (!role) return 'User';
  const normalized = role.trim().toLowerCase();
  if (normalized === 'super admin' || normalized === 'super_admin') return 'Super Admin';
  if (normalized === 'master admin' || normalized === 'master_admin') return 'Master Admin';
  if (normalized === 'admin') return 'Admin';
  return 'User';
}

export function resolveAuthorizationIdentity(
  employeeData: any,
  firebaseUid: string
): CanonicalAuthorizationIdentity {
  return {
    employeeId: employeeData?.employeeId || employeeData?.id || firebaseUid,
    firebaseUid,
    departmentId: employeeData?.departmentId || null,
    department: employeeData?.department || null,
    role: getCanonicalRole(employeeData?.assignedRole),
    reportingManagerId: employeeData?.reportingManagerId || null,
  };
}

export function getAuthorizationScope(role?: string | null): AuthorizationScope {
  if (!AUTHORIZATION_ENABLED) return 'GLOBAL';
  const canonicalRole = getCanonicalRole(role || undefined);
  switch (canonicalRole) {
    case 'Super Admin': return 'GLOBAL';
    case 'Master Admin': return 'DEPARTMENT';
    case 'Admin': return 'TEAM';
    default: return 'OWN';
  }
}

export function getSimplifiedModuleScope(role?: string | null): SimplifiedModuleScope {
  const scope = getAuthorizationScope(role);
  if (scope === 'OWN' || scope === 'SELF') return 'SELF';
  if (scope === 'TEAM') return 'TEAM';
  if (scope === 'DEPARTMENT') return 'DEPARTMENT';
  if (scope === 'GLOBAL') return 'GLOBAL';
  return 'SELF';
}

export function isSuperAdmin(actor?: AuthorizationContext): boolean {
  if (!AUTHORIZATION_ENABLED) return true;
  return getCanonicalRole(actor?.assignedRole) === 'Super Admin';
}

export function canAccessModule(actor: AuthorizationContext, moduleKey: string): boolean {
  if (!AUTHORIZATION_ENABLED) return true;
  const dept = (actor.department || '').trim().toLowerCase();
  if (dept === 'management') return true;

  const m = (moduleKey || '').toLowerCase();

  // General / All
  if (['attendance', 'leave', 'performance', 'profile'].includes(m)) return true;

  if (dept === 'hr') {
    if (['employees', 'people', 'recruitment'].includes(m)) return true;
  }

  if (dept === 'marketing') {
    if (['clients', 'client'].includes(m)) return true;
  }

  if (dept === 'staffing') {
    if (['associatepartner', 'associate partners', 'associate_partners', 'associate-partners', 'openings', 'crm', 'workforce', 'campaignhub', 'campaign-hub', 'campaign hub'].includes(m)) return true;
  }

  if (dept === 'finance') {
    if (['finance', 'invoices', 'creditnotes', 'credit-notes', 'internalpayroll', 'payroll', 'transactions', 'payout'].includes(m)) return true;
  }

  if (dept === 'admin') {
    if (['administration', 'managementcontrol', 'management', 'calendar', 'announcements', 'settings', 'organization'].includes(m)) return true;
  }

  // Dashboard is accessible to all
  if (m === 'dashboard') return true;

  return false;
}

export function hasApprovalAuthority(actorRole: string, targetRole: string): boolean {
  const actorCanonical = getCanonicalRole(actorRole);
  const targetCanonical = getCanonicalRole(targetRole);
  return ROLE_RANK[actorCanonical] >= ROLE_RANK[targetCanonical];
}

export function isDirectReportingManager(actorEmployeeId?: string | null, targetReportingManagerId?: string | null): boolean {
  if (!actorEmployeeId || !targetReportingManagerId) return false;
  return actorEmployeeId === targetReportingManagerId;
}

export function isDirectReport(actor: AuthorizationContext, target: AuthorizationContext): boolean {
  if (!AUTHORIZATION_ENABLED) return true;
  return target.reportingManagerId === actor.employeeId;
}

export function isSameDepartment(actor: AuthorizationContext, target: AuthorizationContext): boolean {
  if (!AUTHORIZATION_ENABLED) return true;
  return !!actor.department && actor.department === target.department;
}

export function canAccessEmployee(actor: AuthorizationContext, target: AuthorizationContext): boolean {
  if (!AUTHORIZATION_ENABLED) return true;

  const scope = getAuthorizationScope(actor.assignedRole);

  if (scope === 'GLOBAL') return true;
  if (scope === 'DEPARTMENT') return isSameDepartment(actor, target);
  if (scope === 'TEAM') {
    return actor.employeeId === target.employeeId || isDirectReport(actor, target);
  }
  return actor.employeeId === target.employeeId;
}

export function canAccessErpArea(
  actor: AuthorizationContext,
  area: ErpArea
): boolean {
  if (!AUTHORIZATION_ENABLED) return true;
  const dept = (actor.department || '').trim().toLowerCase();
  if (dept === 'management') return true;

  if (area === 'People' && dept === 'hr') return true;
  if (area === 'Workbench' && ['staffing', 'marketing'].includes(dept)) return true;
  if (area === 'Finance' && dept === 'finance') return true;
  if (area === 'Administration' && dept === 'admin') return true;

  return false;
}