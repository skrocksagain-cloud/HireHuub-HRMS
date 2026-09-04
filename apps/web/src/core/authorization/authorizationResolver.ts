/**
 * TEMPORARY AUTHORIZATION BYPASS
 * ==========================================
 * Purpose:
 * - Keep Firebase Authentication working.
 * - Keep user identity available.
 * - Disable all ERP authorization restrictions.
 * - Allow every logged-in user to access all modules and data.
 *
 * IMPORTANT:
 * This is temporary development mode.
 * Real authorization can be restored later.
 */

// ============================================================================
// TYPES
// ============================================================================

export type CanonicalRole =
  | 'User'
  | 'Admin'
  | 'Master Admin'
  | 'Super Admin';

export type ErpArea =
  | 'People'
  | 'Workbench'
  | 'Finance'
  | 'Administration';

export type AuthorizationScope =
  | 'OWN'
  | 'DIRECT_REPORTS'
  | 'DEPARTMENT'
  | 'GLOBAL';

export type SimplifiedModuleScope =
  | 'SELF'
  | 'DEPARTMENT'
  | 'GLOBAL';

export type LegacyAuthorizationScope =
  | 'SELF'
  | 'SELF_AND_DIRECT_REPORTS'
  | 'DEPARTMENT'
  | 'GLOBAL';

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


// ============================================================================
// TEMPORARY BYPASS MODE
// ============================================================================

export const AUTHORIZATION_ENABLED = false;


// ============================================================================
// ROLE RESOLUTION
// ============================================================================

export function getCanonicalRole(role?: string): CanonicalRole {
  if (!role) return 'User';

  const normalized = role.trim().toLowerCase();

  if (
    normalized === 'super admin' ||
    normalized === 'super_admin'
  ) {
    return 'Super Admin';
  }

  if (
    normalized === 'master admin' ||
    normalized === 'master_admin'
  ) {
    return 'Master Admin';
  }

  if (normalized === 'admin') {
    return 'Admin';
  }

  return 'User';
}


// ============================================================================
// AUTHORIZATION IDENTITY
// ============================================================================

export function resolveAuthorizationIdentity(
  employeeData: any,
  firebaseUid: string
): CanonicalAuthorizationIdentity {

  return {
    employeeId:
      employeeData?.employeeId ||
      employeeData?.id ||
      firebaseUid,

    firebaseUid,

    departmentId:
      employeeData?.departmentId || null,

    department:
      employeeData?.department || null,

    role:
      getCanonicalRole(employeeData?.assignedRole),

    reportingManagerId:
      employeeData?.reportingManagerId || null,
  };
}


// ============================================================================
// AUTHORIZATION SCOPE
//
// TEMPORARY:
// Everything is GLOBAL.
// ============================================================================

export function getAuthorizationScope(
  _actor?: AuthorizationContext | string | null
): AuthorizationScope {

  if (!AUTHORIZATION_ENABLED) {
    return 'GLOBAL';
  }

  return 'GLOBAL';
}


// ============================================================================
// SUPER ADMIN CHECK
//
// Temporary:
// Return true so legacy components that depend on this
// do not get blocked.
// ============================================================================

export function isSuperAdmin(
  _actor?: AuthorizationContext
): boolean {

  if (!AUTHORIZATION_ENABLED) {
    return true;
  }

  return false;
}


// ============================================================================
// EMPLOYEE ACCESS
// ============================================================================

export function isSameDepartment(
  _actor: AuthorizationContext,
  _target: AuthorizationContext
): boolean {

  if (!AUTHORIZATION_ENABLED) {
    return true;
  }

  return true;
}


export function isDirectReport(
  _actor: AuthorizationContext,
  _target: AuthorizationContext
): boolean {

  if (!AUTHORIZATION_ENABLED) {
    return true;
  }

  return true;
}


export function canAccessEmployee(
  _actor: AuthorizationContext,
  _target: AuthorizationContext
): boolean {

  return true;
}


// ============================================================================
// ERP AREA ACCESS
//
// TEMPORARY:
// Everyone can access every ERP area.
// ============================================================================

export function canAccessErpArea(
  _actor: AuthorizationContext,
  _area: ErpArea
): boolean {

  return true;
}


// ============================================================================
// SIMPLIFIED MODULE SCOPE
// ============================================================================

export function getSimplifiedModuleScope(
  _role?: string | null
): SimplifiedModuleScope {

  return 'GLOBAL';
}