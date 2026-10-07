export type CanonicalRole = 'User' | 'Admin' | 'Master Admin' | 'Super Admin';

export type AuthorizationScope = 'OWN' | 'GLOBAL' | string;
export type SimplifiedModuleScope = 'SELF' | 'GLOBAL' | string;

export type ErpArea = 'People' | 'Workbench' | 'Finance' | 'Administration';

export interface AuthorizationContext {
  employeeId?: string;
  assignedRole?: string;
}

export interface CanonicalAuthorizationIdentity {
  employeeId: string;
  firebaseUid: string;
  role: CanonicalRole;
}

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
  const employeeId = employeeData?.employeeId;
  if (!employeeId) {
    return {
      employeeId: '',
      firebaseUid,
      role: 'User'
    };
  }
  return {
    employeeId,
    firebaseUid,
    role: getCanonicalRole(employeeData?.assignedRole)
  };
}

export function getAuthorizationScope(role?: string | null, area?: ErpArea): AuthorizationScope {
  const canonicalRole = getCanonicalRole(role || undefined);
  if (canonicalRole === 'Super Admin' || canonicalRole === 'Master Admin') return 'GLOBAL';
  if (canonicalRole === 'Admin') {
     if (area === 'People') return 'OWN';
     return 'GLOBAL';
  }
  return 'OWN';
}

export function getSimplifiedModuleScope(role?: string | null, area?: ErpArea): SimplifiedModuleScope {
  const scope = getAuthorizationScope(role, area);
  if (scope === 'GLOBAL') return 'GLOBAL';
  return 'SELF';
}

export function isSuperAdmin(actor?: AuthorizationContext): boolean {
  return getCanonicalRole(actor?.assignedRole) === 'Super Admin';
}

export function canAccessModule(actor: AuthorizationContext, moduleKey: string): boolean {
  const role = getCanonicalRole(actor.assignedRole);
  const m = (moduleKey || '').toLowerCase();

  if (role === 'Super Admin') return true;

  if (role === 'Master Admin') {
    if (['administration', 'managementcontrol', 'management', 'calendar', 'announcements', 'settings', 'organization'].includes(m)) return false;
    return true;
  }

  if (role === 'Admin') {
    if (m === 'dashboard') return true;
    if (['attendance', 'leave', 'performance', 'profile', 'people', 'employees'].includes(m)) return true;
    if (['staffinghub', 'staffing-hub', 'staffing hub', 'workbench', 'openings', 'crm', 'workforce'].includes(m)) return true;
    return false;
  }

  if (role === 'User') {
    if (m === 'dashboard') return true;
    if (['attendance', 'leave', 'performance', 'profile', 'people', 'employees'].includes(m)) return true;
    if (['crm', 'workforce', 'workbench'].includes(m)) return true;
    return false;
  }

  return false;
}

export function hasApprovalAuthority(actorRole: string, targetRole: string): boolean {
  const actorCanonical = getCanonicalRole(actorRole);
  const targetCanonical = getCanonicalRole(targetRole);
  return ROLE_RANK[actorCanonical] >= ROLE_RANK[targetCanonical];
}

export function canAccessEmployee(actor: AuthorizationContext, target: AuthorizationContext): boolean {
  if (!actor.employeeId) return false;
  const role = getCanonicalRole(actor.assignedRole);
  if (role === 'Super Admin' || role === 'Master Admin') return true;
  return actor.employeeId === target.employeeId;
}

export function canViewEmployee(actor: AuthorizationContext, target: AuthorizationContext): boolean {
  return canAccessEmployee(actor, target);
}

export function canEditEmployee(actor: AuthorizationContext, target: AuthorizationContext): boolean {
  return canAccessEmployee(actor, target);
}

export function canAssignToEmployee(actor: AuthorizationContext, _target: AuthorizationContext): boolean {
  if (!actor.employeeId) return false;
  const role = getCanonicalRole(actor.assignedRole);
  if (role === 'Super Admin' || role === 'Master Admin') return true;
  if (role === 'Admin') return true; 
  return false;
}

export function canReassignBetweenEmployees(actor: AuthorizationContext, _source: AuthorizationContext, _target: AuthorizationContext): boolean {
  if (!actor.employeeId) return false;
  const role = getCanonicalRole(actor.assignedRole);
  if (role === 'Super Admin' || role === 'Master Admin' || role === 'Admin') return true;
  return false;
}

export function canAccessErpArea(actor: AuthorizationContext, area: ErpArea): boolean {
  const role = getCanonicalRole(actor.assignedRole);
  if (role === 'Super Admin') return true;
  if (role === 'Master Admin') return area !== 'Administration';
  if (role === 'Admin' || role === 'User') return area === 'People' || area === 'Workbench';
  return false;
}

