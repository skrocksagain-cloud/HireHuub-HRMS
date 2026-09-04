export type CanonicalRole = 'User' | 'Admin' | 'Master Admin' | 'Super Admin';

export interface CanonicalAuthorizationIdentity {
  employeeId: string;
  firebaseUid: string;
  departmentId: string | null;
  department: string | null;
  role: CanonicalRole;
  reportingManagerId: string | null;
}

export function resolveAuthorizationIdentity(
  employeeData: any,
  firebaseUid: string
): CanonicalAuthorizationIdentity {
  // Management Control (assignedRole) is the definitive authority over the authorization role
  const explicitAssigned = employeeData.assignedRole ? String(employeeData.assignedRole).trim().toLowerCase() : '';

  let canonicalRole: CanonicalRole = 'User';

  if (explicitAssigned === 'super admin' || explicitAssigned === 'super_admin') {
    canonicalRole = 'Super Admin';
  } else if (explicitAssigned === 'master admin') {
    canonicalRole = 'Master Admin';
  } else if (explicitAssigned === 'admin') {
    canonicalRole = 'Admin';
  }
  
  return {
    employeeId: employeeData.employeeId,
    firebaseUid,
    departmentId: employeeData.departmentId || null,
    department: employeeData.department || null,
    role: canonicalRole,
    reportingManagerId: employeeData.reportingManagerId || null,
  };
}

export type AuthorizationScope = 'SELF' | 'SELF_AND_DIRECT_REPORTS' | 'DEPARTMENT' | 'GLOBAL';

export function getAuthorizationScope(role?: string | null): AuthorizationScope {
  switch (role) {
    case 'Super Admin':
      return 'GLOBAL';
    case 'Master Admin':
      return 'DEPARTMENT';
    case 'Admin':
      return 'SELF_AND_DIRECT_REPORTS';
    case 'User':
    default:
      return 'SELF';
  }
}

export type SimplifiedModuleScope = 'SELF' | 'DEPARTMENT' | 'GLOBAL';

export function getSimplifiedModuleScope(role?: string | null): SimplifiedModuleScope {
  const scope = getAuthorizationScope(role);
  if (scope === 'SELF_AND_DIRECT_REPORTS' || scope === 'DEPARTMENT') {
    return 'DEPARTMENT';
  }
  if (scope === 'GLOBAL') {
    return 'GLOBAL';
  }
  return 'SELF';
}
