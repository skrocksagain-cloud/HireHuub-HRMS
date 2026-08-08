import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  WorkforceItem,
  WorkforceFilterState,
  WorkforceKpiSummary,
  ClientPayoutImportRecord,
  OtsBillingStatus,
} from '../types/workforce';
import { workforceRepository } from '../repositories/workforceRepository';
import { useAuth } from '../../../../context/AuthContext';

const DEFAULT_FILTERS: WorkforceFilterState = {
  workforceType: 'ALL',
  client: 'ALL',
  recruiter: 'ALL',
  associatePartner: 'ALL',
  activeMonth: '2026-07',
  city: 'ALL',
  workingStatus: 'ALL',
  searchQuery: '',
};

export function useWorkforce() {
  const { user } = useAuth();
  const currentRole = (user?.role as string) || 'Super Admin';
  const userSession = {
    id: user?.employeeId || 'user-admin',
    name: user?.name || 'Super Admin',
  };

  const [rawItems, setRawItems] = useState<WorkforceItem[]>([]);
  const [payoutImports, setPayoutImports] = useState<ClientPayoutImportRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<WorkforceFilterState>(DEFAULT_FILTERS);

  const fetchWorkforceData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const items = await workforceRepository.getWorkforceItems(
        filters.activeMonth,
        currentRole,
        userSession
      );
      const imports = await workforceRepository.getPayoutImports();
      setRawItems(items);
      setPayoutImports(imports);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workforce data.');
    } finally {
      setLoading(false);
    }
  }, [filters.activeMonth, currentRole, userSession.id, userSession.name]);

  useEffect(() => {
    fetchWorkforceData();
  }, [fetchWorkforceData]);

  // Client-side filtering across search and selected dropdowns
  const filteredWorkforce = useMemo(() => {
    return rawItems.filter((item) => {
      const matchesSearch =
        !filters.searchQuery.trim() ||
        item.candidateName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.phone.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesType =
        filters.workforceType === 'ALL' || item.workforceType === filters.workforceType;

      const matchesClient =
        filters.client === 'ALL' || item.clientId === filters.client || item.clientName === filters.client;

      const matchesRecruiter =
        filters.recruiter === 'ALL' ||
        item.recruiterId === filters.recruiter ||
        item.recruiterName === filters.recruiter;

      const matchesAP =
        filters.associatePartner === 'ALL' ||
        item.associatePartnerId === filters.associatePartner ||
        item.associatePartnerName === filters.associatePartner;

      const matchesCity = filters.city === 'ALL' || item.city === filters.city;

      const matchesWorking =
        filters.workingStatus === 'ALL' || item.workingStatus === filters.workingStatus;

      return (
        matchesSearch &&
        matchesType &&
        matchesClient &&
        matchesRecruiter &&
        matchesAP &&
        matchesCity &&
        matchesWorking
      );
    });
  }, [rawItems, filters]);

  // Calculate KPI summaries
  const kpiSummary: WorkforceKpiSummary = useMemo(() => {
    const activeWorkforce = filteredWorkforce.length;
    const payrollCount = filteredWorkforce.filter((w) => w.workforceType === 'Payroll').length;
    const otsCount = filteredWorkforce.filter((w) => w.workforceType === 'OTS').length;
    const workingCount = filteredWorkforce.filter((w) => w.workingStatus === 'Working').length;
    const notWorkingCount = filteredWorkforce.filter((w) => w.workingStatus === 'Not Working').length;

    // Check if order data exists in filtered subset
    const candidatesWithOrders = filteredWorkforce.filter(
      (w) => w.supportsOrders && (w.totalOrders || 0) > 0
    );
    const hasOrderData = candidatesWithOrders.length > 0;

    let totalOrders = 0;
    let averageOrders = 0;
    let topPerformerName: string | undefined = undefined;

    if (hasOrderData) {
      totalOrders = candidatesWithOrders.reduce((sum, w) => sum + (w.totalOrders || 0), 0);
      averageOrders = Math.round(totalOrders / candidatesWithOrders.length);
      const topCandidate = [...candidatesWithOrders].sort(
        (a, b) => (b.totalOrders || 0) - (a.totalOrders || 0)
      )[0];
      topPerformerName = topCandidate ? `${topCandidate.candidateName} (${topCandidate.totalOrders} trips)` : undefined;
    }

    const eligibleForBilling = filteredWorkforce.filter((w) => w.eligibility === 'Eligible').length;
    const pendingBilling = filteredWorkforce.filter(
      (w) => w.eligibility === 'Eligible' && w.billingStatus === 'Pending'
    ).length;

    return {
      activeWorkforce,
      payrollCount,
      otsCount,
      workingCount,
      notWorkingCount,
      hasOrderData,
      totalOrders,
      averageOrders,
      topPerformerName,
      eligibleForBilling,
      pendingBilling,
    };
  }, [filteredWorkforce]);

  const updateBillingStatus = async (id: string, billingStatus: OtsBillingStatus) => {
    try {
      await workforceRepository.updateBillingStatus(id, billingStatus, userSession.name);
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const updateAssignment = async (id: string, newAssigneeId: string, newAssigneeName: string) => {
    try {
      await workforceRepository.updateAssignment(id, newAssigneeId, newAssigneeName, userSession.name);
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const executeClientTransfer = async (
    id: string,
    newClientId: string,
    newClientName: string,
    newClientType: 'Payroll' | 'OTS',
    activeDate: string
  ) => {
    try {
      await workforceRepository.executeClientTransfer(
        id,
        newClientId,
        newClientName,
        newClientType,
        activeDate,
        userSession.name
      );
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const importClientPayout = async (importRecord: ClientPayoutImportRecord) => {
    try {
      await workforceRepository.addPayoutImport(importRecord);
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const rollbackPayoutImport = async (importId: string) => {
    try {
      await workforceRepository.rollbackPayoutImport(importId, userSession.name);
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  const toggleLockImport = async (importId: string, lockState: boolean) => {
    try {
      await workforceRepository.toggleLockPayoutImport(importId, currentRole, lockState);
      await fetchWorkforceData();
    } catch (err: unknown) {
      throw err;
    }
  };

  return {
    workforce: filteredWorkforce,
    allWorkforce: rawItems,
    payoutImports,
    loading,
    error,
    filters,
    setFilters,
    kpiSummary,
    currentRole,
    userSession,
    updateBillingStatus,
    updateAssignment,
    executeClientTransfer,
    importClientPayout,
    rollbackPayoutImport,
    toggleLockImport,
    refreshWorkforce: fetchWorkforceData,
  };
}
