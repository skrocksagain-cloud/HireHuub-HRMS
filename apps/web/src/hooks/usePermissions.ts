import { useState, useCallback, useMemo } from 'react';
import { permissionService, type NavigationItem } from '../core/permissions/permissionService';
import type { RoleItem } from '../types/Admin';
import { useAuth } from '../context/AuthContext';

export function usePermissions(currentRole?: RoleItem | string) {
  const { user } = useAuth();
  const [simulatedRole, setSimulatedRoleState] = useState<RoleItem | null>(permissionService.getSimulatedRole());

  const setSimulatedRole = useCallback((role: RoleItem | null) => {
    permissionService.setSimulatedRole(role);
    setSimulatedRoleState(role);
  }, []);

  const effectiveRoleInput = currentRole ?? user?.role;

  const activeRole = useMemo(() => {
    return permissionService.getEffectiveRole(effectiveRoleInput);
  }, [effectiveRoleInput, simulatedRole?.id]);

  const canAccessModule = useCallback(
    (moduleKey: string) => permissionService.canAccessModule(activeRole, moduleKey),
    [activeRole]
  );

  const canAccessPage = useCallback(
    (pageKey: string) => permissionService.canAccessPage(activeRole, pageKey),
    [activeRole]
  );

  const canAccessRoute = useCallback(
    (path: string) => permissionService.canAccessRoute(activeRole, path),
    [activeRole]
  );

  const canView = useCallback(
    (moduleKey: string, recordDeptId?: string, recordOwnerId?: string, currentUserId?: string) =>
      permissionService.canView(activeRole, moduleKey, recordDeptId, recordOwnerId, currentUserId),
    [activeRole]
  );

  const canCreate = useCallback(
    (moduleKey: string) => permissionService.canCreate(activeRole, moduleKey),
    [activeRole]
  );

  const canEdit = useCallback(
    (moduleKey: string, recordDeptId?: string) => permissionService.canEdit(activeRole, moduleKey, recordDeptId),
    [activeRole]
  );

  const canDelete = useCallback(
    (moduleKey: string) => permissionService.canDelete(activeRole, moduleKey),
    [activeRole]
  );

  const canApprove = useCallback(
    (moduleKey: string, targetDeptId?: string, targetEmployeeId?: string) =>
      permissionService.canApprove(activeRole, moduleKey, targetDeptId, targetEmployeeId),
    [activeRole]
  );

  const canReject = useCallback(
    (moduleKey: string) => permissionService.canReject(activeRole, moduleKey),
    [activeRole]
  );

  const canExport = useCallback(
    (moduleKey: string) => permissionService.canExport(activeRole, moduleKey),
    [activeRole]
  );

  const canGenerateDocument = useCallback(
    (docType?: string) => permissionService.canGenerateDocument(activeRole, docType),
    [activeRole]
  );

  const canManage = useCallback(
    (moduleKey: string) => permissionService.canManage(activeRole, moduleKey),
    [activeRole]
  );

  const isFeatureEnabled = useCallback(
    (featureKey: string) => permissionService.isFeatureEnabled(featureKey, activeRole),
    [activeRole]
  );

  const visibleModules = useMemo(() => permissionService.getVisibleModules(activeRole), [activeRole]);
  const visibleNavigation: NavigationItem[] = useMemo(() => permissionService.getVisibleNavigation(activeRole), [activeRole]);
  const dashboardWidgets = useMemo(() => permissionService.getDashboardWidgets(activeRole), [activeRole]);
  const landingModule = useMemo(() => permissionService.getLandingModule(activeRole), [activeRole]);

  const getVisibleEmployees = useCallback(
    <T extends { departmentId?: string; id?: string; employeeId?: string }>(employees: T[], userId?: string) =>
      permissionService.getVisibleEmployees(activeRole, employees, userId),
    [activeRole]
  );

  const getVisibleCandidates = useCallback(
    <T extends { departmentId?: string; assignedRecruiterId?: string }>(candidates: T[], userId?: string) =>
      permissionService.getVisibleCandidates(activeRole, candidates, userId),
    [activeRole]
  );

  const getVisibleInvoices = useCallback(
    <T extends { id?: string; clientId?: string }>(invoices: T[]) =>
      permissionService.getVisibleInvoices(activeRole, invoices),
    [activeRole]
  );

  const getVisibleDocuments = useCallback(
    <T extends { category?: string; createdBy?: string }>(documents: T[], userId?: string) =>
      permissionService.getVisibleDocuments(activeRole, documents, userId),
    [activeRole]
  );

  return {
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
