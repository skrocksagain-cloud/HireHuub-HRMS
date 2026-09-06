import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  canAccessModule as checkModuleAccess,
  isSuperAdmin as checkSuperAdmin,
  type AuthorizationContext
} from '../core/authorization/authorizationResolver';

export function usePermissions() {
  const { user } = useAuth();

  const authContext: AuthorizationContext = useMemo(() => ({
    employeeId: user?.employeeId,
    departmentId: user?.departmentId,
    department: user?.department,
    assignedRole: user?.assignedRole,
    reportingManagerId: user?.reportingManagerId
  }), [user]);

  const activeRole = useMemo(() => ({ name: user?.assignedRole || 'User' }), [user]);
  const simulatedRole = null as { name: string } | null;
  const setSimulatedRole = useCallback(() => {}, []);
  const visibleModules = useMemo(() => [], []);
  const visibleNavigation = useMemo(() => [], []);
  const dashboardWidgets = useMemo(() => [], []);

  const canAccessModule = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const canAccessPage = useCallback((pageKey: string) => {
    return checkModuleAccess(authContext, pageKey);
  }, [authContext]);

  const canAccessRoute = useCallback((path: string) => {
    const p = (path || '').toLowerCase();

    if (p.includes('workbench')) {
      if (p.includes('client')) return checkModuleAccess(authContext, 'clients');
      if (p.includes('associate')) return checkModuleAccess(authContext, 'associatepartner');
      if (p.includes('openings')) return checkModuleAccess(authContext, 'openings');
      if (p.includes('crm')) return checkModuleAccess(authContext, 'crm');
      if (p.includes('workforce')) return checkModuleAccess(authContext, 'workforce');
      if (p.includes('campaign')) return checkModuleAccess(authContext, 'campaignhub');
      // Default to returning staffing module check if it's general workbench
      return checkModuleAccess(authContext, 'workforce');
    }
    if (p.includes('finance') || p.includes('payroll') || p.includes('invoices') || p.includes('credit-notes') || p.includes('transactions') || p.includes('payout')) return checkModuleAccess(authContext, 'finance');
    if (p.includes('administration') || p.includes('settings') || p.includes('management') || p.includes('organization')) return checkModuleAccess(authContext, 'administration');
    if (p.includes('people') || p.includes('employees')) return checkModuleAccess(authContext, 'employees');
    if (p.includes('attendance')) return checkModuleAccess(authContext, 'attendance');
    if (p.includes('leave')) return checkModuleAccess(authContext, 'leave');
    if (p.includes('performance')) return checkModuleAccess(authContext, 'performance');
    if (p.includes('recruitment') || p.includes('internal-hiring')) return checkModuleAccess(authContext, 'employees');

    if (p.includes('dashboard') || p.includes('profile')) return true;
    return false;
  }, [authContext]);

  const canView = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const canCreate = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const canEdit = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const canDelete = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const canApprove = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const canReject = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const canExport = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const canGenerateDocument = useCallback((docType?: string) => {
    return checkModuleAccess(authContext, docType || 'documents');
  }, [authContext]);

  const canManage = useCallback((moduleKey: string) => {
    return checkModuleAccess(authContext, moduleKey);
  }, [authContext]);

  const isFeatureEnabled = useCallback(() => true, []);
  const isSuperAdmin = useMemo(() => checkSuperAdmin(authContext), [authContext]);
  const getVisibleEmployees = useCallback(<T,>(items: T[]) => items, []);
  const getVisibleCandidates = useCallback(<T,>(items: T[]) => items, []);
  const getVisibleInvoices = useCallback(<T,>(items: T[]) => items, []);
  const getVisibleDocuments = useCallback(<T,>(items: T[]) => items, []);
  const landingModule = '/dashboard';

  return {
    authContext,
    activeRole,
    simulatedRole,
    setSimulatedRole,
    canAccessModule,
    canAccessPage,
    canAccessRoute,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canReject,
    canExport,
    canGenerateDocument,
    canManage,
    isFeatureEnabled,
    isSuperAdmin,
    visibleModules,
    visibleNavigation,
    dashboardWidgets,
    landingModule,
    getVisibleEmployees,
    getVisibleCandidates,
    getVisibleInvoices,
    getVisibleDocuments,
  };
}
