import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  canAccessErpArea, 
  type ErpArea, 
  isSuperAdmin as checkSuperAdmin,
  type AuthorizationContext
} from '../core/authorization/authorizationResolver';

function mapModuleToErpArea(moduleKey: string): ErpArea | null {
  const m = (moduleKey || '').toLowerCase();
  
  if (['employees', 'people', 'attendance', 'leave', 'performance', 'profile'].includes(m)) return 'People';
  
  if (['recruitment', 'openings', 'crm', 'workforce', 'client', 'associatepartner', 'campaignhub'].includes(m)) return 'Workbench';
  
  if (['finance', 'invoices', 'creditnotes', 'internalpayroll', 'transactions', 'payout'].includes(m)) return 'Finance';
  
  if (['managementcontrol', 'calendar', 'announcements'].includes(m)) return 'Administration';
  
  return null;
}

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
  const simulatedRole = null;
  const setSimulatedRole = useCallback(() => {}, []);
  const visibleModules = useMemo(() => [], []);
  const visibleNavigation = useMemo(() => [], []);
  const dashboardWidgets = useMemo(() => [], []);

  const canAccessModule = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canAccessPage = useCallback((pageKey: string) => {
    const area = mapModuleToErpArea(pageKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canAccessRoute = useCallback((path: string) => {
    const p = (path || '').toLowerCase();
    if (p.includes('workbench')) return canAccessErpArea(authContext, 'Workbench');
    if (p.includes('finance')) return canAccessErpArea(authContext, 'Finance');
    if (p.includes('administration') || p.includes('settings') || p.includes('management')) return canAccessErpArea(authContext, 'Administration');
    if (p.includes('dashboard') || p.includes('profile')) return true;
    return false;
  }, [authContext]);

  const canView = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canCreate = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canEdit = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canDelete = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canApprove = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canReject = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canExport = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canGenerateDocument = useCallback((docType?: string) => {
    const area = mapModuleToErpArea(docType || 'documents');
    return area ? canAccessErpArea(authContext, area) : false;
  }, [authContext]);

  const canManage = useCallback((moduleKey: string) => {
    const area = mapModuleToErpArea(moduleKey);
    return area ? canAccessErpArea(authContext, area) : false;
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
